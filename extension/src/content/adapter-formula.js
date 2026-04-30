/**
 * 声明式适配器公式解释器（forcedskin-adapter-formula/v1）
 * SiteAdapter.code 在服务端仅存 JSON；此处解析并注册 ThemeEngine 适配器，不执行任意 JS。
 */
(() => {
  const SCHEMA = "forcedskin-adapter-formula/v1";

  const PALETTE_KEYS = new Set([
    "background",
    "foreground",
    "surface",
    "surfaceMuted",
    "border",
    "muted",
    "primary500",
    "primary700",
  ]);

  function pickPalette(palette, key) {
    if (typeof key !== "string" || !PALETTE_KEYS.has(key)) return palette.foreground;
    return palette[key] ?? palette.foreground;
  }

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

  function hostnameMatches(hostname, rules) {
    const h = (hostname || "").toLowerCase();
    return rules.some((rule) => {
      if (!rule || typeof rule.op !== "string" || typeof rule.value !== "string") return false;
      const v = rule.value.toLowerCase();
      if (rule.op === "equals") return h === v;
      if (rule.op === "suffixDomain") return h === v || h.endsWith("." + v);
      return false;
    });
  }

  function joinSelectors(selectors) {
    return selectors.filter(Boolean).join(",");
  }

  function applyLayerSurface(ctx, layer, MARK_BG, MARK_TEXT, MARK_BORDER) {
    const { queryAllDeep, palette, markApplied } = ctx;
    const sel = joinSelectors(layer.selectors);
    const skip = layer.skipOverlayLike ? shouldSkipOverlayLike : () => false;
    queryAllDeep(sel).forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (skip(el)) return;
      el.style.setProperty("background-color", palette.surface, "important");
      el.style.setProperty("border-color", palette.border, "important");
      el.style.setProperty("color", palette.foreground, "important");
      markApplied(el, MARK_BG);
      markApplied(el, MARK_BORDER);
      markApplied(el, MARK_TEXT);
    });
  }

  function applyLayerAccent(ctx, layer, MARK_BG, MARK_TEXT, MARK_BORDER) {
    const { queryAllDeep, palette, markApplied } = ctx;
    const sel = joinSelectors(layer.selectors);
    queryAllDeep(sel).forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      el.style.setProperty("background-color", palette.primary700, "important");
      el.style.setProperty("border-color", palette.primary700, "important");
      el.style.setProperty("color", palette.background, "important");
      markApplied(el, MARK_BG);
      markApplied(el, MARK_BORDER);
      markApplied(el, MARK_TEXT);
    });
  }

  function applyLayerCanvas(ctx, layer, MARK_BG) {
    const { queryAllDeep, palette, markApplied } = ctx;
    const sel = joinSelectors(layer.selectors);
    queryAllDeep(sel).forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      el.style.setProperty("background-image", "none", "important");
      el.style.setProperty("background-color", palette.background, "important");
      markApplied(el, MARK_BG);
    });
  }

  function applyLayerRichText(ctx, layer, MARK_TEXT) {
    const { queryAllDeep, palette, markApplied } = ctx;
    const sel = joinSelectors(layer.selectors);
    const vars = layer.cssVars && typeof layer.cssVars === "object" ? layer.cssVars : {};
    queryAllDeep(sel).forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      Object.entries(vars).forEach(([prop, pkey]) => {
        el.style.setProperty(prop, pickPalette(palette, String(pkey)), "important");
      });
      if (layer.color) {
        el.style.setProperty("color", pickPalette(palette, layer.color), "important");
      }
      markApplied(el, MARK_TEXT);
    });
  }

  function applyLayerSvgRecolor(ctx, layer) {
    const { queryAllDeep } = ctx;
    const sel = joinSelectors(layer.selectors);
    queryAllDeep(sel).forEach((shape) => {
      shape.style.setProperty("fill", "currentColor", "important");
      shape.style.setProperty("stroke", "currentColor", "important");
    });
  }

  window.__GTS_ADAPTER_FORMULA__ = {
    SCHEMA,

    /**
     * @param {object} engineApi window.__GTS_ENGINE__
     * @param {object} formula 已解析的 JSON
     * @returns {boolean}
     */
    install(engineApi, formula) {
      if (!engineApi || !formula || formula.schema !== SCHEMA) return false;
      const rules = formula.match?.hostname;
      if (!Array.isArray(rules) || rules.length === 0) return false;
      const layers = formula.layers;
      if (!Array.isArray(layers) || layers.length === 0) return false;

      const MARK_BG = engineApi.MARK_BG;
      const MARK_TEXT = engineApi.MARK_TEXT;
      const MARK_BORDER = engineApi.MARK_BORDER;

      const adapter = {
        id: String(formula.id || "adapter"),
        priority: typeof formula.priority === "number" ? formula.priority : 100,
        match: (hostname) => hostnameMatches(hostname, rules),
        apply: (ctx) => {
          for (const layer of layers) {
            const kind = layer?.kind;
            if (!kind) continue;
            try {
              if (kind === "surface") applyLayerSurface(ctx, layer, MARK_BG, MARK_TEXT, MARK_BORDER);
              else if (kind === "accent") applyLayerAccent(ctx, layer, MARK_BG, MARK_TEXT, MARK_BORDER);
              else if (kind === "canvas") applyLayerCanvas(ctx, layer, MARK_BG);
              else if (kind === "richText") applyLayerRichText(ctx, layer, MARK_TEXT);
              else if (kind === "svgRecolor") applyLayerSvgRecolor(ctx, layer);
            } catch {
              /* 单层失败不影响其它层 */
            }
          }
        },
      };

      engineApi.enqueueAdapter(adapter);
      return true;
    },
  };
})();
