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
const BUILDER_PENDING_SELECTIONS_KEY = "gtsBuilderPendingSelections";

/**
 * 线上若仍返回旧版负载（仅 name/code/updatedAt），或缓存里缺展示字段时，
 * 用公式 JSON 与 name 补全 displayName / siteDomain；并兼容 snake_case 键名。
 */
function parseAdapterFormulaJson(code) {
  try {
    const p = JSON.parse(code);
    return p && typeof p === "object" && !Array.isArray(p) ? p : null;
  } catch {
    return null;
  }
}

function hostRulesToSiteDomain(formula) {
  const match = formula?.match;
  if (!match || typeof match !== "object" || Array.isArray(match)) return "";
  const hostname = match.hostname;
  if (!Array.isArray(hostname)) return "";
  const values = [];
  for (const rule of hostname) {
    if (!rule || typeof rule !== "object") continue;
    const v = rule.value;
    if (typeof v === "string" && v.trim()) values.push(v.trim());
  }
  return [...new Set(values)].join(", ");
}

function titleizeSlug(slug) {
  if (!slug) return "";
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function normalizeAdapterPresentation(a) {
  const rawDisp = a.displayName ?? a.display_name;
  const rawDom = a.siteDomain ?? a.site_domain;
  let displays = typeof rawDisp === "string" ? rawDisp.trim() : "";
  let siteDomain = typeof rawDom === "string" ? rawDom.trim() : "";
  const code = typeof a.code === "string" ? a.code : "";
  const formula = code ? parseAdapterFormulaJson(code) : null;

  if (!siteDomain && formula) siteDomain = hostRulesToSiteDomain(formula);
  if (!displays && formula && typeof formula.id === "string" && formula.id.trim()) {
    displays = titleizeSlug(formula.id.trim());
  }
  if (!displays && typeof a.name === "string" && a.name.trim()) {
    displays = titleizeSlug(a.name.split("-")[0] || a.name);
  }
  if (!displays && typeof a.name === "string") displays = a.name;

  return { displayName: displays, siteDomain };
}

const THEME_MODES = { LIGHT: "light", DARK: "dark", OFF: "off", AUTO: "auto" };

/** 自动模式：本地时间 [dayStart, dayEnd) 小时区间为亮色，其余为暗色（与 engine.js 保持一致） */
const AUTO_LOCAL_DAY_START_HOUR = 6;
const AUTO_LOCAL_DAY_END_HOUR = 18;

const AUTO_THEME_ALARM = "gtsAutoThemeBoundary";

const DEFAULT_MODE = THEME_MODES.OFF;

function resolveEffectiveMode(stored) {
  if (stored === THEME_MODES.AUTO) {
    const h = new Date().getHours();
    return h >= AUTO_LOCAL_DAY_START_HOUR && h < AUTO_LOCAL_DAY_END_HOUR ? THEME_MODES.LIGHT : THEME_MODES.DARK;
  }
  return stored;
}

/** 下一次到达 AUTO 切换边界的 Unix 时间戳（毫秒） */
function nextAutoBoundaryTimestampMs() {
  const now = Date.now();
  const out = [];
  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(AUTO_LOCAL_DAY_START_HOUR, 0, 0, 0);
    out.push(d.getTime());
    d.setHours(AUTO_LOCAL_DAY_END_HOUR, 0, 0, 0);
    out.push(d.getTime());
  }
  const future = out.filter((t) => t > now).sort((a, b) => a - b);
  return future[0] ?? now + 60_000;
}

async function refreshAutoThemeAlarm() {
  try {
    await chrome.alarms.clear(AUTO_THEME_ALARM);
  } catch {
    /* ignore */
  }
  const stored = await getMode();
  if (stored !== THEME_MODES.AUTO) return;
  const when = nextAutoBoundaryTimestampMs();
  chrome.alarms.create(AUTO_THEME_ALARM, { when });
}

