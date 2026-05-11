# 078 — 点选时附带页面 hostname

**日期**：2026-05-11  
**涉及子项目**：`extension`

---

## 背景

用户强调「点选」阶段就应能确定站点，而不应依赖后续 popup 再读当前标签 URL。

---

## 实现

1. **`extension/src/content/adapter-builder.js`**  
   在 `BUILDER_ELEMENT_SELECTED` 消息中增加 `pageHost`（`window.location.hostname` 小写）。

2. **`extension/src/background.js`**  
   `normalizeBuilderSelectionPayload` 保留 `pageHost` 入队。

3. **`extension/src/popup/popup.js`**  
   - `pushBuilderSelection` 保存 `pageHost`；  
   - `builderSubmit`：先 `getCurrentTabHostname()`，若为空则用已选元素中的 `pageHost` 作为 `siteDomain`；  
   - 提交给后端的 `selectedElements` 项可带 `pageHost`（服务端若未识别该字段会忽略）。

---

## 说明

点选本身**仍不要求用户输入域名**；`pageHost` 由页面自动写入，用于与「当前标签」互补，减少误报。
