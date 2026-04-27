const STORAGE_KEY = "themeMode";
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

async function setMode(mode) {
  await chrome.storage.sync.set({ [STORAGE_KEY]: mode });
}

async function sendModeToTab(tabId) {
  if (!tabId) return;
  const mode = await getMode();
  chrome.tabs.sendMessage(tabId, { type: "THEME_MODE_UPDATE", mode }, () => {
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

  if (message.type === "SET_THEME_MODE") {
    const { mode } = message;
    const validMode = Object.values(THEME_MODES).includes(mode) ? mode : DEFAULT_MODE;

    setMode(validMode).then(async () => {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (canInjectToUrl(tab.url) && tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: "THEME_MODE_UPDATE", mode: validMode }, () => {
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
      sendModeToTab(sender.tab.id).then(() => sendResponse({ ok: true }));
      return true;
    }
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await sendModeToTab(tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" && canInjectToUrl(tab.url)) {
    await sendModeToTab(tabId);
  }
});
