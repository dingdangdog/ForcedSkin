# 006 — 扩展构建器引导文案优化

**日期：** 2026-06-06

## 变更

- `panelBuilderLead`：改为简述构建器用途（反馈特定网站适配问题）并引出步骤说明
- 新增 `builderStep3`：提示选取完成后需手动重新打开扩展弹窗（页面点击会导致弹窗关闭）
- 原步骤 3（描述并提交）顺延为 `builderStep4`
- `popup.html` 增加第 4 步展示

## 涉及文件

- `extension/src/popup/popup.html`
- `extension/_locales/*/messages.json`（6 种语言）
