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

const OFFICIAL_SITE = "https://forcedskin.com";

// ── DOM ───────────────────────────────────────────────────────────────────────
const statusText = document.getElementById("statusText");
const radios = Array.from(document.querySelectorAll('input[name="themeMode"]'));
const siteHostText = document.getElementById("siteHostText");
const whitelistStateText = document.getElementById("whitelistStateText");
const addWhitelistBtn = document.getElementById("addWhitelistBtn");
const removeWhitelistBtn = document.getElementById("removeWhitelistBtn");

const headerAvatar = document.getElementById("headerAvatar");
const headerAvatarFallback = document.getElementById("headerAvatarFallback");
const headerUserName = document.getElementById("headerUserName");
const openSiteBtn = document.getElementById("openSiteBtn");
const tabButtons = document.querySelectorAll('.tab[data-tab]');

const whitelistTextarea = document.getElementById("whitelistTextarea");
const saveWhitelistBtn = document.getElementById("saveWhitelistBtn");
const whitelistStatusToast = document.getElementById("whitelistStatusToast");

const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const syncBtn = document.getElementById("syncBtn");
const syncAdaptersBtn = document.getElementById("syncAdaptersBtn");
const lightThemeName = document.getElementById("lightThemeName");
const darkThemeName = document.getElementById("darkThemeName");
const lightThemeChips = document.getElementById("lightThemeChips");
const darkThemeChips = document.getElementById("darkThemeChips");
const expandLightBtn = document.getElementById("expandLightBtn");
const expandDarkBtn = document.getElementById("expandDarkBtn");
const lightSubPanel = document.getElementById("lightSubPanel");
const darkSubPanel = document.getElementById("darkSubPanel");
const accountMyThemesStrip = document.getElementById("accountMyThemesStrip");
const accountAdaptersStrip = document.getElementById("accountAdaptersStrip");
const accountGuest = document.getElementById("accountGuest");
const accountSignedIn = document.getElementById("accountSignedIn");
const accountAvatar = document.getElementById("accountAvatar");
const accountAvatarFallback = document.getElementById("accountAvatarFallback");
const accountDisplayName = document.getElementById("accountDisplayName");
const accountEmail = document.getElementById("accountEmail");
const accountStatusText = document.getElementById("accountStatusText");
const logoutBtn = document.getElementById("logoutBtn");

const panels = {
  themes: document.getElementById("panel-themes"),
  whitelist: document.getElementById("panel-whitelist"),
  account: document.getElementById("panel-account"),
};

// ── State ─────────────────────────────────────────────────────────────────────
let currentMode = "off";
let currentWhitelist = [];
let currentHostname = "";
let lastSettingsSnapshot = null;
let lightExpanded = false;
let darkExpanded = false;

// ── Popup chrome (appearance) ─────────────────────────────────────────────────
/** 与 content/engine.js normalizeRemoteColors 一致的默认值，用于补齐服务端 ThemeColors */
const POPUP_PALETTE_DEFAULTS = {
  light: {
    background: "#F8FFF8",
    foreground: "#2C3E2C",
    surface: "#F0FFF0",
    surfaceMuted: "#F5FDF5",
    border: "#D8E8D8",
    muted: "#6C7E6C",
    primary500: "#4CAF50",
    primary700: "#388E3C",
  },
  dark: {
    background: "#101410",
    foreground: "#E0E0E0",
    surface: "#1E221E",
    surfaceMuted: "#161816",
    border: "#333633",
    muted: "#A0A0A0",
    primary500: "#4A9B6B",
    primary700: "#346F4D",
  },
};

const POPUP_VARS_FROM_PALETTE = [
  "--popup-bg",
  "--popup-fg",
  "--popup-muted",
  "--popup-surface",
  "--popup-border",
  "--popup-primary",
  "--popup-primary-strong",
  "--popup-primary-soft",
];

function normalizeRemoteColorsForPopup(colors, mode) {
  if (!colors || typeof colors !== "object") return null;
  const defaults = POPUP_PALETTE_DEFAULTS[mode];
  const p = colors.primary;
  const primary500 =
    typeof p === "string" ? p : (p?.["500"] || p?.["600"] || defaults?.primary500);
  const primary700 =
    typeof p === "string" ? p : (p?.["700"] || p?.["800"] || defaults?.primary700);
  return {
    background: colors.background || defaults?.background,
    foreground: colors.foreground || defaults?.foreground,
    surface: colors.surface || defaults?.surface,
    surfaceMuted: colors.surfaceMuted || colors["surface-muted"] || defaults?.surfaceMuted,
    border: colors.border || defaults?.border,
    muted: colors.muted || defaults?.muted,
    primary500,
    primary700,
  };
}

