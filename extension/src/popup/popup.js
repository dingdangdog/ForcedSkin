// ── i18n helpers ──────────────────────────────────────────────────────────────
const i18n = (key, substitutions) => chrome.i18n.getMessage(key, substitutions) || key;

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const msg = i18n(key);
    if (msg) el.textContent = msg;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    const msg = i18n(key);
    if (msg) el.placeholder = msg;
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.dataset.i18nTitle;
    const msg = i18n(key);
    if (msg) el.title = msg;
  });
}

// ── DOM refs ───────────────────────────────────────────────────────────────────
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
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const syncBtn = document.getElementById("syncBtn");
const syncLightName = document.getElementById("syncLightName");
const syncDarkName = document.getElementById("syncDarkName");
const lightThemeName = document.getElementById("lightThemeName");
const darkThemeName = document.getElementById("darkThemeName");
const lightThemeStrip = document.getElementById("lightThemeStrip");
const darkThemeStrip = document.getElementById("darkThemeStrip");
const lightThemeChips = document.getElementById("lightThemeChips");
const darkThemeChips = document.getElementById("darkThemeChips");

// ── State ──────────────────────────────────────────────────────────────────────
const MODE_LABEL = {
  light: i18n("statusLight"),
  dark: i18n("statusDark"),
  off: i18n("statusOff"),
};

let currentMode = "off";
let currentWhitelist = [];
let currentHostname = "";
let lastSettingsSnapshot = null;

// ── Popup theme ────────────────────────────────────────────────────────────────
function setPopupTheme(mode) {
  document.body.setAttribute("data-theme", mode || "off");
}

// ── Whitelist utils ────────────────────────────────────────────────────────────
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
    siteHostText.textContent = i18n("siteNotApplicable");
    whitelistStateText.textContent = i18n("whitelistStatus") + i18n("whitelistNotApplicable");
    addWhitelistBtn.disabled = true;
    removeWhitelistBtn.disabled = true;
    return;
  }
  siteHostText.textContent = currentHostname;
  whitelistStateText.textContent = i18n("whitelistStatus") + (inWhitelist ? i18n("whitelistAdded") : i18n("whitelistNotAdded"));
  addWhitelistBtn.disabled = inWhitelist;
  removeWhitelistBtn.disabled = !inWhitelist;
}

async function saveWhitelist(nextWhitelist) {
  const response = await chrome.runtime.sendMessage({ type: "SET_WHITELIST", whitelist: nextWhitelist });
  currentWhitelist = normalizeWhitelist(response?.whitelist || nextWhitelist);
  renderWhitelistState();
}

function renderThemeVariantRows() {
  const src = lastSettingsSnapshot;
  if (!src || !lightThemeStrip || !darkThemeStrip) return;
  const catalog = src.catalog || { light: [], dark: [] };

  const showLight = currentMode === "light" && catalog.light?.length > 0;
  const showDark = currentMode === "dark" && catalog.dark?.length > 0;
  lightThemeStrip.classList.toggle("hidden", !showLight);
  darkThemeStrip.classList.toggle("hidden", !showDark);

  fillThemeChips(lightThemeChips, catalog.light, src.pickLight, "light");
  fillThemeChips(darkThemeChips, catalog.dark, src.pickDark, "dark");
}

function fillThemeChips(container, list, selectedName, mode) {
  if (!container) return;
  container.innerHTML = "";
  for (const t of list || []) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-chip" + (t.name === selectedName ? " theme-chip-active" : "");
    btn.title = t.displayName || t.name;
    const swatch = document.createElement("span");
    swatch.className = "theme-chip-swatch";
    swatch.style.background = t.colors?.background || "#888";
    btn.appendChild(swatch);
    const label = document.createElement("span");
    label.className = "theme-chip-label";
    label.textContent = t.displayName || t.name;
    btn.addEventListener("click", async () => {
      const res = await chrome.runtime.sendMessage({ type: "APPLY_THEME_VARIANT", mode, themeName: t.name });
      if (res?.ok) await loadCurrentMode();
    });
    container.appendChild(btn);
  }
}

