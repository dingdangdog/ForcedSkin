# 003 — 浏览器扩展多语言支持扩展

**日期：** 2026-06-06

## 变更摘要

为 Chrome 扩展新增日语、西班牙语、德语与英式英语本地化，与官网支持的语种对齐。

## 新增文件

- `extension/_locales/ja/messages.json` — 日语（112 键）
- `extension/_locales/es/messages.json` — 西班牙语（112 键）
- `extension/_locales/de/messages.json` — 德语（112 键）
- `extension/_locales/en_GB/messages.json` — 英式英语（112 键）

## 修改文件

- `extension/src/popup/popup.js` — `applyI18n()` 根据 `chrome.i18n.getUILanguage()` 动态设置 `<html lang>`

## 语种对照

| 官网 code | 扩展 `_locales` 目录 | 说明 |
|-----------|---------------------|------|
| `en` | `en` | 默认 |
| `en-GB` | `en_GB` | Chrome 使用下划线 |
| `zh` | `zh_CN` | Chrome 使用 `zh_CN` |
| `ja` | `ja` | 新增 |
| `es` | `es` | 新增 |
| `de` | `de` | 新增 |

## 使用说明

扩展语言由 **浏览器 UI 语言** 自动决定（Chrome 设置 → 语言）。无需在 `manifest.json` 中枚举各 locale，Chrome 会自动扫描 `_locales` 子目录。
