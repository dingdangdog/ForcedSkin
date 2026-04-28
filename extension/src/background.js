const STORAGE_KEY = "themeMode";
const WHITELIST_KEY = "siteWhitelist";
const USER_KEY = "gtsUser";
const TOKEN_KEY = "gtsToken";
const PALETTE_KEY = "gtsPalette";

const API_BASE = "https://forcedskin.com";

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

// 登录并获取 token
async function doLogin(username, password) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("网络错误");
  const json = await res.json();
  if (json.c !== 200 || !json.d) throw new Error(json.m || "登录失败");
  return json.d; // { id, username, name, email, lightTheme, darkTheme, token }
}

// 从官网拉取用户主题配色
async function fetchExtensionSettings(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE}/api/pub/extension-settings`, { headers });
  if (!res.ok) throw new Error("获取设置失败");
  const json = await res.json();
  if (json.c !== 200) throw new Error(json.m || "获取设置失败");
  return json.d; // { isLoggedIn, light: { name, displayName, colors }, dark: { ... } }
}

// 同步主题：拉取并存储 palette
async function syncTheme() {
  const { token, user } = await getStoredUser();
  try {
    const settings = await fetchExtensionSettings(token);

    const palette = {};
    if (settings.light?.colors) palette.light = settings.light.colors;
    if (settings.dark?.colors) palette.dark = settings.dark.colors;

    await chrome.storage.local.set({ [PALETTE_KEY]: Object.keys(palette).length ? palette : null });

    // 更新 user 中的 lightTheme / darkTheme
    if (user && settings.isLoggedIn) {
      const updated = {
        ...user,
        lightTheme: settings.light?.displayName || user.lightTheme,
        darkTheme: settings.dark?.displayName || user.darkTheme,
      };
      await chrome.storage.local.set({ [USER_KEY]: updated });
    }

    // 广播给所有页面
    const [mode, whitelist] = await Promise.all([getMode(), getWhitelist()]);
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (canInjectToUrl(tab.url) && tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: "SETTINGS_UPDATE", mode, whitelist, palette: Object.keys(palette).length ? palette : null }, () => {
          void chrome.runtime.lastError;
        });
      }
    }

    return { ok: true, lightTheme: settings.light?.displayName, darkTheme: settings.dark?.displayName };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const mode = await getMode();
  if (!mode) await setMode(DEFAULT_MODE);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") return;

  if (message.type === "GET_SETTINGS") {
    Promise.all([getMode(), getWhitelist(), getStoredUser()]).then(([mode, whitelist, { user }]) => {
      sendResponse({
        mode,
        whitelist,
        lightTheme: user?.lightTheme || null,
        darkTheme: user?.darkTheme || null,
      });
    });
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

  if (message.type === "LOGIN") {
    const { username, password } = message;
    doLogin(username, password)
      .then(async (userData) => {
        await chrome.storage.local.set({
          [USER_KEY]: { id: userData.id, username: userData.username, name: userData.name, lightTheme: userData.lightTheme, darkTheme: userData.darkTheme },
          [TOKEN_KEY]: userData.token,
        });
        sendResponse({ ok: true });
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === "LOGOUT") {
    chrome.storage.local.remove([USER_KEY, TOKEN_KEY, PALETTE_KEY]).then(() => {
      sendResponse({ ok: true });
    });
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
