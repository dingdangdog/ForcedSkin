(() => {
  const THEME_STYLE_ID = "global-theme-switcher-style";
  const STORAGE_KEY = "themeMode";
  const WHITELIST_KEY = "siteWhitelist";
  const MARK_ATTR = "data-gts-applied";
  const MARK_BG = "bg";
  const MARK_TEXT = "text";
  const MARK_BORDER = "border";
  const MODES = {
    LIGHT: "light",
    DARK: "dark",
    OFF: "off"
  };

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

  /**
   * 将官网 ThemeColors JSON 格式转为引擎内部 palette 格式。
   * 官网格式：{ background, foreground, surface, surfaceMuted, border, muted, primary: { "500": ..., "700": ... } }
   * 引擎格式：{ colorScheme, background, foreground, surface, surfaceMuted, border, muted, primary500, primary700 }
   */
  function normalizeRemoteColors(colors, mode) {
    if (!colors || typeof colors !== "object") return null;
    const p = colors.primary;
    const primary500 = typeof p === "string" ? p : (p?.["500"] || p?.["600"] || DEFAULT_PALETTE[mode]?.primary500);
    const primary700 = typeof p === "string" ? p : (p?.["700"] || p?.["800"] || DEFAULT_PALETTE[mode]?.primary700);
    return {
      colorScheme: mode,
      background: colors.background || DEFAULT_PALETTE[mode]?.background,
      foreground: colors.foreground || DEFAULT_PALETTE[mode]?.foreground,
      surface: colors.surface || DEFAULT_PALETTE[mode]?.surface,
      surfaceMuted: colors.surfaceMuted || colors["surface-muted"] || DEFAULT_PALETTE[mode]?.surfaceMuted,
      border: colors.border || DEFAULT_PALETTE[mode]?.border,
      muted: colors.muted || DEFAULT_PALETTE[mode]?.muted,
      primary500,
      primary700,
    };
  }

  let PALETTE = { ...DEFAULT_PALETTE };

  const COLOR_PROBE = document.createElement("span");
  COLOR_PROBE.style.display = "none";
  let colorProbeMounted = false;
  const COLOR_CACHE = new Map();

  function mountColorProbe() {
    if (colorProbeMounted) return;
    (document.documentElement || document.body).appendChild(COLOR_PROBE);
    colorProbeMounted = true;
  }

  function parseCssColor(value) {
    if (!value || typeof value !== "string") return null;
    const cached = COLOR_CACHE.get(value);
    if (cached) return cached;
    mountColorProbe();
    COLOR_PROBE.style.color = "";
    COLOR_PROBE.style.color = value;
    const computed = getComputedStyle(COLOR_PROBE).color;
    const match = computed.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(",").map((s) => Number(s.trim()));
    if (parts.length < 3) return null;
    const parsed = { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
    COLOR_CACHE.set(value, parsed);
    return parsed;
  }

  function luminance(color) {
    const toLinear = (channel) => {
      const v = channel / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * toLinear(color.r) + 0.7152 * toLinear(color.g) + 0.0722 * toLinear(color.b);
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

  function isWhitelistedSite(whitelist) {
    const hostname = window.location.hostname.toLowerCase();
    return normalizeWhitelist(whitelist).some((entry) => hostname === entry || hostname.endsWith(`.${entry}`));
  }

  function rootCss(palette) {
    return `
      :root {
        color-scheme: ${palette.colorScheme} !important;
        --gts-bg: ${palette.background};
        --gts-fg: ${palette.foreground};
        --gts-surface: ${palette.surface};
        --gts-surface-muted: ${palette.surfaceMuted};
        --gts-border: ${palette.border};
        --gts-muted: ${palette.muted};
        --gts-primary: ${palette.primary500};
        --gts-primary-strong: ${palette.primary700};

        --text1: var(--gts-fg) !important;
        --text2: var(--gts-muted) !important;
        --text3: var(--gts-muted) !important;
        --bg1: var(--gts-surface) !important;
        --bg2: var(--gts-surface-muted) !important;
        --bg3: var(--gts-bg) !important;
        --line_regular: var(--gts-border) !important;
        --line_light: var(--gts-border) !important;
      }

      html {
        background-color: ${palette.background} !important;
        background-image: none !important;
        color: ${palette.foreground} !important;
      }

      body {
        background-color: ${palette.background} !important;
        background-image: none !important;
        color: ${palette.foreground} !important;
        scrollbar-color: var(--gts-border) var(--gts-surface-muted);
      }

      [class*="skeleton"], [class*="placeholder"], [class*="loading"], [class*="shimmer"], [aria-busy="true"] {
        background-color: var(--gts-surface-muted) !important;
        background-image: none !important;
        border-color: var(--gts-border) !important;
      }

      [class*="skeleton"]::before, [class*="skeleton"]::after,
      [class*="placeholder"]::before, [class*="placeholder"]::after,
      [class*="loading"]::before, [class*="loading"]::after,
      [class*="shimmer"]::before, [class*="shimmer"]::after {
        background-color: var(--gts-surface) !important;
        background-image: none !important;
        border-color: var(--gts-border) !important;
      }
    `;
  }

  function shouldSkipElement(el, computed) {
    if (!el || !computed) return true;
    const tag = el.tagName;
    if (!tag) return true;
    if (["IMG", "PICTURE", "VIDEO", "CANVAS", "IFRAME"].includes(tag)) return true;
    if (el.closest("video, picture, canvas, iframe")) return true;
    if (computed.backgroundImage && computed.backgroundImage !== "none") return true;
    if (computed.maskImage && computed.maskImage !== "none") return true;
    if (computed.webkitMaskImage && computed.webkitMaskImage !== "none") return true;
    if (computed.mixBlendMode && computed.mixBlendMode !== "normal") return true;
    if (computed.backdropFilter && computed.backdropFilter !== "none") return true;
    if (computed.webkitBackdropFilter && computed.webkitBackdropFilter !== "none") return true;
    const classText = (el.className && typeof el.className === "string") ? el.className.toLowerCase() : "";
    if (
      classText.includes("mask") ||
      classText.includes("overlay") ||
      classText.includes("backdrop") ||
      classText.includes("shade") ||
      classText.includes("modal-backdrop") ||
      classText.includes("curtain")
    ) return true;
    if (computed.pointerEvents === "none") return true;
    return false;
  }

  function markApplied(el, type) {
    const current = el.getAttribute(MARK_ATTR) || "";
    if (!current.includes(type)) {
      const next = current ? `${current},${type}` : type;
      el.setAttribute(MARK_ATTR, next);
    }
  }

  function clearAppliedStyles() {
    document.querySelectorAll(`[${MARK_ATTR}]`).forEach((el) => {
      const marks = (el.getAttribute(MARK_ATTR) || "").split(",").map((x) => x.trim());
      if (marks.includes(MARK_BG)) {
        el.style.removeProperty("background-color");
        el.style.removeProperty("background-image");
        el.style.removeProperty("background");
      }
      if (marks.includes(MARK_TEXT)) el.style.removeProperty("color");
      if (marks.includes(MARK_BORDER)) el.style.removeProperty("border-color");
      el.removeAttribute(MARK_ATTR);
    });
  }

  function getAllRoots() {
    const roots = [document];
    const queue = [document.documentElement];
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      if (current.shadowRoot) {
        roots.push(current.shadowRoot);
        queue.push(...current.shadowRoot.querySelectorAll("*"));
      }
      queue.push(...current.children);
    }
    return roots;
  }

  function queryAllDeep(selector) {
    const result = [];
    const roots = getAllRoots();
    roots.forEach((root) => {
      root.querySelectorAll(selector).forEach((el) => result.push(el));
    });
    return result;
  }

  function collectThemeCandidatesFromNode(node, bucket) {
    if (!node) return;
    if (node instanceof HTMLElement || node instanceof SVGElement) bucket.push(node);
    if (node instanceof Element) node.querySelectorAll("*").forEach((el) => bucket.push(el));
    if (node.shadowRoot) collectThemeCandidatesFromNode(node.shadowRoot, bucket);
    if (node instanceof ShadowRoot) node.querySelectorAll("*").forEach((el) => bucket.push(el));
  }

  function resolveDocumentBgColor() {
    const body = document.body;
    if (body) {
      const parsed = parseCssColor(getComputedStyle(body).backgroundColor);
      if (parsed) return parsed;
    }
    const root = document.documentElement;
    if (root) {
      const parsed = parseCssColor(getComputedStyle(root).backgroundColor);
      if (parsed) return parsed;
    }
    return parseCssColor("rgb(255, 255, 255)");
  }

  function contrastRatio(fg, bg) {
    const fgL = luminance(fg);
    const bgL = luminance(bg);
    const brighter = Math.max(fgL, bgL);
    const darker = Math.min(fgL, bgL);
    return (brighter + 0.05) / (darker + 0.05);
  }

  function applyGlobalRewriteToElements(elements, palette, fallbackBg) {
    const textFallbackBg = fallbackBg || resolveDocumentBgColor();
    const rootEls = new Set([document.documentElement, document.body].filter(Boolean));
    elements.forEach((el) => {
      if (!(el instanceof HTMLElement || el instanceof SVGElement)) return;
      if (rootEls.has(el)) return;
      const computed = getComputedStyle(el);
      if (shouldSkipElement(el, computed)) return;

      if (el instanceof HTMLElement) {
        let themedBgColor = null;
        const bg = parseCssColor(computed.backgroundColor);
        if (bg && bg.a >= 0.97) {
          const targetBg = luminance(bg) < 0.2 ? palette.surfaceMuted : palette.surface;
          el.style.setProperty("background-color", targetBg, "important");
          markApplied(el, MARK_BG);
          themedBgColor = parseCssColor(targetBg);
        }

        const borderWidth = parseFloat(computed.borderTopWidth || "0");
        if (!Number.isNaN(borderWidth) && borderWidth > 0) {
          el.style.setProperty("border-color", palette.border, "important");
          markApplied(el, MARK_BORDER);
        }

        const fg = parseCssColor(computed.color);
        const rawBg = parseCssColor(computed.backgroundColor);
        const bgForText = themedBgColor || (rawBg && rawBg.a > 0.05 ? rawBg : textFallbackBg);
        if (fg && bgForText && contrastRatio(fg, bgForText) < 5) {
          const target = el.matches("a, [role='link']") ? palette.primary500 : palette.foreground;
          el.style.setProperty("color", target, "important");
          markApplied(el, MARK_TEXT);
        }
      }

      if (el instanceof SVGElement || el.tagName === "path" || el.tagName === "rect" || el.tagName === "circle") {
        const fill = el.getAttribute("fill");
        const stroke = el.getAttribute("stroke");
        if (fill && fill !== "none" && !fill.startsWith("url(")) el.style.setProperty("fill", "currentColor", "important");
        if (stroke && stroke !== "none" && !stroke.startsWith("url(")) el.style.setProperty("stroke", "currentColor", "important");
        const host = el.closest("a,button,span,div");
        if (host instanceof HTMLElement) {
          host.style.setProperty("color", palette.foreground, "important");
          markApplied(host, MARK_TEXT);
        }
      }
    });
  }

  function applyGlobalRewrite(palette, targetNodes) {
    if (Array.isArray(targetNodes) && targetNodes.length > 0) {
      const elements = [];
      targetNodes.forEach((node) => collectThemeCandidatesFromNode(node, elements));
      applyGlobalRewriteToElements(elements, palette);
      return;
    }
    const roots = getAllRoots();
    const allElements = [];
    roots.forEach((root) => {
      root.querySelectorAll("*").forEach((el) => allElements.push(el));
    });
    applyGlobalRewriteToElements(allElements, palette);
  }

  function getStyleElement() {
    return document.getElementById(THEME_STYLE_ID);
  }

  function applyRootCss(mode) {
    const palette = PALETTE[mode];
    if (!palette) return;
    let styleEl = getStyleElement();
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = THEME_STYLE_ID;
      (document.head || document.documentElement).appendChild(styleEl);
    }
    styleEl.textContent = rootCss(palette);
    document.documentElement.setAttribute("data-gts-mode", mode);
  }

  class ThemeEngine {
    constructor() {
      this.adapters = [];
      this.activeMode = MODES.OFF;
      this.activeWhitelist = [];
      this.activeObserver = null;
      this.rerenderTimer = null;
      this.adapterRefreshTimer = null;
      this.pendingNodes = [];
      this.isApplying = false;
    }

    registerAdapter(adapter) {
      this.adapters.push({ priority: 50, ...adapter });
    }

    resolveAdapters() {
      const hostname = window.location.hostname;
      const url = window.location.href;
      return this.adapters.filter((a) => a.match(hostname, url)).sort((a, b) => a.priority - b.priority);
    }

    removeTheme() {
      const el = getStyleElement();
      if (el) el.remove();
      clearAppliedStyles();
      if (this.activeObserver) this.activeObserver.disconnect();
      this.activeObserver = null;
      document.documentElement.removeAttribute("data-gts-mode");
    }

    forceRootStyles(palette) {
      const htmlEl = document.documentElement;
      const bodyEl = document.body;
      [htmlEl, bodyEl].forEach((el) => {
        if (!el) return;
        el.style.setProperty("background-color", palette.background, "important");
        el.style.setProperty("background-image", "none", "important");
        el.style.setProperty("color", palette.foreground, "important");
        markApplied(el, MARK_BG);
        markApplied(el, MARK_TEXT);
      });
    }

    run(mode) {
      const palette = PALETTE[mode];
      if (!palette) return;
      const adapters = this.resolveAdapters();
      this.isApplying = true;
      applyRootCss(mode);
      clearAppliedStyles();
      this.forceRootStyles(palette);
      applyGlobalRewrite(palette);
      adapters.forEach((adapter) => {
        if (typeof adapter.apply === "function") adapter.apply({ queryAllDeep, palette, markApplied });
      });
      this.isApplying = false;
    }

    runIncremental(mode, changedNodes) {
      const palette = PALETTE[mode];
      if (!palette) return;
      if (!Array.isArray(changedNodes) || changedNodes.length === 0) return;
      this.isApplying = true;
      this.forceRootStyles(palette);
      applyGlobalRewrite(palette, changedNodes);
      this.isApplying = false;
    }

    refreshAdaptersDebounced() {
      if (this.adapterRefreshTimer) window.clearTimeout(this.adapterRefreshTimer);
      this.adapterRefreshTimer = window.setTimeout(() => {
        if (this.activeMode === MODES.OFF) return;
        const palette = PALETTE[this.activeMode];
        if (!palette) return;
        const adapters = this.resolveAdapters();
        this.isApplying = true;
        adapters.forEach((adapter) => {
          if (typeof adapter.apply === "function") adapter.apply({ queryAllDeep, palette, markApplied });
        });
        this.isApplying = false;
      }, 420);
    }

    setupObserver() {
      if (this.activeObserver) this.activeObserver.disconnect();
      this.activeObserver = new MutationObserver((mutations) => {
        if (this.activeMode === MODES.OFF) return;
        if (this.isApplying) return;
        mutations.forEach((m) => {
          m.addedNodes.forEach((node) => {
            if (node instanceof Element || node instanceof ShadowRoot) this.pendingNodes.push(node);
          });
        });
        if (this.pendingNodes.length === 0) return;
        if (this.rerenderTimer) window.clearTimeout(this.rerenderTimer);
        this.rerenderTimer = window.setTimeout(() => {
          const nodes = this.pendingNodes.splice(0, this.pendingNodes.length);
          this.runIncremental(this.activeMode, nodes);
          this.refreshAdaptersDebounced();
        }, 90);
      });
      this.activeObserver.observe(document.documentElement, { childList: true, subtree: true });
    }

    applySettings(mode, whitelist) {
      this.activeWhitelist = normalizeWhitelist(whitelist);
      if (isWhitelistedSite(this.activeWhitelist) || mode === MODES.OFF) {
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
          chrome.storage.local.get("gtsPalette"),
        ]);
        return {
          mode: syncData[STORAGE_KEY] || MODES.OFF,
          whitelist: normalizeWhitelist(syncData[WHITELIST_KEY] || []),
          palette: localData.gtsPalette || null,
        };
      } catch {
        return { mode: MODES.OFF, whitelist: [], palette: null };
      }
    }
  }

  window.__GTS_ENGINE__ = {
    MODES,
    get PALETTE() { return PALETTE; },
    DEFAULT_PALETTE,
    normalizeRemoteColors,
    MARK_BG,
    MARK_TEXT,
    MARK_BORDER,
    ThemeEngine
  };
})();
