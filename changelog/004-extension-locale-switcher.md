# 004 — 扩展 Popup 语言切换与用户区精简

**日期：** 2026-06-06

## 变更摘要

扩展 Popup 支持手动切换语言（与官网语种对齐），顶部用户区改为仅显示头像，语言偏好持久化到 `chrome.storage.local`。

## 新增文件

- `extension/src/popup/popup-i18n.js` — 运行时加载 `_locales` 文案、格式化占位符、语言切换与持久化

## 修改文件

- `extension/src/popup/popup.html` — 增加语言下拉，移除顶栏用户名文字
- `extension/src/popup/popup.js` — 接入 `PopupI18n`，切换后刷新动态文案
- `extension/src/popup/popup.css` — 语言切换器与用户头像紧凑样式
- `extension/_locales/*/messages.json` — 新增 `language` 键（6 种语言）

## 修复

- `popup-i18n.js` 使用 IIFE 封装，避免内部 `applyI18n` 与 `popup.js` 全局变量冲突导致 Popup 空白

## 行为说明

- 首次打开：优先读取已保存的 `popupLocale`，否则按浏览器 UI 语言推断
- 切换语言：即时刷新 Popup 静态与动态文案，无需重开扩展
- 顶栏头像：`title` 悬停显示用户名，账号详情仍在「账号」标签页
