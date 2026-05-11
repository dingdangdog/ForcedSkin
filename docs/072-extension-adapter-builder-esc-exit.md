# 072 — 适配器选取模式：Esc 与显式退出

**日期**：2026-05-11  
**涉及子项目**：`extension`

---

## 原设计

`adapter-builder.js` 在 `BUILDER_START_PICKING` 时进入选取模式：监听 `mouseover` / `click` 高亮并上报元素；**已在 `document` 上监听 `keydown`，`Escape` 时调用 `exitPickerMode()`** 并发送 `BUILDER_CANCEL_PICK`。

部分页面下该行为不可靠：焦点在 **iframe** 内、或站点在捕获阶段拦截按键时，顶层 `document` 可能收不到 Esc；popup 侧原先对 `BUILDER_CANCEL_PICK` 为空实现，用户也看不到「已退出」反馈。

---

## 变更说明

1. **`adapter-builder.js`**：将 `keydown` 改为在 **`window` 捕获阶段**监听；对 Esc 增加 `key` / `code` / `keyCode` 兼容，并 **`preventDefault` + `stopPropagation`（及 `stopImmediatePropagation`）**，减少被页面快捷键吞掉的情况。
2. **`popup.html` / `popup.js`**：选取开始后显示文案提示（Esc / 按钮）；增加 **「退出选取模式」** 按钮（空状态与已选元素工具栏各一处），向页面发送 `BUILDER_STOP_PICKING`；维护 **`builderState.picking`** 与 UI 同步。
3. **切换离开「适配器构建器」标签**时，若仍在选取中，自动发送停止消息，避免页面一直处于十字准星状态。
4. **`builderReset`**（含提交成功后）会结束选取模式。
5. **i18n**：`builderEscHint`、`stopPicking`、`builderPickCancelled`（中/英）。

---

## 已知限制

焦点在 **跨域 iframe** 内时，主框架的内容脚本通常仍收不到键盘事件；此时请用 popup 内 **「退出选取模式」** 或切换 popup 标签触发自动停止。
