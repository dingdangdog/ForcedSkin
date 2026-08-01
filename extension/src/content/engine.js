(() => {
  const THEME_STYLE_ID = "global-theme-switcher-style";
  const SHADOW_STYLE_ATTR = "data-gts-shadow-style";
  const STORAGE_KEY = "themeMode";
  const WHITELIST_KEY = "siteWhitelist";
  const MARK_ATTR = "data-gts-applied";
  const PSEUDO_ATTRS = ["data-gts-before-bg", "data-gts-after-bg", "data-gts-before-flat", "data-gts-after-flat"];
  const MARK_BG = "bg";
  const MARK_TEXT = "text";
  const MARK_BORDER = "border";
  const MODES = { LIGHT: "light", DARK: "dark", OFF: "off" };
  const AUTO_LOCAL_DAY_START_HOUR = 6;
  const AUTO_LOCAL_DAY_END_HOUR = 18;
  const STORED_AUTO = "auto";
  const MEDIA_TAGS = new Set(["IMG", "PICTURE", "VIDEO", "CANVAS", "IFRAME", "OBJECT", "EMBED"]);
  const ORIGINAL_STYLES = new WeakMap();
  const TOUCHED_ELEMENTS = new Set();
  const COLOR_CACHE = new Map();
  const COLOR_CANVAS = document.createElement("canvas");
  COLOR_CANVAS.width = 1;
  COLOR_CANVAS.height = 1;
  const COLOR_CONTEXT = COLOR_CANVAS.getContext("2d", { willReadFrequently: true });

  const DEFAULT_PALETTE = {
    [MODES.LIGHT]: {
      colorScheme: "light",
      background: "#F8FFF8",
      foreground: "#2C3E2C",
      surface: "#F0FFF0",
      surfaceMuted: "#F5FDF5",
      border: "#D8E8D8",
      muted: "#6C7E6C",
      primary500: "#4CAF50",
      primary700: "#388E3C"
    },
    [MODES.DARK]: {
      colorScheme: "dark",
      background: "#101410",
      foreground: "#E0E0E0",
      surface: "#1E221E",
      surfaceMuted: "#161816",
      border: "#333633",
      muted: "#A0A0A0",
      primary500: "#4A9B6B",
      primary700: "#346F4D"
    }
  };

  let PALETTE = { ...DEFAULT_PALETTE };

  function resolveStoredThemeMode(stored) {
    if (stored === STORED_AUTO) {
      const hour = new Date().getHours();
      return hour >= AUTO_LOCAL_DAY_START_HOUR && hour < AUTO_LOCAL_DAY_END_HOUR ? MODES.LIGHT : MODES.DARK;
    }
    return stored;
  }

  function normalizeRemoteColors(colors, mode) {
    if (!colors || typeof colors !== "object") return null;
    const primary = colors.primary;
    const primary500 = typeof primary === "string"
      ? primary
      : (primary?.["500"] || primary?.["600"] || DEFAULT_PALETTE[mode]?.primary500);
    const primary700 = typeof primary === "string"
      ? primary
      : (primary?.["700"] || primary?.["800"] || DEFAULT_PALETTE[mode]?.primary700);
    return {
      colorScheme: mode,
      background: colors.background || DEFAULT_PALETTE[mode]?.background,
      foreground: colors.foreground || DEFAULT_PALETTE[mode]?.foreground,
      surface: colors.surface || DEFAULT_PALETTE[mode]?.surface,
      surfaceMuted: colors.surfaceMuted || colors["surface-muted"] || DEFAULT_PALETTE[mode]?.surfaceMuted,
      border: colors.border || DEFAULT_PALETTE[mode]?.border,
      muted: colors.muted || DEFAULT_PALETTE[mode]?.muted,
      primary500,
      primary700
    };
  }

  function parseRgbComponent(value) {
    const token = String(value).trim();
    if (token.endsWith("%")) return Math.max(0, Math.min(255, Number.parseFloat(token) * 2.55));
    return Math.max(0, Math.min(255, Number.parseFloat(token)));
  }

  function parseCssColor(value) {
    if (!value || typeof value !== "string") return null;
    const key = value.trim().toLowerCase();
    if (COLOR_CACHE.has(key)) return COLOR_CACHE.get(key);
    if (/^(?:currentcolor|inherit|initial|unset|revert(?:-layer)?)$/.test(key) || key.includes("var(")) {
      COLOR_CACHE.set(key, null);
      return null;
    }

    let parsed = null;
    const rgbMatch = key.match(/^rgba?\((.*)\)$/);
    if (rgbMatch) {
      const normalized = rgbMatch[1].replace(/,/g, " ").replace(/\//g, " / ");
      const tokens = normalized.split(/\s+/).filter(Boolean);
      const slash = tokens.indexOf("/");
      const channels = (slash >= 0 ? tokens.slice(0, slash) : tokens).slice(0, 3);
      const alphaToken = slash >= 0 ? tokens[slash + 1] : tokens[3];
      if (channels.length === 3) {
        const alpha = alphaToken?.endsWith("%") ? Number.parseFloat(alphaToken) / 100 : Number.parseFloat(alphaToken ?? "1");
        parsed = {
          r: parseRgbComponent(channels[0]),
          g: parseRgbComponent(channels[1]),
          b: parseRgbComponent(channels[2]),
          a: Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1
        };
      }
    }

    if (!parsed && COLOR_CONTEXT && globalThis.CSS?.supports?.("color", value)) {
      try {
        COLOR_CONTEXT.fillStyle = "#010203";
        const sentinel = COLOR_CONTEXT.fillStyle;
        COLOR_CONTEXT.fillStyle = value;
        if (COLOR_CONTEXT.fillStyle === sentinel && !/^(?:#010203|rgb\(1(?:,|\s)+2(?:,|\s)+3\))$/.test(key)) {
          COLOR_CACHE.set(key, null);
          return null;
        }
        COLOR_CONTEXT.clearRect(0, 0, 1, 1);
        COLOR_CONTEXT.fillRect(0, 0, 1, 1);
        const pixel = COLOR_CONTEXT.getImageData(0, 0, 1, 1).data;
        parsed = { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] / 255 };
      } catch {
        parsed = null;
      }
    }

    COLOR_CACHE.set(key, parsed);
    return parsed;
  }

  function luminance(color) {
    const toLinear = (channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * toLinear(color.r) + 0.7152 * toLinear(color.g) + 0.0722 * toLinear(color.b);
  }

  function contrastRatio(first, second) {
    const firstLuminance = luminance(first);
    const secondLuminance = luminance(second);
    return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
  }

  function colorDistance(first, second) {
    if (!first || !second) return Number.POSITIVE_INFINITY;
    return Math.hypot(first.r - second.r, first.g - second.g, first.b - second.b);
  }

  function colorChroma(color) {
    return (Math.max(color.r, color.g, color.b) - Math.min(color.r, color.g, color.b)) / 255;
  }

  function withAlpha(colorValue, alpha) {
    const color = parseCssColor(colorValue);
    if (!color || alpha >= 0.97) return colorValue;
    return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${Math.max(0.12, alpha).toFixed(3)})`;
  }

  function normalizeWhitelistEntry(entry) {
    if (typeof entry !== "string") return "";
    return entry.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  }

  function normalizeWhitelist(list) {
    if (!Array.isArray(list)) return [];
    return Array.from(new Set(list.map(normalizeWhitelistEntry).filter(Boolean)));
  }

  function isWhitelistedSite(whitelist) {
    const hostname = window.location.hostname.toLowerCase();
    return normalizeWhitelist(whitelist).some((entry) => hostname === entry || hostname.endsWith(`.${entry}`));
  }

  function paletteVariables(palette) {
    return `
      --gts-bg: ${palette.background};
      --gts-fg: ${palette.foreground};
      --gts-surface: ${palette.surface};
      --gts-surface-muted: ${palette.surfaceMuted};
      --gts-border: ${palette.border};
      --gts-muted: ${palette.muted};
      --gts-primary: ${palette.primary500};
      --gts-primary-strong: ${palette.primary700};`;
  }

  function commonThemeRules(scope) {
    const all = `${scope} :where(*):not([data-gts-ignore], [data-gts-ignore] *)`;
    return `
      ${all},
      ${all}::before,
      ${all}::after {
        color: var(--gts-fg) !important;
        border-color: var(--gts-border) !important;
        outline-color: var(--gts-border) !important;
        text-decoration-color: currentColor !important;
        caret-color: var(--gts-primary) !important;
        scrollbar-color: var(--gts-border) var(--gts-surface-muted) !important;
      }

      ${scope} :where(a, a *, [role="link"], [role="link"] *):not([data-gts-ignore], [data-gts-ignore] *) {
        color: var(--gts-primary) !important;
      }

      ${scope} :where(input, textarea, select, option, [contenteditable="true"]):not([data-gts-ignore], [data-gts-ignore] *) {
        background-color: var(--gts-surface) !important;
        color: var(--gts-fg) !important;
        border-color: var(--gts-border) !important;
        accent-color: var(--gts-primary) !important;
      }

      ${scope} :where(button, [role="button"]):not([data-gts-ignore], [data-gts-ignore] *) {
        color: var(--gts-fg) !important;
        border-color: var(--gts-border) !important;
        accent-color: var(--gts-primary) !important;
      }

      ${scope} :where(input, textarea)::placeholder {
        color: var(--gts-muted) !important;
        opacity: 1 !important;
      }

      ${scope} :where([disabled], [aria-disabled="true"], small, figcaption, time):not([data-gts-ignore], [data-gts-ignore] *) {
        color: var(--gts-muted) !important;
      }

      ${scope} ::selection {
        background-color: var(--gts-primary-strong) !important;
        color: var(--gts-bg) !important;
      }

      ${scope} [data-gts-before-bg]::before { background-color: var(--gts-before-color) !important; }
      ${scope} [data-gts-after-bg]::after { background-color: var(--gts-after-color) !important; }
      ${scope} [data-gts-before-flat]::before,
      ${scope} [data-gts-after-flat]::after { background-image: none !important; }

      ${scope} :where([class*="skeleton" i], [class*="placeholder" i], [class*="shimmer" i], [aria-busy="true"]):not([data-gts-ignore], [data-gts-ignore] *) {
        background-color: var(--gts-surface-muted) !important;
        background-image: none !important;
        border-color: var(--gts-border) !important;
      }
    `;
  }

  function rootCss(palette) {
    return `
      :root {
        color-scheme: ${palette.colorScheme} !important;
        ${paletteVariables(palette)}
        --text1: var(--gts-fg) !important;
        --text2: var(--gts-muted) !important;
        --text3: var(--gts-muted) !important;
        --bg1: var(--gts-surface) !important;
        --bg2: var(--gts-surface-muted) !important;
        --bg3: var(--gts-bg) !important;
        --line_regular: var(--gts-border) !important;
        --line_light: var(--gts-border) !important;
      }
      html[data-gts-mode] { background-color: var(--gts-bg) !important; background-image: none !important; color: var(--gts-fg) !important; }
      html[data-gts-mode] body { background-color: var(--gts-bg) !important; background-image: none !important; color: var(--gts-fg) !important; }
      ${commonThemeRules("html[data-gts-mode] body")}
    `;
  }

  function shadowCss(palette) {
    return `
      :host { color-scheme: ${palette.colorScheme} !important; ${paletteVariables(palette)} color: var(--gts-fg) !important; }
      ${commonThemeRules(":host")}
    `;
  }

  function ensureStyleState(el) {
    let state = ORIGINAL_STYLES.get(el);
    if (!state) {
      state = new Map();
      ORIGINAL_STYLES.set(el, state);
      TOUCHED_ELEMENTS.add(el);
    }
    return state;
  }

  function setThemedStyle(el, property, value, priority = "important") {
    if (!(el instanceof Element) || !property || value == null) return;
    const state = ensureStyleState(el);
    if (!state.has(property)) {
      state.set(property, {
        value: el.style.getPropertyValue(property),
        priority: el.style.getPropertyPriority(property),
        appliedValue: "",
        appliedPriority: ""
      });
    }
    el.style.setProperty(property, value, priority);
    const snapshot = state.get(property);
    snapshot.appliedValue = el.style.getPropertyValue(property);
    snapshot.appliedPriority = el.style.getPropertyPriority(property);
  }

  function hasThemedStyle(el, property) {
    return ORIGINAL_STYLES.get(el)?.has(property) || false;
  }

  function markApplied(el, type) {
    if (!(el instanceof Element) || !type) return;
    const marks = new Set((el.getAttribute(MARK_ATTR) || "").split(",").map((item) => item.trim()).filter(Boolean));
    marks.add(type);
    el.setAttribute(MARK_ATTR, Array.from(marks).join(","));
  }

  function restoreElement(el) {
    const state = ORIGINAL_STYLES.get(el);
    if (state) {
      state.forEach((original, property) => {
        const currentValue = el.style.getPropertyValue(property);
        const currentPriority = el.style.getPropertyPriority(property);
        if (currentValue !== original.appliedValue || currentPriority !== original.appliedPriority) return;
        if (original.value) el.style.setProperty(property, original.value, original.priority);
        else el.style.removeProperty(property);
      });
      ORIGINAL_STYLES.delete(el);
      TOUCHED_ELEMENTS.delete(el);
    }
    el.removeAttribute?.(MARK_ATTR);
    PSEUDO_ATTRS.forEach((attribute) => el.removeAttribute?.(attribute));
  }

  function clearAppliedStyles() {
    Array.from(TOUCHED_ELEMENTS).forEach(restoreElement);
    document.querySelectorAll(`[${MARK_ATTR}], [data-gts-before-bg], [data-gts-after-bg]`).forEach((el) => {
      el.removeAttribute(MARK_ATTR);
      PSEUDO_ATTRS.forEach((attribute) => el.removeAttribute(attribute));
    });
  }

  function shouldIgnoreElement(el) {
    if (!(el instanceof Element) || MEDIA_TAGS.has(el.tagName)) return true;
    if (el.tagName === "STYLE" || el.tagName === "SCRIPT" || el.tagName === "LINK" || el.tagName === "META") return true;
    if (el.hasAttribute("data-gts-ignore") || el.closest("[data-gts-ignore]")) return true;
    const root = el.getRootNode?.();
    if (root instanceof ShadowRoot && root.host?.closest?.("[data-gts-ignore]")) return true;
    return Boolean(el.closest("picture, video, canvas, iframe, object, embed"));
  }

  function containsRasterImage(backgroundImage) {
    return /(?:url|image-set|cross-fade)\s*\(/i.test(backgroundImage || "");
  }

  function containsCssPaint(backgroundImage) {
    return backgroundImage && backgroundImage !== "none" && !containsRasterImage(backgroundImage);
  }

  function chooseBackgroundRole(el, color, documentColor) {
    if (colorChroma(color) >= 0.16 && color.a >= 0.15) {
      return luminance(color) < 0.42 ? "primary700" : "primary500";
    }
    if (documentColor && colorDistance(color, documentColor) < 24) return "background";
    if (el.matches("main, [role='main']") && color.a > 0.9) return "background";
    const delta = documentColor ? luminance(color) - luminance(documentColor) : 0;
    return Math.abs(delta) < 0.035 ? "surfaceMuted" : "surface";
  }

  function bestAccentForeground(palette, backgroundValue) {
    const background = parseCssColor(backgroundValue);
    const foreground = parseCssColor(palette.foreground);
    const page = parseCssColor(palette.background);
    if (!background || !foreground || !page) return palette.foreground;
    return contrastRatio(page, background) > contrastRatio(foreground, background) ? palette.background : palette.foreground;
  }

  function themePseudoElement(el, pseudo, palette, documentColor) {
    let computed;
    try {
      computed = getComputedStyle(el, pseudo);
    } catch {
      return;
    }
    if (!computed || computed.content === "none" || computed.content === "normal") return;
    const background = parseCssColor(computed.backgroundColor);
    const image = computed.backgroundImage;
    if ((!background || background.a < 0.02) && (!image || image === "none")) return;
    const role = chooseBackgroundRole(el, background || documentColor, documentColor);
    const name = pseudo === "::before" ? "before" : "after";
    setThemedStyle(el, `--gts-${name}-color`, withAlpha(palette[role], background?.a ?? 1));
    el.setAttribute(`data-gts-${name}-bg`, "");
    if (containsCssPaint(image)) el.setAttribute(`data-gts-${name}-flat`, "");
    markApplied(el, MARK_BG);
  }

  function themeElement(el, palette, documentColor) {
    if (shouldIgnoreElement(el) || el === document.documentElement || el === document.body) return;
    let computed;
    try {
      computed = getComputedStyle(el);
    } catch {
      return;
    }

    const background = parseCssColor(computed.backgroundColor);
    const backgroundImage = computed.backgroundImage;
    const hasPaint = containsCssPaint(backgroundImage);
    if ((background && background.a >= 0.02) || hasPaint) {
      const sourceColor = background && background.a >= 0.02 ? background : documentColor;
      const role = chooseBackgroundRole(el, sourceColor, documentColor);
      const target = withAlpha(palette[role], sourceColor?.a ?? 1);
      if (!hasThemedStyle(el, "background-color")) setThemedStyle(el, "background-color", target);
      if (hasPaint && !hasThemedStyle(el, "background-image")) setThemedStyle(el, "background-image", "none");
      markApplied(el, MARK_BG);

      if (role === "primary500" || role === "primary700") {
        if (!hasThemedStyle(el, "color")) setThemedStyle(el, "color", bestAccentForeground(palette, palette[role]));
        markApplied(el, MARK_TEXT);
      }
    }

    if (el instanceof SVGElement) {
      const fill = parseCssColor(computed.fill);
      const stroke = parseCssColor(computed.stroke);
      if (fill && fill.a > 0.02 && computed.fill !== "none") setThemedStyle(el, "fill", "currentColor");
      if (stroke && stroke.a > 0.02 && computed.stroke !== "none") setThemedStyle(el, "stroke", "currentColor");
    }

    if (el instanceof HTMLElement && (el.hasAttribute("class") || el.hasAttribute("id") || el.localName.includes("-"))) {
      themePseudoElement(el, "::before", palette, documentColor);
      themePseudoElement(el, "::after", palette, documentColor);
    }
  }

  function resolveDocumentBgColor() {
    for (const el of [document.body, document.documentElement]) {
      if (!el) continue;
      const color = parseCssColor(getComputedStyle(el).backgroundColor);
      if (color && color.a >= 0.1) return color;
    }
    return parseCssColor("rgb(255, 255, 255)");
  }

  function collectElementsFromNode(node, elements, shadowRoots) {
    if (!node) return;
    if (node instanceof Element) elements.add(node);
    if (node instanceof Document || node instanceof DocumentFragment || node instanceof Element) {
      node.querySelectorAll?.("*").forEach((el) => elements.add(el));
    }
    Array.from(elements).forEach((el) => {
      if (el.shadowRoot && !shadowRoots.has(el.shadowRoot)) shadowRoots.add(el.shadowRoot);
    });
    Array.from(shadowRoots).forEach((root) => {
      root.querySelectorAll("*").forEach((el) => elements.add(el));
    });
  }

  function getAllRoots() {
    const roots = new Set([document]);
    const pending = [document];
    while (pending.length) {
      const root = pending.shift();
      root.querySelectorAll?.("*").forEach((el) => {
        if (el.shadowRoot && !roots.has(el.shadowRoot)) {
          roots.add(el.shadowRoot);
          pending.push(el.shadowRoot);
        }
      });
    }
    return Array.from(roots);
  }

  function rewriteRootColorVariables(palette, documentColor) {
    const root = document.documentElement;
    if (!root) return;
    const computed = getComputedStyle(root);
    for (let index = 0; index < computed.length; index += 1) {
      const property = computed[index];
      if (!property?.startsWith("--") || property.startsWith("--gts-")) continue;
      const value = computed.getPropertyValue(property).trim();
      const color = parseCssColor(value);
      if (!color || color.a < 0.02) continue;
      const name = property.toLowerCase();
      let role;
      if (/(?:border|divider|separator|stroke|line)/.test(name)) role = "border";
      else if (/(?:muted|secondary|tertiary|subtle|disabled|placeholder)/.test(name)) role = "muted";
      else if (/(?:primary|accent|brand|link|active|selected)/.test(name)) role = "primary500";
      else if (/(?:text|foreground|\bfg\b|font|ink)/.test(name)) role = "foreground";
      else if (documentColor && contrastRatio(color, documentColor) >= 3) role = "foreground";
      else role = chooseBackgroundRole(root, color, documentColor);
      setThemedStyle(root, property, withAlpha(palette[role], color.a));
    }
  }

  function getStyleElement() {
    return document.getElementById(THEME_STYLE_ID);
  }

  function applyRootCss(mode) {
    const palette = PALETTE[mode];
    if (!palette) return;
    let style = getStyleElement();
    if (!style) {
      style = document.createElement("style");
      style.id = THEME_STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = rootCss(palette);
    document.documentElement.setAttribute("data-gts-mode", mode);
  }

  function installShadowStyle(root, palette) {
    let style = root.querySelector(`style[${SHADOW_STYLE_ATTR}]`);
    if (!style) {
      style = document.createElement("style");
      style.setAttribute(SHADOW_STYLE_ATTR, "");
      root.appendChild(style);
    }
    style.textContent = shadowCss(palette);
  }

  function scheduleInIdle(callback) {
    if (typeof requestIdleCallback === "function") return requestIdleCallback(callback, { timeout: 180 });
    return window.setTimeout(() => callback({ timeRemaining: () => 8, didTimeout: true }), 16);
  }

  function cancelIdle(handle) {
    if (handle == null) return;
    if (typeof cancelIdleCallback === "function") cancelIdleCallback(handle);
    else window.clearTimeout(handle);
  }

  class ThemeEngine {
    constructor() {
      this.adapters = [];
      this.activeMode = MODES.OFF;
      this.activeWhitelist = [];
      this.observers = new Map();
      this.pendingNodes = new Set();
      this.rerenderTimer = null;
      this.adapterRefreshTimer = null;
      this.pendingAdapterElements = new Set();
      this.idleHandle = null;
      this.rewriteGeneration = 0;
      this.shadowEventHandler = (event) => {
        const root = event.target?.shadowRoot;
        if (this.activeMode === MODES.OFF || !root) return;
        this.registerShadowRoot(root, PALETTE[this.activeMode]);
        this.queueNodes([root]);
      };
      document.addEventListener("gts:shadow-attached", this.shadowEventHandler, true);
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          if (this.activeMode !== MODES.OFF) this.run(this.activeMode);
        }, { once: true });
      }
    }

    registerAdapter(adapter) {
      const id = adapter?.id;
      if (typeof id === "string" && id) this.adapters = this.adapters.filter((item) => item.id !== id);
      this.adapters.push({ priority: 50, ...adapter });
    }

    resetAdapters() {
      this.adapters = [];
    }

    resolveAdapters() {
      const hostname = window.location.hostname;
      const url = window.location.href;
      return this.adapters.filter((adapter) => adapter.match(hostname, url)).sort((a, b) => a.priority - b.priority);
    }

    adapterContext(palette, candidates = null) {
      let scopedQuery;
      if (Array.isArray(candidates)) {
        const elements = Array.from(new Set(candidates.filter((item) => item instanceof Element)));
        scopedQuery = (selector) => elements.filter((el) => {
          try { return el.matches(selector); } catch { return false; }
        });
      } else {
        const roots = getAllRoots();
        scopedQuery = (selector) => {
          const result = [];
          roots.forEach((root) => root.querySelectorAll(selector).forEach((el) => result.push(el)));
          return result;
        };
      }
      return { queryAllDeep: scopedQuery, palette, markApplied, setThemedStyle };
    }

    removeTheme() {
      this.rewriteGeneration += 1;
      cancelIdle(this.idleHandle);
      this.idleHandle = null;
      if (this.rerenderTimer) window.clearTimeout(this.rerenderTimer);
      if (this.adapterRefreshTimer) window.clearTimeout(this.adapterRefreshTimer);
      this.pendingNodes.clear();
      this.pendingAdapterElements.clear();
      this.observers.forEach((observer) => observer.disconnect());
      this.observers.clear();
      getStyleElement()?.remove();
      document.querySelectorAll?.(`style[${SHADOW_STYLE_ATTR}]`).forEach((style) => style.remove());
      getAllRoots().forEach((root) => {
        if (root instanceof ShadowRoot) root.querySelector(`style[${SHADOW_STYLE_ATTR}]`)?.remove();
      });
      clearAppliedStyles();
      document.documentElement.removeAttribute("data-gts-mode");
    }

    forceRootStyles(palette) {
      [document.documentElement, document.body].forEach((el) => {
        if (!el) return;
        setThemedStyle(el, "background-color", palette.background);
        setThemedStyle(el, "background-image", "none");
        setThemedStyle(el, "color", palette.foreground);
        markApplied(el, MARK_BG);
        markApplied(el, MARK_TEXT);
      });
    }

    registerShadowRoot(root, palette) {
      if (!(root instanceof ShadowRoot)) return;
      if (root.host?.closest?.("[data-gts-ignore]")) return;
      installShadowStyle(root, palette);
      if (this.observers.has(root)) return;
      const observer = new MutationObserver((mutations) => this.handleMutations(mutations));
      observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
      this.observers.set(root, observer);
    }

    discoverAndRegisterRoots(nodes, palette) {
      const elements = new Set();
      const roots = new Set();
      nodes.forEach((node) => collectElementsFromNode(node, elements, roots));
      let previousSize = -1;
      while (previousSize !== roots.size) {
        previousSize = roots.size;
        Array.from(roots).forEach((root) => collectElementsFromNode(root, elements, roots));
      }
      roots.forEach((root) => this.registerShadowRoot(root, palette));
      return Array.from(elements);
    }

    rewriteElements(elements, palette, documentColor, immediateCount = 220) {
      const generation = this.rewriteGeneration;
      let index = 0;
      const process = (limit) => {
        const end = Math.min(elements.length, index + limit);
        while (index < end) themeElement(elements[index++], palette, documentColor);
      };
      process(immediateCount);
      const work = (deadline) => {
        if (generation !== this.rewriteGeneration || this.activeMode === MODES.OFF) return;
        let processed = 0;
        while (index < elements.length && processed < 500 && (deadline.didTimeout || deadline.timeRemaining() > 2)) {
          themeElement(elements[index++], palette, documentColor);
          processed += 1;
        }
        if (index < elements.length) this.idleHandle = scheduleInIdle(work);
        else this.idleHandle = null;
      };
      if (index < elements.length) this.idleHandle = scheduleInIdle(work);
    }

    run(mode) {
      const palette = PALETTE[mode];
      if (!palette) return;
      this.rewriteGeneration += 1;
      cancelIdle(this.idleHandle);
      this.idleHandle = null;
      if (this.rerenderTimer) window.clearTimeout(this.rerenderTimer);
      if (this.adapterRefreshTimer) window.clearTimeout(this.adapterRefreshTimer);
      this.rerenderTimer = null;
      this.adapterRefreshTimer = null;
      this.pendingNodes.clear();
      this.pendingAdapterElements.clear();
      clearAppliedStyles();
      getStyleElement()?.remove();
      document.documentElement.removeAttribute("data-gts-mode");
      getAllRoots().forEach((root) => {
        if (root instanceof ShadowRoot) root.querySelector(`style[${SHADOW_STYLE_ATTR}]`)?.remove();
      });
      const documentColor = resolveDocumentBgColor();
      applyRootCss(mode);
      this.forceRootStyles(palette);
      rewriteRootColorVariables(palette, documentColor);
      const elements = this.discoverAndRegisterRoots([document], palette);
      this.rewriteElements(elements, palette, documentColor);
      this.resolveAdapters().forEach((adapter) => adapter.apply?.(this.adapterContext(palette)));
    }

    runIncremental(mode, changedNodes) {
      const palette = PALETTE[mode];
      if (!palette || !changedNodes.length) return [];
      this.forceRootStyles(palette);
      const elements = this.discoverAndRegisterRoots(changedNodes, palette);
      elements.forEach((el) => {
        if (el !== document.documentElement && el !== document.body) restoreElement(el);
      });
      this.rewriteElements(elements, palette, parseCssColor(palette.background), 320);
      return elements;
    }

    refreshAdaptersDebounced(elements) {
      elements?.forEach((el) => this.pendingAdapterElements.add(el));
      if (this.adapterRefreshTimer) window.clearTimeout(this.adapterRefreshTimer);
      this.adapterRefreshTimer = window.setTimeout(() => {
        if (this.activeMode === MODES.OFF) return;
        const palette = PALETTE[this.activeMode];
        const candidates = Array.from(this.pendingAdapterElements);
        this.pendingAdapterElements.clear();
        this.resolveAdapters().forEach((adapter) => adapter.apply?.(this.adapterContext(palette, candidates)));
      }, 360);
    }

    queueNodes(nodes) {
      nodes.forEach((node) => {
        if (node instanceof Element || node instanceof ShadowRoot || node instanceof DocumentFragment) this.pendingNodes.add(node);
      });
      if (!this.pendingNodes.size) return;
      if (this.rerenderTimer) window.clearTimeout(this.rerenderTimer);
      this.rerenderTimer = window.setTimeout(() => {
        const pending = Array.from(this.pendingNodes);
        this.pendingNodes.clear();
        const elements = this.runIncremental(this.activeMode, pending);
        this.refreshAdaptersDebounced(elements);
      }, 72);
    }

    handleMutations(mutations) {
      if (this.activeMode === MODES.OFF) return;
      const changed = [];
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes") changed.push(mutation.target);
        if (mutation.type === "childList") changed.push(mutation.target);
        mutation.addedNodes.forEach((node) => changed.push(node));
        mutation.removedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          restoreElement(node);
          node.querySelectorAll?.("*").forEach(restoreElement);
        });
      });
      this.queueNodes(changed);
    }

    setupObserver() {
      this.observers.forEach((observer) => observer.disconnect());
      this.observers.clear();
      const observer = new MutationObserver((mutations) => this.handleMutations(mutations));
      observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
      this.observers.set(document, observer);
      const palette = PALETTE[this.activeMode];
      getAllRoots().forEach((root) => {
        if (root instanceof ShadowRoot) this.registerShadowRoot(root, palette);
      });
    }

    applySettings(mode, whitelist) {
      this.activeWhitelist = normalizeWhitelist(whitelist);
      if (isWhitelistedSite(this.activeWhitelist) || mode === MODES.OFF || !PALETTE[mode]) {
        this.activeMode = MODES.OFF;
        this.removeTheme();
        return;
      }
      this.activeMode = mode;
      this.run(mode);
      this.setupObserver();
    }

    setPalette(remotePalette) {
      if (!remotePalette || typeof remotePalette !== "object") {
        PALETTE = { ...DEFAULT_PALETTE };
        return;
      }
      const next = { ...DEFAULT_PALETTE };
      for (const mode of [MODES.LIGHT, MODES.DARK]) {
        const normalized = normalizeRemoteColors(remotePalette[mode], mode);
        if (normalized) next[mode] = normalized;
      }
      PALETTE = next;
    }

    async loadInitialSettings() {
      try {
        const [syncData, localData] = await Promise.all([
          chrome.storage.sync.get([STORAGE_KEY, WHITELIST_KEY]),
          chrome.storage.local.get("gtsPalette")
        ]);
        return {
          mode: syncData[STORAGE_KEY] || MODES.OFF,
          whitelist: normalizeWhitelist(syncData[WHITELIST_KEY] || []),
          palette: localData.gtsPalette || null
        };
      } catch {
        return { mode: MODES.OFF, whitelist: [], palette: null };
      }
    }
  }

  const ADAPTER_PRE_QUEUE = [];
  window.__GTS_ENGINE__ = {
    MODES,
    STORED_AUTO,
    resolveStoredThemeMode,
    get PALETTE() { return PALETTE; },
    DEFAULT_PALETTE,
    normalizeRemoteColors,
    MARK_BG,
    MARK_TEXT,
    MARK_BORDER,
    ThemeEngine,
    enqueueAdapter(adapter) { ADAPTER_PRE_QUEUE.push(adapter); },
    clearAdapterPreQueue() { ADAPTER_PRE_QUEUE.length = 0; },
    drainAdapterPreQueue(engine) {
      while (ADAPTER_PRE_QUEUE.length) engine?.registerAdapter?.(ADAPTER_PRE_QUEUE.shift());
    }
  };
})();
