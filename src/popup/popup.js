const statusText = document.getElementById("statusText");
const radios = Array.from(document.querySelectorAll('input[name="themeMode"]'));
const siteHostText = document.getElementById("siteHostText");
const whitelistStateText = document.getElementById("whitelistStateText");
const addWhitelistBtn = document.getElementById("addWhitelistBtn");
const removeWhitelistBtn = document.getElementById("removeWhitelistBtn");

const MODE_LABEL = {
  light: "亮色主题",
  dark: "暗色主题",
  off: "不修改"
};

let currentMode = "off";
let currentWhitelist = [];
let currentHostname = "";

function setPopupTheme(mode) {
  document.body.setAttribute("data-theme", mode || "off");
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

function isHostInWhitelist(hostname, whitelist) {
  if (!hostname) return false;
  return whitelist.some((entry) => hostname === entry || hostname.endsWith(`.${entry}`));
}

async function getCurrentTabHostname() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tabs[0]?.url;
  if (!url || !/^https?:\/\//.test(url)) return "";
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function renderWhitelistState() {
  const inWhitelist = isHostInWhitelist(currentHostname, currentWhitelist);
  if (!currentHostname) {
    siteHostText.textContent = "当前标签页不是可识别的网站";
    whitelistStateText.textContent = "白名单状态：不可操作";
    addWhitelistBtn.disabled = true;
    removeWhitelistBtn.disabled = true;
    return;
  }
  siteHostText.textContent = currentHostname;
  whitelistStateText.textContent = `白名单状态：${inWhitelist ? "已加入" : "未加入"}`;
  addWhitelistBtn.disabled = inWhitelist;
  removeWhitelistBtn.disabled = !inWhitelist;
}

async function saveWhitelist(nextWhitelist) {
  const response = await chrome.runtime.sendMessage({ type: "SET_WHITELIST", whitelist: nextWhitelist });
  currentWhitelist = normalizeWhitelist(response?.whitelist || nextWhitelist);
  renderWhitelistState();
}

async function loadCurrentMode() {
  const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
  currentMode = response?.mode || "off";
  currentWhitelist = normalizeWhitelist(response?.whitelist || []);
  currentHostname = await getCurrentTabHostname();
  const target = radios.find((item) => item.value === currentMode);
  if (target) {
    target.checked = true;
  }
  updateStatus(currentMode);
  renderWhitelistState();
}

function updateStatus(mode) {
  const label = MODE_LABEL[mode] || MODE_LABEL.off;
  statusText.textContent = `当前状态：${label}`;
  setPopupTheme(mode);
}

async function onModeChange(event) {
  currentMode = event.target.value;
  updateStatus(currentMode);
  await chrome.runtime.sendMessage({ type: "SET_THEME_MODE", mode: currentMode });
}

async function addCurrentSiteToWhitelist() {
  if (!currentHostname) return;
  const normalizedHost = normalizeWhitelistEntry(currentHostname);
  const next = normalizeWhitelist([...currentWhitelist, normalizedHost]);
  await saveWhitelist(next);
  statusText.textContent = `已加入白名单：${normalizedHost}`;
}

async function removeCurrentSiteFromWhitelist() {
  if (!currentHostname) return;
  const next = currentWhitelist.filter((entry) => currentHostname !== entry && !currentHostname.endsWith(`.${entry}`));
  await saveWhitelist(next);
  statusText.textContent = `已移除白名单：${currentHostname}`;
}

radios.forEach((radio) => {
  radio.addEventListener("change", onModeChange);
});

addWhitelistBtn.addEventListener("click", addCurrentSiteToWhitelist);
removeWhitelistBtn.addEventListener("click", removeCurrentSiteFromWhitelist);

loadCurrentMode();
