(() => {
  const api = window.__GTS_ENGINE__;
  const formulaKit = window.__GTS_ADAPTER_FORMULA__;
  if (!api || !formulaKit || typeof formulaKit.install !== "function") return;

  let engineRef = null;

  function runCachedAdapterFormulas() {
    api.clearAdapterPreQueue();
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(["gtsRemoteAdapterScripts"], (data) => {
          const list = data?.gtsRemoteAdapterScripts;
          if (!Array.isArray(list)) {
            resolve();
            return;
          }
          for (const row of list) {
            const name = typeof row?.name === "string" ? row.name : "adapter";
            const code = row?.code;
            if (typeof code !== "string" || !code.trim()) continue;
            const trimmed = code.trim();
            if (!trimmed.startsWith("{")) {
              console.warn("[ForcedSkin] adapter skipped (need JSON formula):", name);
              continue;
            }
            try {
              const parsed = JSON.parse(trimmed);
              if (!formulaKit.install(api, parsed)) {
                console.warn("[ForcedSkin] adapter formula rejected:", name);
              }
            } catch (err) {
              console.warn("[ForcedSkin] adapter formula parse/install failed:", name, err);
            }
          }
          resolve();
        });
      } catch {
        resolve();
      }
    });
  }

  async function bootEngine() {
    await runCachedAdapterFormulas();
    const engine = new api.ThemeEngine();
    api.drainAdapterPreQueue(engine);
    engineRef = engine;

    chrome.runtime.onMessage.addListener((message) => {
      if (!message || typeof message !== "object") return;
      if (message.type === "SETTINGS_UPDATE") {
        if (!engineRef) return;
        if (message.palette) engineRef.setPalette(message.palette);
        engineRef.applySettings(message.mode, message.whitelist || []);
      }
      if (message.type === "THEME_MODE_UPDATE") {
        if (!engineRef) return;
        engineRef.applySettings(message.mode, []);
      }
      if (message.type === "ADAPTERS_UPDATE") {
        void reloadAdaptersAndReapply();
      }
    });

    const { mode, whitelist, palette } = await engine.loadInitialSettings();
    if (palette) engine.setPalette(palette);
    engine.applySettings(mode, whitelist);
  }

  async function reloadAdaptersAndReapply() {
    if (!engineRef) return;
    engineRef.resetAdapters();
    await runCachedAdapterFormulas();
    api.drainAdapterPreQueue(engineRef);
    try {
      const [syncData, localData] = await Promise.all([
        chrome.storage.sync.get(["themeMode", "siteWhitelist"]),
        chrome.storage.local.get(["gtsPalette"]),
      ]);
      const mode = syncData.themeMode || api.MODES.OFF;
      const whitelist = Array.isArray(syncData.siteWhitelist) ? syncData.siteWhitelist : [];
      if (localData.gtsPalette) engineRef.setPalette(localData.gtsPalette);
      engineRef.applySettings(mode, whitelist);
    } catch {
      /* ignore */
    }
  }

  void bootEngine();
})();
