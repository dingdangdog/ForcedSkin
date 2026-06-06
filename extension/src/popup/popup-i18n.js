(function () {
  /** @typedef {{ code: string, folder: string, flag: string, name: string, htmlLang: string }} PopupLocaleMeta */

  const POPUP_LOCALE_STORAGE_KEY = "popupLocale";

  /** @type {readonly PopupLocaleMeta[]} */
  const POPUP_LOCALES = [
    { code: "en", folder: "en", flag: "🇺🇸", name: "English", htmlLang: "en" },
    { code: "en-GB", folder: "en_GB", flag: "🇬🇧", name: "English (UK)", htmlLang: "en-GB" },
    { code: "zh", folder: "zh_CN", flag: "🇨🇳", name: "中文", htmlLang: "zh-CN" },
    { code: "ja", folder: "ja", flag: "🇯🇵", name: "日本語", htmlLang: "ja" },
    { code: "es", folder: "es", flag: "🇪🇸", name: "Español", htmlLang: "es" },
    { code: "de", folder: "de", flag: "🇩🇪", name: "Deutsch", htmlLang: "de" },
  ];

  const NAMED_PLACEHOLDERS = ["host", "mode", "count"];

  /** @type {Record<string, string>} */
  let activeMessages = {};
  /** @type {string} */
  let activeLocaleCode = "en";
  /** @type {(() => void) | null} */
  let onLocaleChange = null;

  function localeMeta(code) {
    return POPUP_LOCALES.find((l) => l.code === code) || POPUP_LOCALES[0];
  }

  function detectBrowserLocale() {
    const ui = (chrome.i18n.getUILanguage?.() || "en").toLowerCase();
    if (ui.startsWith("zh")) return "zh";
    if (ui === "en-gb") return "en-GB";
    if (ui.startsWith("ja")) return "ja";
    if (ui.startsWith("es")) return "es";
    if (ui.startsWith("de")) return "de";
    return "en";
  }

  function formatMessage(template, substitutions) {
    if (!template) return "";
    if (!substitutions?.length) return template;
    let out = template;
    substitutions.forEach((val, i) => {
      const s = String(val);
      out = out.replace(new RegExp(`\\$${i + 1}`, "g"), s);
      out = out.replace(new RegExp(`\\{${i + 1}\\}`, "g"), s);
    });
    if (substitutions.length === 1) {
      for (const name of NAMED_PLACEHOLDERS) {
        out = out.replace(new RegExp(`\\{${name}\\}`, "g"), String(substitutions[0]));
      }
    }
    return out;
  }

  async function fetchLocaleMessages(folder) {
    const url = chrome.runtime.getURL(`_locales/${folder}/messages.json`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`locale fetch failed: ${folder}`);
    const raw = await res.json();
    /** @type {Record<string, string>} */
    const flat = {};
    for (const [key, entry] of Object.entries(raw)) {
      flat[key] = entry?.message ?? "";
    }
    return flat;
  }

  async function loadLocale(code) {
    const meta = localeMeta(code);
    activeMessages = await fetchLocaleMessages(meta.folder);
    activeLocaleCode = meta.code;
    document.documentElement.lang = meta.htmlLang;
  }

  function applyI18n(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      const msg = PopupI18n.t(key);
      if (msg) el.textContent = msg;
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      const msg = PopupI18n.t(key);
      if (msg) el.placeholder = msg;
    });
    root.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.dataset.i18nTitle;
      const msg = PopupI18n.t(key);
      if (msg) el.title = msg;
    });
  }

  function updateLocaleSwitcherUi(container) {
    if (!container) return;
    const btn = container.querySelector(".locale-switcher__btn");
    const flagEl = container.querySelector(".locale-switcher__flag");
    const meta = localeMeta(activeLocaleCode);
    if (flagEl) flagEl.textContent = meta.flag;
    if (btn) btn.setAttribute("aria-label", PopupI18n.t("language") || "Language");
    container.querySelectorAll(".locale-switcher__option").forEach((opt) => {
      const code = opt.dataset.locale;
      const selected = code === activeLocaleCode;
      opt.setAttribute("aria-selected", selected ? "true" : "false");
      opt.classList.toggle("locale-switcher__option--active", selected);
    });
  }

  function closeLocaleMenu(container) {
    const menu = container?.querySelector(".locale-switcher__menu");
    const btn = container?.querySelector(".locale-switcher__btn");
    if (!menu || !btn) return;
    menu.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  }

  function openLocaleMenu(container) {
    const menu = container?.querySelector(".locale-switcher__menu");
    const btn = container?.querySelector(".locale-switcher__btn");
    if (!menu || !btn) return;
    menu.hidden = false;
    btn.setAttribute("aria-expanded", "true");
  }

  function mountLocaleSwitcher(container) {
    if (!container) return;
    container.innerHTML = `
      <button type="button" class="locale-switcher__btn" aria-haspopup="listbox" aria-expanded="false">
        <span class="locale-switcher__flag" aria-hidden="true"></span>
        <svg class="locale-switcher__chevron" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>
      </button>
      <div class="locale-switcher__menu" role="listbox" hidden></div>
    `;
    const menu = container.querySelector(".locale-switcher__menu");
    for (const loc of POPUP_LOCALES) {
      const opt = document.createElement("button");
      opt.type = "button";
      opt.className = "locale-switcher__option";
      opt.dataset.locale = loc.code;
      opt.setAttribute("role", "option");
      opt.innerHTML = `<span class="locale-switcher__flag" aria-hidden="true">${loc.flag}</span><span class="locale-switcher__name">${loc.name}</span>`;
      opt.addEventListener("click", async (e) => {
        e.stopPropagation();
        closeLocaleMenu(container);
        if (loc.code !== activeLocaleCode) {
          await PopupI18n.setLocale(loc.code);
        }
      });
      menu.appendChild(opt);
    }
    const btn = container.querySelector(".locale-switcher__btn");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const menuEl = container.querySelector(".locale-switcher__menu");
      if (menuEl?.hidden) openLocaleMenu(container);
      else closeLocaleMenu(container);
    });
    document.addEventListener("click", () => closeLocaleMenu(container));
    updateLocaleSwitcherUi(container);
  }

  const PopupI18n = {
    get locales() {
      return POPUP_LOCALES;
    },
    getLocale() {
      return activeLocaleCode;
    },
    t(key, substitutions) {
      const template = activeMessages[key] ?? chrome.i18n.getMessage(key, substitutions) ?? key;
      return formatMessage(template, substitutions);
    },
    applyI18n,
    updateLocaleSwitcherUi,
    mountLocaleSwitcher,
    setOnLocaleChange(fn) {
      onLocaleChange = typeof fn === "function" ? fn : null;
    },
    async init() {
      const stored = await chrome.storage.local.get(POPUP_LOCALE_STORAGE_KEY);
      const saved = stored[POPUP_LOCALE_STORAGE_KEY];
      const initial =
        typeof saved === "string" && POPUP_LOCALES.some((l) => l.code === saved)
          ? saved
          : detectBrowserLocale();
      await loadLocale(initial);
    },
    async setLocale(code) {
      if (!POPUP_LOCALES.some((l) => l.code === code)) return;
      await loadLocale(code);
      await chrome.storage.local.set({ [POPUP_LOCALE_STORAGE_KEY]: code });
      onLocaleChange?.();
    },
  };

  window.PopupI18n = PopupI18n;
})();