async function broadcastThemeSettingsToTabs() {
  const [stored, whitelist, palette] = await Promise.all([getMode(), getWhitelist(), getStoredPalette()]);
  const mode = resolveEffectiveMode(stored);
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (canInjectToUrl(tab.url) && tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: "SETTINGS_UPDATE", mode, whitelist, palette }, () => void chrome.runtime.lastError);
    }
  }
}

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
  const [stored, whitelist, palette] = await Promise.all([getMode(), getWhitelist(), getStoredPalette()]);
  const mode = resolveEffectiveMode(stored);
  chrome.tabs.sendMessage(tabId, { type: "SETTINGS_UPDATE", mode, whitelist, palette }, () => {
    void chrome.runtime.lastError;
  });
}

function canInjectToUrl(url) {
  if (!url) return false;
  return /^https?:\/\//.test(url);
}

function normalizeBuilderSelectionPayload(message) {
  if (!message || typeof message !== "object") return null;
  const selector = typeof message.selector === "string" ? message.selector.trim() : "";
  if (!selector) return null;
  const pageHost =
    typeof message.pageHost === "string" ? message.pageHost.trim().toLowerCase() : "";
  return {
    selector,
    fullSelector: typeof message.fullSelector === "string" ? message.fullSelector : "",
    tagName: typeof message.tagName === "string" ? message.tagName : "div",
    textHint: typeof message.textHint === "string" ? message.textHint : "",
    classHint: typeof message.classHint === "string" ? message.classHint : "",
    pageHost,
    ts: Date.now(),
  };
}

async function enqueueBuilderSelection(message) {
  const payload = normalizeBuilderSelectionPayload(message);
  if (!payload) return { ok: false, error: "invalid-selection" };
  const data = await chrome.storage.local.get(BUILDER_PENDING_SELECTIONS_KEY);
  const queue = Array.isArray(data[BUILDER_PENDING_SELECTIONS_KEY]) ? data[BUILDER_PENDING_SELECTIONS_KEY] : [];
  queue.push(payload);
  // 防止异常增长，保留最近 200 条
  const trimmed = queue.slice(-200);
  await chrome.storage.local.set({ [BUILDER_PENDING_SELECTIONS_KEY]: trimmed });
  return { ok: true };
}

async function takeAndClearBuilderSelections() {
  const data = await chrome.storage.local.get(BUILDER_PENDING_SELECTIONS_KEY);
  const queue = Array.isArray(data[BUILDER_PENDING_SELECTIONS_KEY]) ? data[BUILDER_PENDING_SELECTIONS_KEY] : [];
  await chrome.storage.local.set({ [BUILDER_PENDING_SELECTIONS_KEY]: [] });
  return queue;
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
      .map((a) => {
        const { displayName, siteDomain } = normalizeAdapterPresentation(a);
        return {
          name: a.name,
          code: a.code,
          displayName,
          siteDomain,
          updatedAt: typeof a.updatedAt === "string" ? a.updatedAt : null,
        };
      });
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
  const [stored, whitelist] = await Promise.all([getMode(), getWhitelist()]);
  const mode = resolveEffectiveMode(stored);
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (canInjectToUrl(tab.url) && tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: "SETTINGS_UPDATE", mode, whitelist, palette }, () => void chrome.runtime.lastError);
    }
  }
}

// 同步主题：拉取并存储 palette + 候选列表（不含适配器；适配器单独「更新适配器」或安装/启动时拉取）
async function syncTheme() {
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
  await refreshAutoThemeAlarm();
});

