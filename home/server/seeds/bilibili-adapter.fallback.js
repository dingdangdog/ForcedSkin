(() => {
  const engineApi = window.__GTS_ENGINE__;
  if (!engineApi) return;

  const MARK_BG = engineApi.MARK_BG;
  const MARK_TEXT = engineApi.MARK_TEXT;
  const MARK_BORDER = engineApi.MARK_BORDER;

  /**
   * ForcedSkin 站点适配器 — 「着色分层」约定（固定公式）
   *
   * 引擎会先注入全局主题，适配器只做站内补丁。每条规则是一个 StyleLayer：
   *
   * | layer.kind | 语义           | 典型 palette 映射 |
   * |------------|----------------|-------------------|
   * | surface    | 面板/列表容器  | bg=surface, fg=foreground, border=border |
   * | accent     | 选中/激活态    | bg+border=primary700, fg=background（与主背景对比） |
   * | canvas     | 大底图区       | 去掉 background-image，bg=background |
   * | richText   | 富文本组件变量 | 写自定义 CSS 变量 + fg |
   * | svgShapes  | 矢量图标形状   | fill/stroke→currentColor（不打 MARK_*，避免与宿主清除逻辑打架） |
   *
   * 不参与着色（与引擎 shouldSkipElement 对齐的补充）：
   * - class 含 mask / overlay / backdrop / shade / curtain / player-mask 等
   * - pointer-events: none
   * - rgba 背景且 alpha < 0.9（半透明叠层）
   *
   * markApplied 仅允许引擎识别的三种记号：MARK_BG、MARK_TEXT、MARK_BORDER（即 "bg","text","border"），
   * 否则 removeTheme 时无法清除对应 inline 样式。
   *
   * 【镜像】须与 extension/src/content/adapters/bilibili.js 保持一致。
   */

  function shouldSkipOverlayLike(el) {
    if (!el || !(el instanceof HTMLElement)) return false;
    const cls = (el.className || "").toString().toLowerCase();
    const keywordHit =
      cls.includes("mask") ||
      cls.includes("overlay") ||
      cls.includes("backdrop") ||
      cls.includes("shade") ||
      cls.includes("modal-backdrop") ||
      cls.includes("curtain") ||
      cls.includes("video-mask") ||
      cls.includes("player-mask");
    if (keywordHit) return true;
    const cs = getComputedStyle(el);
    if (cs.pointerEvents === "none") return true;
    if (cs.backgroundColor.startsWith("rgba(")) {
      const parts = cs.backgroundColor.match(/rgba?\(([^)]+)\)/);
      if (parts) {
        const nums = parts[1].split(",").map((x) => Number(x.trim()));
        const alpha = nums.length > 3 ? nums[3] : 1;
        if (alpha < 0.9) return true;
      }
    }
    return false;
  }

  function applyStyleLayers(ctx, layers) {
    const { queryAllDeep, palette, markApplied } = ctx;
    layers.forEach((layer) => {
      const map =
        typeof layer.styles === "function" ? layer.styles(palette) : layer.styles;
      queryAllDeep(layer.selector).forEach((el) => {
        if (!(el instanceof HTMLElement)) return;
        if (layer.skip?.(el)) return;
        Object.entries(map).forEach(([key, value]) => {
          el.style.setProperty(key, value, "important");
        });
        (layer.marks || []).forEach((m) => markApplied(el, m));
      });
    });
  }

  const SURFACE_LAYER_MARKS = [MARK_BG, MARK_BORDER, MARK_TEXT];

  const bgSelectors = [
    "[class*='bili-']",
    "[class*='bpx-']",
    "[class*='bui-']",
    "[class*='dyn-']",
    "[class*='search-']",
    "[class*='message-']",
    "[class*='eplist_']",
    "[class*='numberList_']",
    "[class*='numberListItem_']",
    "[class*='modeChangeBtn_']",
    "[class*='_ChatContent_']",
    "[class*='_InfiniteScroll_']",
    "[class*='_MessageList_']",
    "[class*='_Msg_']",
    "[class*='_Session_']",
    "[class*='_Conversation_']",
  ].join(",");

  const styleLayers = [
    {
      kind: "surface",
      selector: bgSelectors,
      skip: shouldSkipOverlayLike,
      styles: (p) => ({
        "background-color": p.surface,
        "border-color": p.border,
        color: p.foreground,
      }),
      marks: SURFACE_LAYER_MARKS,
    },
    {
      kind: "accent",
      selector: [
        "[class*='active']",
        "[class*='select']",
        "[class*='current']",
        ".bili-dyn-list-tabs__item.active",
        "[class*='numberListItem_select']",
      ].join(","),
      styles: (p) => ({
        "background-color": p.primary700,
        "border-color": p.primary700,
        color: p.background,
      }),
      marks: SURFACE_LAYER_MARKS,
    },
    {
      kind: "canvas",
      selector: ".message-bg,.message-bgc",
      styles: (p) => ({
        "background-image": "none",
        "background-color": p.background,
      }),
      marks: [MARK_BG],
    },
    {
      kind: "richText",
      selector: "bili-rich-text",
      styles: (p) => ({
        "--bili-rich-text-color": p.foreground,
        "--bili-rich-text-link-color": p.primary500,
        "--bili-rich-text-link-color-hover": p.primary700,
        color: p.foreground,
      }),
      marks: [MARK_TEXT],
    },
  ];

  const bilibiliAdapter = {
    id: "bilibili",
    priority: 100,
    match: (hostname) => hostname === "bilibili.com" || hostname.endsWith(".bilibili.com"),
    apply: (ctx) => {
      applyStyleLayers(ctx, styleLayers);

      ctx.queryAllDeep("svg path, svg rect, svg circle, svg polygon, svg line").forEach((shape) => {
        shape.style.setProperty("fill", "currentColor", "important");
        shape.style.setProperty("stroke", "currentColor", "important");
      });
    },
  };

  window.__GTS_BILIBILI_ADAPTER__ = bilibiliAdapter;
})();
