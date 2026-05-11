/**
 * ForcedSkin Adapter Builder — Element Picker
 * 注入到页面中，提供可视化元素选取功能
 * 仅在用户开启「适配器构建器」模式时激活
 */
(() => {
  "use strict";

  const STYLE_ID = "gts-adapter-builder-style";
  const TOOLTIP_ID = "gts-adapter-builder-tooltip";
  const OVERLAY_CLS = "gts-builder-overlay";

  let active = false;
  let hoveredEl = null;
  let overlayEl = null;
  let tooltipEl = null;

  /* ---------- CSS Selector 生成 ---------- */

  function getElementSelector(el) {
    if (!el || el === document.body) return "body";
    if (el === document.documentElement) return "html";

    // ID 优先
    if (el.id) return `#${CSS.escape(el.id)}`;

    const path = [];
    let current = el;

    while (current && current !== document.body && current !== document.documentElement) {
      let selector = current.tagName.toLowerCase();

      // 类名
      if (current.className && typeof current.className === "string") {
        const classes = current.className
          .trim()
          .split(/\s+/)
          .filter((c) => c && !c.startsWith("gts-") && !c.startsWith("_") && c.length > 1)
          .slice(0, 3);
        if (classes.length) {
          selector += classes.map((c) => `.${CSS.escape(c)}`).join("");
        }
      }

      // nth-child 消歧义（同类元素超过 1 个时加）
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (s) => s.tagName === current.tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-child(${index})`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;

      // 碰到有 ID 的祖先就停（前面的路径用 ID 代替）
      if (current && current.id && current !== document.body) {
        path.unshift(`#${CSS.escape(current.id)}`);
        break;
      }

      // 最多 5 层
      if (path.length >= 5) break;
    }

    return path.join(" > ");
  }

  /** 生成完整的 CSS 选择器路径（含 Shadow DOM 标记） */
  function buildFullSelector(el) {
    const parts = [];
    let current = el;

    while (current && current !== document.body && current !== document.documentElement) {
      const tag = current.tagName.toLowerCase();
      let sel = tag;

      if (current.id) {
        sel = `#${CSS.escape(current.id)}`;
        parts.unshift(sel);
        break;
      }

      if (current.className && typeof current.className === "string") {
        const cls = current.className.trim().split(/\s+/).filter(Boolean).slice(0, 2);
        if (cls.length) sel += cls.map((c) => `.${CSS.escape(c)}`).join("");
      }

      const parent = current.parentElement || current.parentNode;
      if (parent && parent.children) {
        const sameTag = Array.from(parent.children).filter((s) => s.tagName === current.tagName);
        if (sameTag.length > 1) {
          const idx = sameTag.indexOf(current) + 1;
          sel += `:nth-child(${idx})`;
        }
      }

      parts.unshift(sel);
      current = current.parentElement || current.parentNode?.host;
      if (current && current.host) {
        // Shadow root 边界
        parts.unshift(">>>");
        current = current.host;
      } else if (current && current.shadowRoot) {
        parts.unshift(">>>");
      }
    }

    return parts.join(" > ");
  }

  function getElementDescription(el) {
    const tag = el.tagName.toLowerCase();
    const text = (el.textContent || "").trim().slice(0, 40);
    const cls = el.className
      ? (typeof el.className === "string" ? el.className : "")
          .trim()
          .split(/\s+/)
          .filter((c) => c && !c.startsWith("gts-"))
          .slice(0, 2)
          .join(".")
      : "";
    return { tag, text, classHint: cls };
  }

  /* ---------- 高亮覆盖层 ---------- */

  function createStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .${OVERLAY_CLS} {
        outline: 2px solid #4CAF50 !important;
        outline-offset: 1px !important;
        background-color: rgba(76, 175, 80, 0.08) !important;
        cursor: crosshair !important;
        transition: outline 0.1s ease;
      }
      .${OVERLAY_CLS}-clicked {
        outline: 3px solid #2196F3 !important;
        outline-offset: 2px !important;
        background-color: rgba(33, 150, 243, 0.10) !important;
      }
      #${TOOLTIP_ID} {
        position: fixed;
        z-index: 2147483647;
        background: #1a1a1a;
        color: #e0e0e0;
        font: 11px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", monospace;
        padding: 6px 10px;
        border-radius: 6px;
        pointer-events: none;
        box-shadow: 0 2px 12px rgba(0,0,0,0.4);
        max-width: 420px;
        word-break: break-all;
        border: 1px solid #333;
      }
      #${TOOLTIP_ID} .gts-builder-tip-tag {
        color: #4CAF50;
        font-weight: 600;
      }
      #${TOOLTIP_ID} .gts-builder-tip-cls {
        color: #82B1FF;
      }
      #${TOOLTIP_ID} .gts-builder-tip-text {
        color: #999;
        font-style: italic;
      }
      #${TOOLTIP_ID} .gts-builder-tip-sel {
        color: #ccc;
        display: block;
        margin-top: 2px;
        padding-top: 2px;
        border-top: 1px solid #333;
      }
    `;
    document.head.appendChild(style);
  }

  function createTooltip() {
    if (document.getElementById(TOOLTIP_ID)) return;
    const tip = document.createElement("div");
    tip.id = TOOLTIP_ID;
    tip.style.display = "none";
    document.body.appendChild(tip);
    return tip;
  }

  function updateTooltip(el, x, y) {
    const t = tooltipEl;
    if (!t) return;
    const desc = getElementDescription(el);
    const sel = getElementSelector(el);
    t.innerHTML = `
      <span class="gts-builder-tip-tag">&lt;${desc.tag}&gt;</span>
      ${desc.classHint ? `<span class="gts-builder-tip-cls">.${desc.classHint}</span>` : ""}
      ${desc.text ? ` <span class="gts-builder-tip-text">"${desc.text}"</span>` : ""}
      <span class="gts-builder-tip-sel">${sel}</span>
    `;

    const pad = 14;
    let left = x + pad;
    let top = y + pad;

    // 避免溢出屏幕右/下边界
    const tw = t.offsetWidth || 300;
    const th = t.offsetHeight || 60;
    if (left + tw > window.innerWidth - 10) left = x - tw - pad;
    if (top + th > window.innerHeight - 10) top = y - th - pad;
    if (left < 4) left = 4;
    if (top < 4) top = 4;

    t.style.left = left + "px";
    t.style.top = top + "px";
    t.style.display = "block";
  }

  function enterPickerMode() {
    if (active) return;
    active = true;

    createStyles();
    tooltipEl = createTooltip() || document.getElementById(TOOLTIP_ID);

    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("mouseout", onMouseOut, true);
    document.addEventListener("click", onClick, true);
    // window + capture：比仅监听 document 更早收到按键，且焦点在 iframe 内时顶层 window 仍可能收到部分 Esc（取决于浏览器）；同时减少被页面 stop 的概率
    window.addEventListener("keydown", onKeyDown, true);
  }

  function exitPickerMode() {
    if (!active) return;
    active = false;

    document.removeEventListener("mouseover", onMouseOver, true);
    document.removeEventListener("mouseout", onMouseOut, true);
    document.removeEventListener("click", onClick, true);
    window.removeEventListener("keydown", onKeyDown, true);

    clearHighlight();
    if (tooltipEl) tooltipEl.style.display = "none";
  }

  function clearHighlight() {
    document.querySelectorAll(`.${OVERLAY_CLS}`).forEach((el) => {
      el.classList.remove(OVERLAY_CLS);
    });
    hoveredEl = null;
  }

  /* ---------- 事件处理 ---------- */

  function shouldSkip(el) {
    if (!el || el === document.body || el === document.documentElement) return true;
    if (el.id === TOOLTIP_ID || el.closest?.(`#${TOOLTIP_ID}`)) return true;
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "META" || el.tagName === "LINK") return true;
    return false;
  }

  function onMouseOver(e) {
    if (!active) return;
    const el = e.target;
    if (shouldSkip(el)) return;

    clearHighlight();
    hoveredEl = el;
    el.classList.add(OVERLAY_CLS);
    updateTooltip(el, e.clientX, e.clientY);
  }

  function onMouseOut(e) {
    if (!active) return;
    const el = e.target;
    if (el.classList.contains(OVERLAY_CLS)) {
      el.classList.remove(OVERLAY_CLS);
    }
    if (el === hoveredEl) hoveredEl = null;
  }

  function onClick(e) {
    if (!active) return;
    const el = e.target;
    if (shouldSkip(el)) return;

    e.preventDefault();
    e.stopPropagation();

    const selector = getElementSelector(el);
    const fullSelector = buildFullSelector(el);
    const desc = getElementDescription(el);
    const pageHost = (window.location.hostname || "").toLowerCase();

    // 发送选取结果给 popup
    chrome.runtime.sendMessage({
      type: "BUILDER_ELEMENT_SELECTED",
      selector,
      fullSelector,
      tagName: desc.tag,
      textHint: desc.text,
      classHint: desc.classHint,
      pageHost,
    });

    // 标记为已选取（蓝色）
    el.classList.remove(OVERLAY_CLS);
    el.classList.add(`${OVERLAY_CLS}-clicked`);
    hoveredEl = null;
    if (tooltipEl) tooltipEl.style.display = "none";
  }

  function onKeyDown(e) {
    if (!active) return;
    const isEsc =
      e.key === "Escape" ||
      e.key === "Esc" ||
      e.code === "Escape" ||
      e.keyCode === 27;
    if (!isEsc) return;
    // 尽量从页面快捷键中「抢走」Esc，确保能退出选取模式
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") {
      e.stopImmediatePropagation();
    }
    exitPickerMode();
    try {
      chrome.runtime.sendMessage({ type: "BUILDER_CANCEL_PICK" });
    } catch (_) {}
  }

  /* ---------- 消息监听 ---------- */

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || typeof message !== "object") return;

    if (message.type === "BUILDER_START_PICKING") {
      enterPickerMode();
    }

    if (message.type === "BUILDER_STOP_PICKING") {
      exitPickerMode();
    }

    if (message.type === "BUILDER_TEST_FORMULA") {
      testFormulaOnPage(message.layers);
    }

    if (message.type === "BUILDER_CLEAR_TEST") {
      clearTestFormula();
    }
  });

  /* ---------- 公式测试 ---------- */

  const TEST_STYLE_ID = "gts-builder-test-style";

  function testFormulaOnPage(layers) {
    // 清除之前的测试样式
    clearTestFormula();

    if (!Array.isArray(layers) || layers.length === 0) return;

    const engine = window.__GTS_ENGINE__;
    if (!engine) return;

    const palette = engine.PALETTE;
    const activeMode = document.documentElement.getAttribute("data-gts-mode") || "dark";
    const p = palette?.[activeMode];
    if (!p) return;

    let css = "/* ForcedSkin Adapter Builder Test */\n";

    // 从 adapter-formula.js 借用的 pickPalette 逻辑
    const pickColor = (key) => {
      const map = { background: p.background, foreground: p.foreground, surface: p.surface, surfaceMuted: p.surfaceMuted, border: p.border, muted: p.muted, primary500: p.primary500, primary700: p.primary700 };
      return map[key] || p.foreground;
    };

    layers.forEach((layer, i) => {
      const sel = (layer.selectors || []).filter(Boolean).join(",");
      if (!sel) return;

      if (layer.kind === "surface") {
        const bg = pickColor(layer.backgroundKey || "surface");
        css += `${sel} { background-color: ${bg} !important; border-color: ${p.border} !important; color: ${p.foreground} !important; }\n`;
      } else if (layer.kind === "accent") {
        css += `${sel} { background-color: ${p.primary700} !important; border-color: ${p.primary700} !important; color: ${p.background} !important; }\n`;
      } else if (layer.kind === "canvas") {
        css += `${sel} { background-image: none !important; background-color: ${p.background} !important; }\n`;
      } else if (layer.kind === "richText") {
        const vars = layer.cssVars || {};
        let varCss = "";
        Object.entries(vars).forEach(([prop, pkey]) => {
          varCss += `${prop}: ${pickColor(String(pkey))} !important; `;
        });
        css += `${sel} { color: ${pickColor(layer.color || "foreground")} !important; ${varCss}}\n`;
      } else if (layer.kind === "svgRecolor") {
        css += `${sel} { fill: ${pickColor(layer.fill || "foreground")} !important; stroke: ${pickColor(layer.stroke || "foreground")} !important; }\n`;
      }
    });

    const style = document.createElement("style");
    style.id = TEST_STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function clearTestFormula() {
    const style = document.getElementById(TEST_STYLE_ID);
    if (style) style.remove();
  }
})();
