const statusText = document.getElementById("statusText");
const radios = Array.from(document.querySelectorAll('input[name="themeMode"]'));
const siteHostText = document.getElementById("siteHostText");
const whitelistStateText = document.getElementById("whitelistStateText");
const addWhitelistBtn = document.getElementById("addWhitelistBtn");
const removeWhitelistBtn = document.getElementById("removeWhitelistBtn");
const userBadge = document.getElementById("userBadge");
const userNameEl = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");
const loginSection = document.getElementById("loginSection");
const syncSection = document.getElementById("syncSection");
const loginUsernameEl = document.getElementById("loginUsername");
const loginPasswordEl = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const syncBtn = document.getElementById("syncBtn");
const syncLightName = document.getElementById("syncLightName");
const syncDarkName = document.getElementById("syncDarkName");
const lightThemeName = document.getElementById("lightThemeName");
const darkThemeName = document.getElementById("darkThemeName");

const MODE_LABEL = { light: "亮色主题", dark: "暗色主题", off: "不修改" };

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
  try { return new URL(url).hostname.toLowerCase(); } catch { return ""; }
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
  if (target) target.checked = true;
  updateStatus(currentMode);
  renderWhitelistState();

  // 显示主题名称
  if (response?.lightTheme) lightThemeName.textContent = response.lightTheme;
  if (response?.darkTheme) darkThemeName.textContent = response.darkTheme;
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

// ---- 登录 / 账号 逻辑 ----

async function renderAccountState() {
  const response = await chrome.runtime.sendMessage({ type: "GET_USER_INFO" });
  const user = response?.user;

  if (user) {
    userBadge.classList.remove("hidden");
    userNameEl.textContent = user.name || user.username;
    loginSection.classList.add("hidden");
    syncSection.classList.remove("hidden");
    syncLightName.textContent = user.lightTheme || "默认";
    syncDarkName.textContent = user.darkTheme || "默认";
  } else {
    userBadge.classList.add("hidden");
    loginSection.classList.remove("hidden");
    syncSection.classList.add("hidden");
  }
}

loginBtn.addEventListener("click", async () => {
  const username = loginUsernameEl.value.trim();
  const password = loginPasswordEl.value;
  if (!username || !password) {
    loginError.textContent = "请填写用户名和密码";
    loginError.classList.remove("hidden");
    return;
  }
  loginBtn.disabled = true;
  loginBtn.textContent = "登录中…";
  loginError.classList.add("hidden");

  const response = await chrome.runtime.sendMessage({ type: "LOGIN", username, password });
  loginBtn.disabled = false;
  loginBtn.textContent = "登录";

  if (response?.ok) {
    await renderAccountState();
    await chrome.runtime.sendMessage({ type: "SYNC_THEME" });
    statusText.textContent = "登录成功，主题已同步";
  } else {
    loginError.textContent = response?.error || "登录失败，请检查账号密码";
    loginError.classList.remove("hidden");
  }
});

logoutBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "LOGOUT" });
  await renderAccountState();
  statusText.textContent = "已退出登录";
});

syncBtn.addEventListener("click", async () => {
  syncBtn.disabled = true;
  syncBtn.textContent = "同步中…";
  const response = await chrome.runtime.sendMessage({ type: "SYNC_THEME" });
  syncBtn.disabled = false;
  syncBtn.textContent = "同步主题配色";
  if (response?.ok) {
    statusText.textContent = "主题已同步";
    await renderAccountState();
    if (response.lightTheme) lightThemeName.textContent = response.lightTheme;
    if (response.darkTheme) darkThemeName.textContent = response.darkTheme;
  } else {
    statusText.textContent = response?.error || "同步失败";
  }
});

radios.forEach((radio) => radio.addEventListener("change", onModeChange));
addWhitelistBtn.addEventListener("click", addCurrentSiteToWhitelist);
removeWhitelistBtn.addEventListener("click", removeCurrentSiteFromWhitelist);

loadCurrentMode();
renderAccountState();
