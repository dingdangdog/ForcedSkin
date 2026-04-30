# 046 修复弹窗 null：slug 节点被注释导致 textContent 报错

## 日期

2026-04-30

## 原因

`popup.html` 中 `lightThemeSlug` / `darkThemeSlug`（及「当前配色」标签）曾被注释掉，但 `popup.js` 仍在 `applyPickedLabelsFromResponse` 里写入 `lightThemeSlug.textContent`，DOM 为 `null` 时抛出 **Cannot set properties of null**。

## 修复

- 恢复亮/暗两行内 `#lightThemeSlug`、`#darkThemeSlug` 与 `pickedPaletteLabel` 节点。
- `applyPickedLabelsFromResponse`、`syncModeSubpanels`、展开按钮监听增加空值防护。

扩展版本 **0.2.4**。
