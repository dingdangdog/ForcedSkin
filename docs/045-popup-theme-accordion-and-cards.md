# 045 弹窗：去掉 Status 文案、明暗手风琴、主题卡片可辨识性

## 日期

2026-04-30

## 问题与对策

1. **「Status: {mode}」** 来自 `currentStatus` i18n，即英文浏览器下的「Status: Light Theme」一类文案，语义含糊。已移除该行日常展示，改为底部 **`themeFooterHint`** 说明扩展在做什么；`statusText` 仅保留为隐藏占位，供后续如需短时提示再用。
2. **亮/暗子区域**：亮色、暗色各行右侧增加 **展开/收起**（chevron），子面板内为网格主题列表；切换到对应模式时会 **自动展开** 该行；用户也可独立折叠。
3. **主题选项辨识**：每个选项改为 **卡片** — 顶部 **背景色→主色渐变条**，主体 **大标题 = displayName**，第二行 **「标识 / ID」+ 唯一 `name` slug**；`title` 悬浮提示同步包含名称与标识。

## 文件

- `extension/src/popup/popup.html` — `mode-block` 手风琴结构、`theme-grid` / `theme-card`
- `extension/src/popup/popup.css` — 样式重写
- `extension/src/popup/popup.js` — `lightExpanded` / `darkExpanded`、`fillThemeChips`（实为卡片）、`applyPickedLabelsFromResponse`
- `_locales/zh_CN|en/messages.json` — `themeFooterHint`、`expandPick*`、`pickedPaletteLabel`、`themeInternalId` 等

扩展版本 **0.2.3**。
