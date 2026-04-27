(() => {
  const api = window.__GTS_ENGINE__;
  if (!api) return;

  const engine = new api.ThemeEngine();
  if (window.__GTS_BILIBILI_ADAPTER__) {
    engine.registerAdapter(window.__GTS_BILIBILI_ADAPTER__);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || typeof message !== "object") return;
    if (message.type === "SETTINGS_UPDATE") {
      engine.applySettings(message.mode, message.whitelist || []);
    }
    if (message.type === "THEME_MODE_UPDATE") {
      engine.applySettings(message.mode, []);
    }
  });

  engine.loadInitialSettings().then(({ mode, whitelist }) => {
    engine.applySettings(mode, whitelist);
  });
})();
