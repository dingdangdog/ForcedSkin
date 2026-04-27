const STORAGE_KEY = "themeMode";
const WHITELIST_KEY = "siteWhitelist";
const THEME_MODES = {
  LIGHT: "light",
  DARK: "dark",
  OFF: "off"
};

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

async function sendSettingsToTab(tabId) {
  if (!tabId) return;
  const [mode, whitelist] = await Promise.all([getMode(), getWhitelist()]);
  chrome.tabs.sendMessage(tabId, { type: "SETTINGS_UPDATE", mode, whitelist }, () => {
    void chrome.runtime.lastError;
  });
}

function canInjectToUrl(url) {
  if (!url) return false;
  return /^https?:\/\//.test(url);
}

chrome.runtime.onInstalled.addListener(async () => {
  const mode = await getMode();
  if (!mode) {
    await setMode(DEFAULT_MODE);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") return;

  if (message.type === "GET_THEME_MODE") {
    getMode().then((mode) => sendResponse({ mode }));
    return true;
  }

  if (message.type === "GET_SETTINGS") {
    Promise.all([getMode(), getWhitelist()]).then(([mode, whitelist]) => sendResponse({ mode, whitelist }));
    return true;
  }

  if (message.type === "SET_THEME_MODE") {
    const { mode } = message;
    const validMode = Object.values(THEME_MODES).includes(mode) ? mode : DEFAULT_MODE;

    setMode(validMode).then(async () => {
      const whitelist = await getWhitelist();
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (canInjectToUrl(tab.url) && tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: "SETTINGS_UPDATE", mode: validMode, whitelist }, () => {
            void chrome.runtime.lastError;
          });
        }
      }
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "APPLY_THEME_TO_ACTIVE_TAB") {
    if (sender.tab && sender.tab.id) {
      sendSettingsToTab(sender.tab.id).then(() => sendResponse({ ok: true }));
      return true;
    }
  }

  if (message.type === "SET_WHITELIST") {
    const whitelist = normalizeWhitelist(message.whitelist || []);
    setWhitelist(whitelist).then(async () => {
      const mode = await getMode();
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (canInjectToUrl(tab.url) && tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: "SETTINGS_UPDATE", mode, whitelist }, () => {
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
