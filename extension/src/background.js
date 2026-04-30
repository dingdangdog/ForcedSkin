const STORAGE_KEY = "themeMode";
const WHITELIST_KEY = "siteWhitelist";
const USER_KEY = "gtsUser";
const TOKEN_KEY = "gtsToken";
const PALETTE_KEY = "gtsPalette";
const CATALOG_KEY = "gtsThemeCatalog";
const PICK_LIGHT_KEY = "gtsPickLight";
const PICK_DARK_KEY = "gtsPickDark";

const API_BASE = "https://forcedskin.com";

const ADAPTERS_SCRIPTS_KEY = "gtsRemoteAdapterScripts";

const THEME_MODES = { LIGHT: "light", DARK: "dark", OFF: "off" };
const DEFAULT_MODE = THEME_MODES.OFF;

async function getMode() {
  const data = await chrome.storage.sync.get(STORAGE_KEY);
  return data[STORAGE_KEY] || DEFAULT_MODE;
}

function normalizeWhitelistEntry(entry) {
  if (typeof entry !== "string") return "";
  const trimmed = entry.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
}

function normalizeWhitelist(list) {
  if (!Array.isArray(list)) return [];
  const unique = new Set();
  list.forEach((item) => {
    const normalized = normalizeWhitelistEntry(item);
    if (normalized) unique.add(normalized);
  });
  return Array.from(unique);
}

async function getWhitelist() {
  const data = await chrome.storage.sync.get(WHITELIST_KEY);
  return normalizeWhitelist(data[WHITELIST_KEY] || []);
}

async function setMode(mode) {
  await chrome.storage.sync.set({ [STORAGE_KEY]: mode });
}

async function setWhitelist(whitelist) {
  await chrome.storage.sync.set({ [WHITELIST_KEY]: normalizeWhitelist(whitelist) });
}

async function getStoredUser() {
  const data = await chrome.storage.local.get([USER_KEY, TOKEN_KEY]);
  return { user: data[USER_KEY] || null, token: data[TOKEN_KEY] || null };
}

async function getStoredPalette() {
  const data = await chrome.storage.local.get(PALETTE_KEY);
  return data[PALETTE_KEY] || null;
}

async function sendSettingsToTab(tabId) {
  if (!tabId) return;
  const [mode, whitelist, palette] = await Promise.all([getMode(), getWhitelist(), getStoredPalette()]);
  chrome.tabs.sendMessage(tabId, { type: "SETTINGS_UPDATE", mode, whitelist, palette }, () => {
    void chrome.runtime.lastError;
  });
}

function canInjectToUrl(url) {
  if (!url) return false;
  return /^https?:\/\//.test(url);
}

function parseOauthResult(redirectedTo) {
  const url = new URL(redirectedTo);
  const token = url.searchParams.get("token");
  if (!token) {
    const error = url.searchParams.get("error") || "登录失败";
    throw new Error(error);
  }
  return {
    token,
    user: {
      id: url.searchParams.get("id") || "",
      name: url.searchParams.get("name") || "",
      email: url.searchParams.get("email") || "",
      avatar: url.searchParams.get("avatar") || "",
      roles: url.searchParams.get("roles") || "user",
      lightTheme: url.searchParams.get("lightTheme") || null,
      darkTheme: url.searchParams.get("darkTheme") || null,
    },
  };
}

async function doOauthLogin() {
  if (!chrome.identity?.launchWebAuthFlow) {
    throw new Error("当前浏览器不支持 OAuth 登录");
  }

  const redirectUri = chrome.identity.getRedirectURL("forcedskin-auth");
  const authUrl = `${API_BASE}/api/extension/auth/bridge?redirect_uri=${encodeURIComponent(redirectUri)}`;

  const redirectedTo = await chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true,
  });

  if (!redirectedTo) throw new Error("未完成登录流程");
  return parseOauthResult(redirectedTo);
}

