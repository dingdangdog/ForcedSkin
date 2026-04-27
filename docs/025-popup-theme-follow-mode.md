# 025 插件弹窗主题跟随模式

时间：2026-04-27

## 目标

让插件弹窗 UI 跟随当前选中的主题模式（亮色 / 暗色 / 不修改），保持插件自身视觉与全局主题状态一致。

## 变更内容

1. 更新 `src/popup/popup.css`
   - 由硬编码颜色改为 CSS 变量驱动
   - 新增 `body[data-theme="light|dark|off"]` 三套主题变量
   - 统一背景、文字、边框、按钮、危险按钮、提示文本配色
2. 更新 `src/popup/popup.js`
   - 新增 `setPopupTheme(mode)`，将模式写入 `body[data-theme]`
   - 在 `updateStatus(mode)` 中同步更新弹窗主题

## 结果

弹窗打开后会按当前插件模式自动切换自身配色，不再固定单一浅色样式。
