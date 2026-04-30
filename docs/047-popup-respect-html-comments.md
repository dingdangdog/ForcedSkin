# 047 弹窗：保留注释掉的 DOM，仅改 JS 对齐

## 日期

2026-04-30

## 说明

`pickedPaletteLabel`、`lightThemeSlug`、`darkThemeSlug` 在 `popup.html` 中保持 **HTML 注释**（不渲染）。对应逻辑在 `popup.js` 中 **不再引用** slug 节点，仅更新 `#lightThemeName` / `#darkThemeName`。

扩展版本 **0.2.5**。