// ── Load mode ──────────────────────────────────────────────────────────────────
async function loadCurrentMode() {
  const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
  lastSettingsSnapshot = response;
  currentMode = response?.mode || "off";
  currentWhitelist = normalizeWhitelist(response?.whitelist || []);
  currentHostname = await getCurrentTabHostname();
  const target = radios.find((item) => item.value === currentMode);
  if (target) target.checked = true;
  updateStatus(currentMode);
  renderWhitelistState();

  if (response?.lightTheme) lightThemeName.textContent = response.lightTheme;
  if (response?.darkTheme) darkThemeName.textContent = response.darkTheme;
  renderThemeVariantRows();
}

function updateStatus(mode) {
  const label = MODE_LABEL[mode] || MODE_LABEL.off;
  statusText.textContent = i18n("currentStatus", [label]);
  setPopupTheme(mode);
}

async function onModeChange(event) {
  currentMode = event.target.value;
  updateStatus(currentMode);
  renderThemeVariantRows();
  await chrome.runtime.sendMessage({ type: "SET_THEME_MODE", mode: currentMode });
}

async function addCurrentSiteToWhitelist() {
  if (!currentHostname) return;
  const normalizedHost = normalizeWhitelistEntry(currentHostname);
  const next = normalizeWhitelist([...currentWhitelist, normalizedHost]);
  await saveWhitelist(next);
  statusText.textContent = i18n("addedToWhitelist", [normalizedHost]);
}

async function removeCurrentSiteFromWhitelist() {
  if (!currentHostname) return;
  const next = currentWhitelist.filter((entry) => currentHostname !== entry && !currentHostname.endsWith(`.${entry}`));
  await saveWhitelist(next);
  statusText.textContent = i18n("removedFromWhitelist", [currentHostname]);
}

// ── Account ────────────────────────────────────────────────────────────────────
async function renderAccountState() {
  const response = await chrome.runtime.sendMessage({ type: "GET_USER_INFO" });
  const user = response?.user;

  if (user) {
    userBadge.classList.remove("hidden");
    userNameEl.textContent = user.name || user.username;
    loginSection.classList.add("hidden");
    syncSection.classList.remove("hidden");
    syncLightName.textContent = user.lightTheme || i18n("syncDefault");
    syncDarkName.textContent = user.darkTheme || i18n("syncDefault");
  } else {
    userBadge.classList.add("hidden");
    loginSection.classList.remove("hidden");
    syncSection.classList.add("hidden");
  }
}

loginBtn.addEventListener("click", async () => {
  loginBtn.disabled = true;
  loginBtn.textContent = i18n("loggingInOauth");
  loginError.classList.add("hidden");

  const response = await chrome.runtime.sendMessage({ type: "LOGIN_WITH_OAUTH" });
  loginBtn.disabled = false;
  loginBtn.textContent = i18n("loginBtnOauth");

  if (response?.ok) {
    await renderAccountState();
    await chrome.runtime.sendMessage({ type: "SYNC_THEME" });
    await loadCurrentMode();
    statusText.textContent = i18n("loginSuccessOauth");
  } else {
    loginError.textContent = response?.error || i18n("loginFailOauth");
    loginError.classList.remove("hidden");
  }
});

logoutBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "LOGOUT" });
  await renderAccountState();
  statusText.textContent = i18n("loggedOut");
});

syncBtn.addEventListener("click", async () => {
  syncBtn.disabled = true;
  syncBtn.textContent = i18n("syncing");
  const response = await chrome.runtime.sendMessage({ type: "SYNC_THEME" });
  syncBtn.disabled = false;
  syncBtn.textContent = i18n("syncBtn");
  if (response?.ok) {
    statusText.textContent = i18n("synced");
    await renderAccountState();
    await loadCurrentMode();
  } else {
    statusText.textContent = response?.error || i18n("syncFailed");
  }
});

// ── Init ───────────────────────────────────────────────────────────────────────
radios.forEach((radio) => radio.addEventListener("change", onModeChange));
addWhitelistBtn.addEventListener("click", addCurrentSiteToWhitelist);
removeWhitelistBtn.addEventListener("click", removeCurrentSiteFromWhitelist);

applyI18n();
loadCurrentMode();
renderAccountState();
