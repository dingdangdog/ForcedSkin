(() => {
  const engineApi = window.__GTS_ENGINE__;
  if (!engineApi) return;

  function setStyles(el, palette, markApplied, styleMap, marks) {
    if (!el) return;
    Object.entries(styleMap).forEach(([key, value]) => {
      el.style.setProperty(key, value, "important");
    });
    marks.forEach((mark) => markApplied(el, mark));
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

  const bilibiliAdapter = {
    id: "bilibili",
    priority: 100,
    match: (hostname) => hostname === "bilibili.com" || hostname.endsWith(".bilibili.com"),
    apply: ({ queryAllDeep, palette, markApplied }) => {
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
        "[class*='_Conversation_']"
      ].join(",");

      queryAllDeep(bgSelectors).forEach((el) => {
        if (shouldSkipOverlayLike(el)) return;
        setStyles(
          el,
          palette,
          markApplied,
          {
            "background-color": palette.surface,
            "border-color": palette.border,
            "color": palette.foreground
          },
          [engineApi.MARK_BG, engineApi.MARK_BORDER, engineApi.MARK_TEXT]
        );
      });

      queryAllDeep(
        [
          "[class*='active']",
          "[class*='select']",
          "[class*='current']",
          ".bili-dyn-list-tabs__item.active",
          "[class*='numberListItem_select']"
        ].join(",")
      ).forEach((el) => {
        setStyles(
          el,
          palette,
          markApplied,
          {
            "background-color": palette.primary700,
            "border-color": palette.primary700,
            "color": palette.background
          },
          [engineApi.MARK_BG, engineApi.MARK_BORDER, engineApi.MARK_TEXT]
        );
      });

      queryAllDeep(".message-bg,.message-bgc").forEach((el) => {
        setStyles(
          el,
          palette,
          markApplied,
          {
            "background-image": "none",
            "background-color": palette.background
          },
          [engineApi.MARK_BG]
        );
      });

      queryAllDeep("bili-rich-text").forEach((el) => {
        el.style.setProperty("--bili-rich-text-color", palette.foreground, "important");
        el.style.setProperty("--bili-rich-text-link-color", palette.primary500, "important");
        el.style.setProperty("--bili-rich-text-link-color-hover", palette.primary700, "important");
        el.style.setProperty("color", palette.foreground, "important");
        markApplied(el, engineApi.MARK_TEXT);
      });

      queryAllDeep("svg path, svg rect, svg circle, svg polygon, svg line").forEach((shape) => {
        shape.style.setProperty("fill", "currentColor", "important");
        shape.style.setProperty("stroke", "currentColor", "important");
      });
    }
  };

  window.__GTS_BILIBILI_ADAPTER__ = bilibiliAdapter;
})();