function clearPopupPaletteOverrides() {
  for (const key of POPUP_VARS_FROM_PALETTE) {
    document.body.style.removeProperty(key);
  }
}

/** 将存储中的 gtsPalette（与网页注入同源）映射到弹窗 CSS 变量 */
function applyPopupPaletteFromCatalog(mode, palette) {
  clearPopupPaletteOverrides();
  if (!palette || (mode !== "light" && mode !== "dark")) return;
  const raw = palette[mode];
  if (!raw || typeof raw !== "object") return;
  const n = normalizeRemoteColorsForPopup(raw, mode);
  if (!n) return;
  document.body.style.setProperty("--popup-bg", n.background);
  document.body.style.setProperty("--popup-fg", n.foreground);
  document.body.style.setProperty("--popup-muted", n.muted);
  document.body.style.setProperty("--popup-surface", n.surface);
  document.body.style.setProperty("--popup-border", n.border);
  document.body.style.setProperty("--popup-primary", n.primary500);
  document.body.style.setProperty("--popup-primary-strong", n.primary700);
  document.body.style.setProperty("--popup-primary-soft", n.surfaceMuted);
}

function setPopupTheme(mode) {
  document.body.setAttribute("data-theme", mode || "off");
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
function setActiveTab(name) {
  tabButtons.forEach((b) => {
    const on = b.dataset.tab === name;
    b.classList.toggle("tab--active", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });
  Object.entries(panels).forEach(([key, el]) => {
    if (!el) return;
    el.toggleAttribute("hidden", key !== name);
  });
  if (name === "whitelist") syncWhitelistField();
}

// ── Header user ──────────────────────────────────────────────────────────────
function renderHeaderUser(user) {
  const name = user?.name || user?.username || i18n("guestNickname");
  headerUserName.textContent = name;
  const letter = (name.trim().charAt(0) || "?").toUpperCase();

  const applyFallback = () => {
    headerAvatar.removeAttribute("src");
    headerAvatar.classList.add("hidden");
    headerAvatarFallback.classList.remove("hidden");
    headerAvatarFallback.textContent = letter;
  };

  if (user?.avatar) {
    headerAvatar.alt = name;
    headerAvatar.onload = () => {
      headerAvatar.classList.remove("hidden");
      headerAvatarFallback.classList.add("hidden");
    };
    headerAvatar.onerror = () => applyFallback();
    headerAvatar.classList.add("hidden");
    headerAvatarFallback.classList.remove("hidden");
    headerAvatarFallback.textContent = letter;
    headerAvatar.src = user.avatar;
  } else {
    applyFallback();
  }
}

// ── Whitelist ─────────────────────────────────────────────────────────────────
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

function parseWhitelistEditor(text) {
  if (typeof text !== "string") return [];
  return normalizeWhitelist(text.split(","));
}

function syncWhitelistField() {
  if (!whitelistTextarea) return;
  whitelistTextarea.value = currentWhitelist.join(", ");
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
  syncWhitelistField();
}

// ── Mode sub-panels (accordion) ───────────────────────────────────────────────
/** 跟随主题模式：仅展开当前模式对应的列表；off 时全部收起 */
function syncAccordionExpansionToMode(mode) {
  lightExpanded = mode === "light";
  darkExpanded = mode === "dark";
}

function syncModeSubpanels() {
  const src = lastSettingsSnapshot;
  const catalog = src?.catalog || { light: [], dark: [] };
  const hasL = (catalog.light?.length || 0) > 0;
  const hasD = (catalog.dark?.length || 0) > 0;

  if (lightSubPanel) lightSubPanel.hidden = !lightExpanded || !hasL;
  if (darkSubPanel) darkSubPanel.hidden = !darkExpanded || !hasD;

  if (expandLightBtn) {
    expandLightBtn.classList.toggle("is-open", lightExpanded);
    expandLightBtn.setAttribute("aria-expanded", lightExpanded ? "true" : "false");
    expandLightBtn.disabled = !hasL;
  }
  if (expandDarkBtn) {
    expandDarkBtn.classList.toggle("is-open", darkExpanded);
    expandDarkBtn.setAttribute("aria-expanded", darkExpanded ? "true" : "false");
    expandDarkBtn.disabled = !hasD;
  }
}

function pickPrimaryForPreview(colors) {
  if (!colors || typeof colors !== "object") return null;
  const p = colors.primary;
  if (typeof p === "string") return p;
  return p?.["500"] || p?.["600"] || colors.foreground || null;
}

function createReadonlyThemeCard(t, mode) {
  const bg = t.colors?.background || "#64748b";
  const accent = pickPrimaryForPreview(t.colors) || t.colors?.foreground || bg;
  const wrap = document.createElement("div");
  wrap.className = "theme-card-readonly";
  wrap.setAttribute("role", "listitem");

  const tag = document.createElement("span");
  tag.className =
    "theme-card-readonly__tag " +
    (mode === "light" ? "theme-card-readonly__tag--light" : "theme-card-readonly__tag--dark");
  tag.textContent = mode === "light" ? i18n("tagThemeLight") : i18n("tagThemeDark");

  const banner = document.createElement("div");
  banner.className = "theme-card-readonly__banner";
  banner.style.background = `linear-gradient(90deg, ${bg} 0%, ${accent} 100%)`;

  const body = document.createElement("div");
  body.className = "theme-card-readonly__body";
  const nameEl = document.createElement("div");
  nameEl.className = "theme-card-readonly__name";
  nameEl.textContent = t.displayName || t.name;

  body.appendChild(nameEl);
  wrap.appendChild(tag);
  wrap.appendChild(banner);
  wrap.appendChild(body);
  return wrap;
}

function renderAccountMyThemesStrip() {
  const container = accountMyThemesStrip;
  if (!container) return;
  const src = lastSettingsSnapshot;
  const catalog = src?.catalog || { light: [], dark: [] };
  container.innerHTML = "";
  const items = [
    ...(catalog.light || []).map((t) => ({ t, mode: "light" })),
    ...(catalog.dark || []).map((t) => ({ t, mode: "dark" })),
  ];
  if (items.length === 0) {
    const p = document.createElement("p");
    p.className = "account-strip-empty";
    p.textContent = i18n("accountMyThemesEmpty");
    container.appendChild(p);
    return;
  }
  for (const { t, mode } of items) {
    container.appendChild(createReadonlyThemeCard(t, mode));
  }
}

function renderAdapterReadonlyCard(a) {
  const wrap = document.createElement("div");
  wrap.className = "adapter-card-readonly";
  wrap.setAttribute("role", "listitem");

  const title = document.createElement("div");
  title.className = "adapter-card-readonly__title";
  const disp =
    typeof a.displayName === "string" && a.displayName.trim() ? a.displayName.trim() : "";
  title.textContent = disp || "—";

  const domain = document.createElement("div");
  domain.className = "adapter-card-readonly__domain";
  const dom =
    typeof a.siteDomain === "string" && a.siteDomain.trim() ? a.siteDomain.trim() : "";
  domain.textContent = dom || "—";

  wrap.appendChild(title);
  wrap.appendChild(domain);
  return wrap;
}

async function renderAccountAdaptersStrip() {
  const container = accountAdaptersStrip;
  if (!container) return;
  const res = await chrome.runtime.sendMessage({ type: "GET_ADAPTER_LIST" });
  const list = res?.ok && Array.isArray(res.adapters) ? res.adapters : [];
  container.innerHTML = "";
  if (list.length === 0) {
    const p = document.createElement("p");
    p.className = "account-strip-empty";
    p.textContent = i18n("accountAdaptersEmpty");
    container.appendChild(p);
    return;
  }
  for (const a of list) {
    container.appendChild(renderAdapterReadonlyCard(a));
  }
}

function fillThemeChips(container, list, selectedName, mode) {
  if (!container) return;
  container.innerHTML = "";
  for (const t of list || []) {
    const bg = t.colors?.background || "#64748b";
    const accent = pickPrimaryForPreview(t.colors) || t.colors?.foreground || bg;
    const display = t.displayName || t.name;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-card" + (t.name === selectedName ? " theme-card--active" : "");
    btn.setAttribute("aria-pressed", t.name === selectedName ? "true" : "false");
    btn.title = `${display} — ${i18n("themeInternalId")} ${t.name}`;

    const banner = document.createElement("div");
    banner.className = "theme-card__banner";
    banner.style.background = `linear-gradient(90deg, ${bg} 0%, ${accent} 100%)`;

    const body = document.createElement("div");
    body.className = "theme-card__body";
    const nameEl = document.createElement("div");
    nameEl.className = "theme-card__name";
    nameEl.textContent = display;
    // const idEl = document.createElement("div");
    // idEl.className = "theme-card__id";
    // idEl.textContent = `${i18n("themeInternalId")} ${t.name}`;
    body.appendChild(nameEl);
    // body.appendChild(idEl);

    btn.appendChild(banner);
    btn.appendChild(body);
    btn.addEventListener("click", async () => {
      const res = await chrome.runtime.sendMessage({ type: "APPLY_THEME_VARIANT", mode, themeName: t.name });
      if (res?.ok) await loadCurrentMode();
      await renderAccountState();
    });
    container.appendChild(btn);
  }
}

function renderThemeVariantRows() {
  const src = lastSettingsSnapshot;
  if (!src) return;
  const catalog = src.catalog || { light: [], dark: [] };
  fillThemeChips(lightThemeChips, catalog.light, src.pickLight, "light");
  fillThemeChips(darkThemeChips, catalog.dark, src.pickDark, "dark");
  renderAccountMyThemesStrip();
  syncModeSubpanels();
}

function applyPickedLabelsFromResponse(response) {
  const cat = response.catalog || { light: [], dark: [] };
  const pl = cat.light.find((t) => t.name === response.pickLight) || cat.light[0];
  const pd = cat.dark.find((t) => t.name === response.pickDark) || cat.dark[0];

  if (lightThemeName) {
    lightThemeName.textContent = pl ? pl.displayName || pl.name : response.lightTheme || "—";
  }
  if (darkThemeName) {
    darkThemeName.textContent = pd ? pd.displayName || pd.name : response.darkTheme || "—";
  }
}

function autoEffectiveNow() {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? "light" : "dark";
}

function updateStatus(storedMode, effectiveModeFromBg) {
  let uiTheme;
  if (storedMode === "off") {
    uiTheme = "off";
  } else if (storedMode === "auto") {
    const eff =
      effectiveModeFromBg === "light" || effectiveModeFromBg === "dark"
        ? effectiveModeFromBg
        : autoEffectiveNow();
    uiTheme = eff;
  } else {
    uiTheme = storedMode;
  }
  setPopupTheme(uiTheme);
  applyPopupPaletteFromCatalog(uiTheme, lastSettingsSnapshot?.palette);
}

// ── Settings load ─────────────────────────────────────────────────────────────
async function loadCurrentMode() {
  const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
  lastSettingsSnapshot = response;
  currentMode = response?.mode || "off";
  currentWhitelist = normalizeWhitelist(response?.whitelist || []);
  currentHostname = await getCurrentTabHostname();
  const target = radios.find((item) => item.value === currentMode);
  if (target) target.checked = true;

  syncAccordionExpansionToMode(currentMode);

  updateStatus(currentMode, response?.effectiveMode);
  renderWhitelistState();
  syncWhitelistField();
  applyPickedLabelsFromResponse(response);
  renderThemeVariantRows();
}

async function onModeChange(event) {
  currentMode = event.target.value;
  syncAccordionExpansionToMode(currentMode);
  updateStatus(currentMode);
  renderThemeVariantRows();
  await chrome.runtime.sendMessage({ type: "SET_THEME_MODE", mode: currentMode });
}

async function addCurrentSiteToWhitelist() {
  if (!currentHostname) return;
  const normalizedHost = normalizeWhitelistEntry(currentHostname);
  const next = normalizeWhitelist([...currentWhitelist, normalizedHost]);
  await saveWhitelist(next);
  whitelistStatusToast.textContent = i18n("addedToWhitelist", [normalizedHost]);
}

async function removeCurrentSiteFromWhitelist() {
  if (!currentHostname) return;
  const next = currentWhitelist.filter((entry) => currentHostname !== entry && !currentHostname.endsWith(`.${entry}`));
  await saveWhitelist(next);
  whitelistStatusToast.textContent = i18n("removedFromWhitelist", [currentHostname]);
}

// ── Account panel ─────────────────────────────────────────────────────────────
async function renderAccountState() {
  const response = await chrome.runtime.sendMessage({ type: "GET_USER_INFO" });
  const user = response?.user;
  renderHeaderUser(user);

  if (user) {
    accountGuest.classList.add("hidden");
    accountSignedIn.classList.remove("hidden");
    accountDisplayName.textContent = user.name || user.username || "—";
    accountEmail.textContent = user.email || "";

    const initial = (user.name || user.username || "?").trim().charAt(0).toUpperCase() || "?";
    const showAccountFallback = () => {
      accountAvatar.classList.add("hidden");
      accountAvatarFallback.classList.remove("hidden");
      accountAvatarFallback.textContent = initial;
    };

    if (user.avatar) {
      accountAvatar.alt = user.name || "";
      accountAvatar.onload = () => {
        accountAvatar.classList.remove("hidden");
        accountAvatarFallback.classList.add("hidden");
      };
      accountAvatar.onerror = () => showAccountFallback();
      accountAvatar.classList.add("hidden");
      accountAvatarFallback.classList.remove("hidden");
      accountAvatarFallback.textContent = initial;
      accountAvatar.src = user.avatar;
    } else {
      showAccountFallback();
    }

    renderAccountMyThemesStrip();
    void renderAccountAdaptersStrip();
  } else {
    accountGuest.classList.remove("hidden");
    accountSignedIn.classList.add("hidden");
    accountEmail.textContent = "";
    accountAvatar.removeAttribute("src");
    accountAvatar.classList.add("hidden");
    accountAvatarFallback.classList.remove("hidden");
    accountAvatarFallback.textContent = "?";
  }
}

// ── Handlers ────────────────────────────────────────────────────────────────
tabButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const name = btn.dataset.tab;
    setActiveTab(name);
    if (name === "account") {
      const r = await chrome.runtime.sendMessage({ type: "GET_USER_INFO" });
      if (r?.user) {
        renderAccountMyThemesStrip();
        void renderAccountAdaptersStrip();
      }
    }
  });
});

openSiteBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: OFFICIAL_SITE });
});

expandLightBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  lightExpanded = !lightExpanded;
  syncModeSubpanels();
});

expandDarkBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  darkExpanded = !darkExpanded;
  syncModeSubpanels();
});

saveWhitelistBtn.addEventListener("click", async () => {
  const next = parseWhitelistEditor(whitelistTextarea.value);
  await saveWhitelist(next);
  whitelistStatusToast.textContent = i18n("whitelistSaved");
});

radios.forEach((radio) => radio.addEventListener("change", onModeChange));
addWhitelistBtn.addEventListener("click", addCurrentSiteToWhitelist);
removeWhitelistBtn.addEventListener("click", removeCurrentSiteFromWhitelist);

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
    await chrome.runtime.sendMessage({ type: "SYNC_ADAPTERS" });
    await loadCurrentMode();
    accountStatusText.textContent = i18n("loginSuccessOauth");
  } else {
    loginError.textContent = response?.error || i18n("loginFailOauth");
    loginError.classList.remove("hidden");
  }
});

logoutBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "LOGOUT" });
  await renderAccountState();
  await loadCurrentMode();
  accountStatusText.textContent = i18n("loggedOut");
});

syncBtn.addEventListener("click", async () => {
  syncBtn.disabled = true;
  syncBtn.textContent = i18n("syncing");
  const response = await chrome.runtime.sendMessage({ type: "SYNC_THEME" });
  syncBtn.disabled = false;
  syncBtn.textContent = i18n("syncBtn");
  if (response?.ok) {
    accountStatusText.textContent = i18n("synced");
    await renderAccountState();
    await loadCurrentMode();
  } else {
    accountStatusText.textContent = response?.error || i18n("syncFailed");
  }
});

syncAdaptersBtn?.addEventListener("click", async () => {
  syncAdaptersBtn.disabled = true;
  syncAdaptersBtn.textContent = i18n("syncingAdapters");
  const response = await chrome.runtime.sendMessage({ type: "SYNC_ADAPTERS" });
  syncAdaptersBtn.disabled = false;
  syncAdaptersBtn.textContent = i18n("syncAdaptersBtn");
  if (response?.ok) {
    accountStatusText.textContent = i18n("adaptersSynced", [String(response.count ?? 0)]);
    await renderAccountAdaptersStrip();
  } else {
    accountStatusText.textContent = response?.error || i18n("adaptersSyncFailed");
  }
});

applyI18n();
setActiveTab("themes");
void (async () => {
  await renderAccountState();
  await loadCurrentMode();
})();