async function fetchExtensionAdapters() {
  const res = await fetch(`${API_BASE}/api/pub/extension-adapters`);
  if (!res.ok) throw new Error("获取适配器脚本失败");
  const json = await res.json();
  if (json.c !== 200) throw new Error(json.m || "获取适配器脚本失败");
  return json.d;
}

/** 拉取已上线适配器脚本写入本地缓存，并通知各 Tab 热重载 */
async function syncAdapters() {
  try {
    const data = await fetchExtensionAdapters();
    const raw = Array.isArray(data?.adapters) ? data.adapters : [];
    const scripts = raw
      .filter((a) => a && typeof a.name === "string" && typeof a.code === "string" && a.code.trim())
      .map((a) => ({ name: a.name, code: a.code }));
    await chrome.storage.local.set({ [ADAPTERS_SCRIPTS_KEY]: scripts });

    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (canInjectToUrl(tab.url) && tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: "ADAPTERS_UPDATE" }, () => void chrome.runtime.lastError);
      }
    }
    return { ok: true, count: scripts.length };
  } catch (err) {
    console.warn("[ForcedSkin] syncAdapters:", err?.message || err);
    return { ok: false, error: err?.message || String(err) };
  }
}

// 从官网拉取用户主题配色与候选列表
async function fetchExtensionSettings(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE}/api/pub/extension-settings`, { headers });
  if (!res.ok) throw new Error("获取设置失败");
  const json = await res.json();
  if (json.c !== 200) throw new Error(json.m || "获取设置失败");
  return json.d;
}

function buildPaletteFromCatalog(catalog, pickLight, pickDark) {
  const palette = {};
  if (!catalog || typeof catalog !== "object") return null;
  const lightRow = catalog.light?.find((t) => t.name === pickLight) || catalog.light?.[0];
  const darkRow = catalog.dark?.find((t) => t.name === pickDark) || catalog.dark?.[0];
  if (lightRow?.colors) palette.light = lightRow.colors;
  if (darkRow?.colors) palette.dark = darkRow.colors;
  return Object.keys(palette).length ? palette : null;
}

/** 将接口结果写入 catalog / 当前选中 / palette；已登录以服务端选中为准，游客保留合法的本机选中 */
async function persistThemeStateFromApi(settings) {
  const catalog = {
    light: Array.isArray(settings.lightOptions) ? settings.lightOptions : [],
    dark: Array.isArray(settings.darkOptions) ? settings.darkOptions : [],
  };
  await chrome.storage.local.set({ [CATALOG_KEY]: catalog });

  const prev = await chrome.storage.local.get([PICK_LIGHT_KEY, PICK_DARK_KEY]);
  let pickLight = prev[PICK_LIGHT_KEY];
  let pickDark = prev[PICK_DARK_KEY];

  if (settings.isLoggedIn) {
    pickLight = settings.light?.name || pickLight;
    pickDark = settings.dark?.name || pickDark;
  } else {
    if (!catalog.light.some((t) => t.name === pickLight)) pickLight = settings.light?.name || catalog.light[0]?.name;
    if (!catalog.dark.some((t) => t.name === pickDark)) pickDark = settings.dark?.name || catalog.dark[0]?.name;
  }

  if (!pickLight && catalog.light[0]) pickLight = catalog.light[0].name;
  if (!pickDark && catalog.dark[0]) pickDark = catalog.dark[0].name;

  await chrome.storage.local.set({ [PICK_LIGHT_KEY]: pickLight, [PICK_DARK_KEY]: pickDark });

  const palette = buildPaletteFromCatalog(catalog, pickLight, pickDark);
  await chrome.storage.local.set({ [PALETTE_KEY]: palette });

  const { user } = await getStoredUser();
  if (user && settings.isLoggedIn) {
    const l = catalog.light.find((t) => t.name === pickLight);
    const d = catalog.dark.find((t) => t.name === pickDark);
    await chrome.storage.local.set({
      [USER_KEY]: {
        ...user,
        lightTheme: l?.displayName ?? user.lightTheme,
        darkTheme: d?.displayName ?? user.darkTheme,
      },
    });
  }

  return { catalog, pickLight, pickDark, palette };
}

async function broadcastPalette(palette) {
  const [mode, whitelist] = await Promise.all([getMode(), getWhitelist()]);
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (canInjectToUrl(tab.url) && tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: "SETTINGS_UPDATE", mode, whitelist, palette }, () => void chrome.runtime.lastError);
    }
  }
}

// 同步主题：拉取并存储 palette + 候选列表
async function syncTheme() {
  await syncAdapters();
  const { token } = await getStoredUser();
  try {
    const settings = await fetchExtensionSettings(token);
    const { catalog, pickLight, pickDark, palette } = await persistThemeStateFromApi(settings);
    await broadcastPalette(palette);
    const pl = catalog.light.find((t) => t.name === pickLight);
    const pd = catalog.dark.find((t) => t.name === pickDark);
    return {
      ok: true,
      lightTheme: pl?.displayName ?? settings.light?.displayName,
      darkTheme: pd?.displayName ?? settings.dark?.displayName,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const mode = await getMode();
  if (!mode) await setMode(DEFAULT_MODE);
  await syncAdapters();
  await syncTheme();
});

chrome.runtime.onStartup?.addListener(() => {
  void syncAdapters();
  void syncTheme();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") return;

  if (message.type === "GET_SETTINGS") {
    (async () => {
      try {
        let local = await chrome.storage.local.get([CATALOG_KEY, PICK_LIGHT_KEY, PICK_DARK_KEY]);
        const cat = local[CATALOG_KEY];
        const empty =
          !cat || ((!cat.light || cat.light.length === 0) && (!cat.dark || cat.dark.length === 0));
        if (empty) {
          const { token } = await getStoredUser();
          const settings = await fetchExtensionSettings(token);
          await persistThemeStateFromApi(settings);
          local = await chrome.storage.local.get([CATALOG_KEY, PICK_LIGHT_KEY, PICK_DARK_KEY]);
        }
        const [mode, whitelist, { user }] = await Promise.all([getMode(), getWhitelist(), getStoredUser()]);
        const catalog = local[CATALOG_KEY] || { light: [], dark: [] };
        const pickLight = local[PICK_LIGHT_KEY];
        const pickDark = local[PICK_DARK_KEY];
        const lightMeta = catalog.light.find((t) => t.name === pickLight) || catalog.light[0];
        const darkMeta = catalog.dark.find((t) => t.name === pickDark) || catalog.dark[0];
        const palette = await getStoredPalette();
        sendResponse({
          mode,
          whitelist,
          user,
          lightTheme: lightMeta?.displayName || user?.lightTheme || null,
          darkTheme: darkMeta?.displayName || user?.darkTheme || null,
          catalog,
          pickLight: lightMeta?.name || null,
          pickDark: darkMeta?.name || null,
          palette,
        });
      } catch {
        const [mode, whitelist, { user }] = await Promise.all([getMode(), getWhitelist(), getStoredUser()]);
        sendResponse({
          mode,
          whitelist,
          user,
          lightTheme: user?.lightTheme || null,
          darkTheme: user?.darkTheme || null,
          catalog: { light: [], dark: [] },
          pickLight: null,
          pickDark: null,
          palette: null,
        });
      }
    })();
    return true;
  }

  if (message.type === "GET_USER_INFO") {
    getStoredUser().then(({ user }) => sendResponse({ user }));
    return true;
  }

  if (message.type === "SET_THEME_MODE") {
    const { mode } = message;
    const validMode = Object.values(THEME_MODES).includes(mode) ? mode : DEFAULT_MODE;
    setMode(validMode).then(async () => {
      const [whitelist, palette] = await Promise.all([getWhitelist(), getStoredPalette()]);
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (canInjectToUrl(tab.url) && tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: "SETTINGS_UPDATE", mode: validMode, whitelist, palette }, () => {
            void chrome.runtime.lastError;
          });
        }
      }
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "LOGIN_WITH_OAUTH") {
    doOauthLogin()
      .then(async ({ token, user }) => {
        await chrome.storage.local.set({
          [USER_KEY]: user,
          [TOKEN_KEY]: token,
        });
        sendResponse({ ok: true });
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === "LOGOUT") {
    chrome.storage.local.remove([USER_KEY, TOKEN_KEY, PALETTE_KEY, CATALOG_KEY, PICK_LIGHT_KEY, PICK_DARK_KEY]).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "APPLY_THEME_VARIANT") {
    const { mode, themeName } = message;
    if (!themeName || (mode !== THEME_MODES.LIGHT && mode !== THEME_MODES.DARK)) {
      sendResponse({ ok: false, error: "无效参数" });
      return;
    }
    (async () => {
      const data = await chrome.storage.local.get([CATALOG_KEY, PICK_LIGHT_KEY, PICK_DARK_KEY]);
      const catalog = data[CATALOG_KEY] || { light: [], dark: [] };
      const list = mode === THEME_MODES.LIGHT ? catalog.light : catalog.dark;
      if (!list.some((t) => t.name === themeName)) {
        sendResponse({ ok: false, error: "主题不在列表中" });
        return;
      }

      const { token, user } = await getStoredUser();
      if (token) {
        try {
          const res = await fetch(`${API_BASE}/api/pub/extension-theme-select`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(mode === THEME_MODES.LIGHT ? { lightTheme: themeName } : { darkTheme: themeName }),
          });
          const json = await res.json();
          if (json.c !== 200) {
            console.warn("[ForcedSkin] extension-theme-select:", json.m);
          }
        } catch (e) {
          console.warn("[ForcedSkin] extension-theme-select:", e?.message || e);
        }
      }

      if (mode === THEME_MODES.LIGHT) {
        await chrome.storage.local.set({ [PICK_LIGHT_KEY]: themeName });
      } else {
        await chrome.storage.local.set({ [PICK_DARK_KEY]: themeName });
      }

      const nextLocal = await chrome.storage.local.get([CATALOG_KEY, PICK_LIGHT_KEY, PICK_DARK_KEY]);
      const nextCat = nextLocal[CATALOG_KEY] || { light: [], dark: [] };
      const palette = buildPaletteFromCatalog(nextCat, nextLocal[PICK_LIGHT_KEY], nextLocal[PICK_DARK_KEY]);
      await chrome.storage.local.set({ [PALETTE_KEY]: palette });

      if (user) {
        const l = nextCat.light.find((t) => t.name === nextLocal[PICK_LIGHT_KEY]);
        const d = nextCat.dark.find((t) => t.name === nextLocal[PICK_DARK_KEY]);
        await chrome.storage.local.set({
          [USER_KEY]: {
            ...user,
            lightTheme: l?.displayName ?? user.lightTheme,
            darkTheme: d?.displayName ?? user.darkTheme,
          },
        });
      }

      await broadcastPalette(palette);
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message.type === "SYNC_THEME") {
    syncTheme().then((result) => sendResponse(result));
    return true;
  }

  if (message.type === "SET_WHITELIST") {
    const whitelist = normalizeWhitelist(message.whitelist || []);
    setWhitelist(whitelist).then(async () => {
      const [mode, palette] = await Promise.all([getMode(), getStoredPalette()]);
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (canInjectToUrl(tab.url) && tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: "SETTINGS_UPDATE", mode, whitelist, palette }, () => {
            void chrome.runtime.lastError;
          });
        }
      }
      sendResponse({ ok: true, whitelist });
    });
    return true;
  }

  if (message.type === "GET_WHITELIST") {
    getWhitelist().then((whitelist) => sendResponse({ whitelist }));
    return true;
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await sendSettingsToTab(tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" && canInjectToUrl(tab.url)) {
    await sendSettingsToTab(tabId);
  }
});
