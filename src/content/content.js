const THEME_STYLE_ID = "global-theme-switcher-style";
const STORAGE_KEY = "themeMode";
const MARK_ATTR = "data-gts-applied";
const MARK_BG = "bg";
const MARK_TEXT = "text";
const MARK_BORDER = "border";
const MODES = {
  LIGHT: "light",
  DARK: "dark",
  OFF: "off"
};

const PALETTE = {
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

const ADAPTERS = [];
let activeObserver = null;
let activeMode = MODES.OFF;
let rerenderTimer = null;
let activeAdapters = [];

function registerAdapter(adapter) {
  ADAPTERS.push({
    priority: 50,
    ...adapter
  });
}

function resolveAdapters() {
  const hostname = window.location.hostname;
  const url = window.location.href;
  return ADAPTERS
    .filter((adapter) => adapter.match(hostname, url))
    .sort((a, b) => a.priority - b.priority);
}

function cssForRoot(palette) {
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
    }
    html, body {
      background-color: var(--gts-bg) !important;
      color: var(--gts-fg) !important;
    }
    body {
      scrollbar-color: var(--gts-border) var(--gts-surface-muted);
    }
    img, video, canvas, svg {
      filter: none !important;
    }
  `;
}

function parseColor(colorValue) {
  if (!colorValue) return null;
  if (colorValue.startsWith("rgb")) {
    const values = colorValue.replace(/[^\d.,]/g, "").split(",").map(Number);
    if (values.length < 3) return null;
    return { r: values[0], g: values[1], b: values[2], a: values[3] ?? 1 };
  }
  return null;
}

function luminance(color) {
  const toLinear = (channel) => {
    const v = channel / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(color.r) + 0.7152 * toLinear(color.g) + 0.0722 * toLinear(color.b);
}

function contrastRatio(foreground, background) {
  const fgL = luminance(foreground);
  const bgL = luminance(background);
  const brighter = Math.max(fgL, bgL);
  const darker = Math.min(fgL, bgL);
  return (brighter + 0.05) / (darker + 0.05);
}

function getStyleElement() {
  return document.getElementById(THEME_STYLE_ID);
}

function markApplied(el, type) {
  const current = el.getAttribute(MARK_ATTR) || "";
  if (!current.includes(type)) {
    const next = current ? `${current},${type}` : type;
    el.setAttribute(MARK_ATTR, next);
  }
}

function shouldSkipElement(el, computed) {
  if (!el || !computed) return true;
  const tag = el.tagName;
  if (!tag) return true;
  if (["IMG", "PICTURE", "VIDEO", "CANVAS", "SVG", "PATH", "IFRAME"].includes(tag)) return true;
  if (el.closest("svg, video, picture, canvas, iframe")) return true;
  if (computed.backgroundImage && computed.backgroundImage !== "none") return true;
  if (computed.maskImage && computed.maskImage !== "none") return true;
  if (computed.webkitMaskImage && computed.webkitMaskImage !== "none") return true;
  if (computed.mixBlendMode && computed.mixBlendMode !== "normal") return true;
  if (computed.backdropFilter && computed.backdropFilter !== "none") return true;
  if (computed.webkitBackdropFilter && computed.webkitBackdropFilter !== "none") return true;
  return false;
}

function clearAppliedStyles() {
  document.querySelectorAll(`[${MARK_ATTR}]`).forEach((el) => {
    const marks = (el.getAttribute(MARK_ATTR) || "").split(",").map((x) => x.trim());
    if (marks.includes(MARK_BG)) el.style.removeProperty("background-color");
    if (marks.includes(MARK_TEXT)) el.style.removeProperty("color");
    if (marks.includes(MARK_BORDER)) el.style.removeProperty("border-color");
    el.removeAttribute(MARK_ATTR);
  });
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
  styleEl.textContent = cssForRoot(palette);
  document.documentElement.setAttribute("data-gts-mode", mode);
}

function applyToElements(selectorList, fn) {
  const selectors = selectorList.filter(Boolean);
  if (!selectors.length) return;
  const nodes = document.querySelectorAll(selectors.join(","));
  nodes.forEach((el) => fn(el));
}

function maybeApplyBackground(el, palette) {
  const computed = window.getComputedStyle(el);
  if (shouldSkipElement(el, computed)) return;
  const bg = parseColor(computed.backgroundColor);
  if (!bg || bg.a < 0.75) return;
  const depthSurface = luminance(bg) < 0.2 ? palette.surfaceMuted : palette.surface;
  el.style.setProperty("background-color", depthSurface, "important");
  markApplied(el, MARK_BG);
}

function maybeApplyBorder(el, palette) {
  const computed = window.getComputedStyle(el);
  if (shouldSkipElement(el, computed)) return;
  const width = parseFloat(computed.borderTopWidth || "0");
  if (Number.isNaN(width) || width <= 0) return;
  el.style.setProperty("border-color", palette.border, "important");
  markApplied(el, MARK_BORDER);
}

function maybeApplyText(el, palette) {
  const computed = window.getComputedStyle(el);
  if (shouldSkipElement(el, computed)) return;
  if (el.childElementCount > 0 && !el.matches("a, button, label, span, p, h1, h2, h3, h4, h5, h6, li")) return;
  const text = (el.textContent || "").trim();
  if (!text) return;
  const fg = parseColor(computed.color);
  const bg = parseColor(computed.backgroundColor) || parseColor(window.getComputedStyle(document.body).backgroundColor);
  if (!fg || !bg) return;
  const ratio = contrastRatio(fg, bg);
  let target = palette.foreground;
  if (ratio >= 7) return;
  if (el.matches("a, [role='link']")) {
    target = palette.primary500;
  } else if (el.matches("[class*='meta'], [class*='sub'], [class*='desc'], [class*='time'], small")) {
    target = palette.muted;
  }
  el.style.setProperty("color", target, "important");
  markApplied(el, MARK_TEXT);
}

function runAdapter(adapter, mode) {
  const palette = PALETTE[mode];
  if (!palette) return;
  const selectors = adapter.selectors;
  applyToElements(selectors.background, (el) => maybeApplyBackground(el, palette));
  applyToElements(selectors.border, (el) => maybeApplyBorder(el, palette));
  applyToElements(selectors.text, (el) => maybeApplyText(el, palette));
}

function isThemeableMonochromeFill(fillValue) {
  if (!fillValue) return false;
  const value = fillValue.trim().toLowerCase();
  if (value === "none") return false;
  if (value.startsWith("url(")) return false;
  if (value === "currentcolor") return true;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(value)) return true;
  if (value.startsWith("rgb(") || value.startsWith("rgba(")) return true;
  return false;
}

function runAdapters(adapters, mode) {
  const palette = PALETTE[mode];
  if (!palette) return;
  adapters.forEach((adapter) => {
    runAdapter(adapter, mode);
    if (typeof adapter.afterApply === "function") {
      adapter.afterApply(palette, mode);
    }
  });
}

function setupObserver() {
  if (activeObserver) {
    activeObserver.disconnect();
  }
  activeObserver = new MutationObserver(() => {
    if (activeMode === MODES.OFF) return;
    if (rerenderTimer) window.clearTimeout(rerenderTimer);
    rerenderTimer = window.setTimeout(() => {
      activeAdapters = resolveAdapters();
      runAdapters(activeAdapters, activeMode);
    }, 220);
  });
  activeObserver.observe(document.documentElement, { childList: true, subtree: true });
  activeAdapters.forEach((adapter) => {
    if (typeof adapter.initObserver === "function") adapter.initObserver();
  });
}

function removeTheme() {
  const el = getStyleElement();
  if (el) el.remove();
  clearAppliedStyles();
  if (activeObserver) activeObserver.disconnect();
  activeObserver = null;
  activeAdapters = [];
  document.documentElement.removeAttribute("data-gts-mode");
}

function applyMode(mode) {
  activeMode = mode;
  if (mode === MODES.OFF) {
    removeTheme();
    return;
  }
  activeAdapters = resolveAdapters();
  applyRootCss(mode);
  clearAppliedStyles();
  runAdapters(activeAdapters, mode);
  setupObserver();
}

registerAdapter({
  id: "default",
  priority: 0,
  match: () => true,
  selectors: {
    background: [
      "main", "article", "section", "aside", "header", "footer", "nav",
      "div[class*='card']", "div[class*='panel']", "div[class*='container']", "div[class*='content']",
      "ul", "ol", "li", "table", "thead", "tbody", "tr", "td", "th",
      "input", "textarea", "select", "button"
    ],
    border: [
      "div", "section", "article", "aside", "nav", "header", "footer", "button", "input", "textarea", "select",
      "table", "thead", "tbody", "tr", "td", "th"
    ],
    text: [
      "h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "a", "label", "small", "strong", "em", "li", "button"
    ]
  }
});

registerAdapter({
  id: "bilibili",
  priority: 100,
  match: (hostname) => hostname === "bilibili.com" || hostname.endsWith(".bilibili.com"),
  selectors: {
    background: [
      "body", ".bili-layout", ".bili-header", ".bili-header__bar", ".bili-feed4",
      ".feed-card", ".bili-video-card", ".video-container-v1", ".video-info-container",
      ".video-toolbar-container", ".left-container-under-player", ".right-container-inner",
      ".comment-container", ".reply-box", ".reply-item", ".video-page-card-small", ".recommended-container_floor-aside",
      ".bili-header__channel", ".channel-items__left", ".channel-items__right", ".right-channel-container"
    ],
    border: [
      ".feed-card", ".bili-video-card", ".video-page-card-small", ".reply-item", ".reply-box",
      ".right-container-inner", ".video-toolbar-container", ".bili-header__bar", "input", "textarea", "button"
    ],
    text: [
      ".bili-video-card__info--tit", ".video-title", ".title-text", ".reply-content",
      ".bili-video-card__info--author", ".bili-video-card__stats", ".pubdate-text", ".view.item", ".dm.item",
      ".comment-container *", ".video-info-container *", "a", "span", "p", "h1", "h2", "h3", "button",
      ".bili-header__channel .channel-link", ".bili-header__channel .channel-link__right",
      ".bili-header__channel .icon-title", ".bili-header__channel .channel-entry-more__link"
    ]
  },
  afterApply: (palette) => {
    document.querySelectorAll(
      ".bili-layout,.bili-header,.bili-feed4,.feed-card,.bili-video-card,.video-container-v1,.video-info-container,.video-toolbar-container,.left-container-under-player,.right-container-inner,.comment-container,.reply-box,.reply-item,.video-page-card-small,.recommended-container_floor-aside,.bili-header__channel,.channel-items__left,.channel-items__right,.right-channel-container"
    ).forEach((el) => {
      el.style.setProperty("background-color", palette.surface, "important");
      el.style.setProperty("border-color", palette.border, "important");
      markApplied(el, MARK_BG);
      markApplied(el, MARK_BORDER);
    });

    document.querySelectorAll(
      ".channel-items__left .channel-link,.channel-items__right .channel-link__right,.channel-icons__item,.channel-entry-more__link"
    ).forEach((el) => {
      el.style.setProperty("background-color", palette.surfaceMuted, "important");
      el.style.setProperty("border-color", palette.border, "important");
      el.style.setProperty("color", palette.foreground, "important");
      markApplied(el, MARK_BG);
      markApplied(el, MARK_BORDER);
      markApplied(el, MARK_TEXT);
    });

    document.querySelectorAll(
      ".header-channel-fixed,.header-channel-fixed-left,.header-channel-fixed-center,.header-channel-fixed-right,.header-channel-fixed-right-left,.header-channel-fixed-right-right,.header-channel-fixed-arrow"
    ).forEach((el) => {
      el.style.setProperty("background-color", palette.surface, "important");
      el.style.setProperty("border-color", palette.border, "important");
      el.style.setProperty("color", palette.foreground, "important");
      markApplied(el, MARK_BG);
      markApplied(el, MARK_BORDER);
      markApplied(el, MARK_TEXT);
    });

    document.querySelectorAll(
      ".header-channel-fixed .header-channel-fixed-right-item,.header-channel-fixed .left-fixed-channel,.header-channel-fixed a"
    ).forEach((el) => {
      el.style.setProperty("background-color", palette.surfaceMuted, "important");
      el.style.setProperty("border-color", palette.border, "important");
      el.style.setProperty("color", palette.foreground, "important");
      markApplied(el, MARK_BG);
      markApplied(el, MARK_BORDER);
      markApplied(el, MARK_TEXT);
    });

    document.querySelectorAll(".bili-video-card__info--author,.bili-video-card__stats,.pubdate-text,.view.item,.dm.item")
      .forEach((el) => {
        el.style.setProperty("color", palette.muted, "important");
        markApplied(el, MARK_TEXT);
      });

    document.querySelectorAll(
      ".bili-header__channel .channel-link,.bili-header__channel .channel-link__right,.bili-header__channel .icon-title,.bili-header__channel .channel-entry-more__link"
    ).forEach((el) => {
      const isPrimary = el.matches(".icon-title");
      el.style.setProperty("color", isPrimary ? palette.primary500 : palette.foreground, "important");
      markApplied(el, MARK_TEXT);
    });

    document.querySelectorAll(".bili-header__channel .side-icon path,.bili-header__channel .icon-bg--icon path")
      .forEach((pathEl) => {
        const fillValue = pathEl.getAttribute("fill");
        if (!isThemeableMonochromeFill(fillValue)) return;
        pathEl.style.setProperty("fill", "currentColor", "important");
        const anchor = pathEl.closest(".channel-link,.channel-link__right,.channel-icons__item");
        if (anchor) {
          const iconColor = anchor.matches(".channel-icons__item") ? palette.primary500 : palette.foreground;
          anchor.style.setProperty("color", iconColor, "important");
          markApplied(anchor, MARK_TEXT);
        }
      });
  }
});

async function getCurrentMode() {
  try {
    const { themeMode } = await chrome.storage.sync.get(STORAGE_KEY);
    return themeMode || MODES.OFF;
  } catch {
    return MODES.OFF;
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (!message || typeof message !== "object") return;
  if (message.type === "THEME_MODE_UPDATE") {
    applyMode(message.mode);
  }
});

getCurrentMode().then(applyMode);
