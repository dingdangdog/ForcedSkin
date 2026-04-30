# 048 弹窗跟随服务端主题配色

时间：2026-04-30

## 背景

官网目录同步后的 `gtsPalette` 已通过 `SETTINGS_UPDATE` 交给内容脚本，网页配色与所选主题一致；弹窗此前仅用 `body[data-theme]` 三套固定变量，未读取 `gtsPalette`，故视觉上「网页变了、插件没变」。

## 变更

1. **`extension/src/background.js`**：`GET_SETTINGS` 响应增加字段 `palette`（来自 `chrome.storage.local` 的 `gtsPalette`），与注入网页的数据同源。
2. **`extension/src/popup/popup.js`**：
   - 将服务端 ThemeColors 规范化为弹窗 `--popup-*` 变量（规则与 `content/engine.js` 中 `normalizeRemoteColors` 对齐）。
   - 当前模式为 `light` / `dark` 且有对应 `palette.light` / `palette.dark` 时，写入 `document.body` 的内联样式覆盖变量；`off` 或无配色时清除覆盖，沿用 CSS 里「关闭」主题的默认值。
   - `updateStatus` 在设置 `data-theme` 后调用上述逻辑。

## 结果

选中服务端主题后，弹窗 UI 使用同一套背景、前景、表面与主色变量，与网页主题观感一致（危险色等仍沿用各模式下的静态变量）。