chrome.runtime.onStartup?.addListener(() => {
  void syncAdapters();
  void syncTheme();
  void refreshAutoThemeAlarm();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== AUTO_THEME_ALARM) return;
  void (async () => {
    const stored = await getMode();
    if (stored !== THEME_MODES.AUTO) return;
    await broadcastThemeSettingsToTabs();
    await refreshAutoThemeAlarm();
  })();
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
        const effectiveMode = resolveEffectiveMode(mode);
        const catalog = local[CATALOG_KEY] || { light: [], dark: [] };
        const pickLight = local[PICK_LIGHT_KEY];
        const pickDark = local[PICK_DARK_KEY];
        const lightMeta = catalog.light.find((t) => t.name === pickLight) || catalog.light[0];
        const darkMeta = catalog.dark.find((t) => t.name === pickDark) || catalog.dark[0];
        const palette = await getStoredPalette();
        sendResponse({
          mode,
          effectiveMode,
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
        const effectiveMode = resolveEffectiveMode(mode);
        sendResponse({
          mode,
          effectiveMode,
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

  if (message.type === "GET_USER_POINTS") {
    (async () => {
      try {
        const { token } = await getStoredUser();
        if (!token) {
          sendResponse(null);
          return;
        }
        const res = await fetch(API_BASE + "/api/entry/user/points", {
          headers: { Authorization: "Bearer " + token },
        });
        const json = await res.json();
        if (json.c === 200) sendResponse(json.d);
        else sendResponse(null);
      } catch {
        sendResponse(null);
      }
    })();
    return true;
  }

  if (message.type === "SET_THEME_MODE") {
    const { mode } = message;
    const validMode = Object.values(THEME_MODES).includes(mode) ? mode : DEFAULT_MODE;
    setMode(validMode).then(async () => {
      await broadcastThemeSettingsToTabs();
      await refreshAutoThemeAlarm();
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

  if (message.type === "SYNC_ADAPTERS") {
    syncAdapters().then((result) => sendResponse(result));
    return true;
  }

  if (message.type === "GET_ADAPTER_LIST") {
    (async () => {
      try {
        const data = await chrome.storage.local.get(ADAPTERS_SCRIPTS_KEY);
        const raw = Array.isArray(data[ADAPTERS_SCRIPTS_KEY]) ? data[ADAPTERS_SCRIPTS_KEY] : [];
        const adapters = raw.map((a) => {
          const { displayName, siteDomain } = normalizeAdapterPresentation(a);
          return {
            name: a.name,
            displayName,
            siteDomain,
            updatedAt: a.updatedAt || null,
          };
        });
        sendResponse({ ok: true, adapters });
      } catch (err) {
        sendResponse({ ok: false, adapters: [], error: err?.message || String(err) });
      }
    })();
    return true;
  }

  if (message.type === "SET_WHITELIST") {
    const whitelist = normalizeWhitelist(message.whitelist || []);
    setWhitelist(whitelist).then(async () => {
      const [stored, palette] = await Promise.all([getMode(), getStoredPalette()]);
      const mode = resolveEffectiveMode(stored);
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

  if (message.type === "BUILDER_ELEMENT_SELECTED") {
    enqueueBuilderSelection(message)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, error: err?.message || String(err) }));
    return true;
  }

  if (message.type === "GET_AND_CLEAR_BUILDER_SELECTIONS") {
    takeAndClearBuilderSelections()
      .then((queue) => sendResponse({ ok: true, selections: queue }))
      .catch((err) => sendResponse({ ok: false, selections: [], error: err?.message || String(err) }));
    return true;
  }

  if (message.type === "SUBMIT_ADAPTER") {
    (async () => {
      try {
        const { token } = await getStoredUser();
        if (!token) {
          sendResponse({ ok: false, error: "未登录" });
          return;
        }
        const { siteDomain, selectedElements, feedback, source } = message;
        if (!siteDomain || !Array.isArray(selectedElements) || selectedElements.length === 0 || !feedback) {
          sendResponse({ ok: false, error: "缺少必要字段" });
          return;
        }
        const res = await fetch(API_BASE + "/api/entry/adapter-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            siteDomain,
            selectedElements,
            feedback,
            source: source || "extension",
          }),
        });
        const json = await res.json();
        if (json.c === 200) {
          sendResponse({ ok: true, data: json.d });
        } else {
          sendResponse({ ok: false, error: json.m || "提交失败" });
        }
      } catch (err) {
        sendResponse({ ok: false, error: err ? (err.message || String(err)) : "提交失败" });
      }
    })();
    return true;
  }

  if (message.type === "CHECK_ADAPTER_DOMAIN") {
    (async () => {
      try {
        const domain = message.domain;
        if (!domain) { sendResponse({ ok: true, adapters: [] }); return; }
        const res = await fetch(API_BASE + "/api/pub/adapters/by-domain?domain=" + encodeURIComponent(domain));
        const json = await res.json();
        if (json.c === 200) {
          sendResponse({ ok: true, adapters: json.d.adapters || [], total: json.d.total || 0 });
        } else {
          sendResponse({ ok: true, adapters: [] });
        }
      } catch (e) {
        sendResponse({ ok: true, adapters: [] });
      }
    })();
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
