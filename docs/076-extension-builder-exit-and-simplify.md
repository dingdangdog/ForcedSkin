# 076 — 构建器交互简化与退出语义修正

**日期**：2026-05-11  
**涉及子项目**：`extension`

---

## 调整目标

按用户反馈优化适配需求构建器：

1. `Esc` 只退出“点选模式”，不清空已选数据；
2. 去掉普通用户无关的 `Test on Page`；
3. 移除“保存草稿”，避免与“提交请求”语义冲突；
4. 增加真正“退出本次编辑”按钮（清空选区与描述，并停止点选）。

---

## 变更内容

### `extension/src/popup/popup.html`

- 移除 `testFormulaBtn` 按钮；
- 移除 `saveDraftBtn` 按钮；
- 新增 `exitBuilderBtnEmpty`、`exitBuilderBtnActive`（退出本次编辑）。

### `extension/src/popup/popup.js`

- 移除测试公式/复制公式/草稿相关逻辑；
- 新增 `onExitBuilderEditClick()`，调用 `builderReset()` 执行完整退出；
- 仍保留 `Esc` 与“退出选取模式”只停止 picking，不清理 `builderState.elements`。

### i18n

- 新增：
  - `exitBuilderEdit`
  - `builderEditExited`

---

## 关于 popup 自动关闭

扩展 popup 在点击页面后由浏览器自动收起，属于浏览器层行为；无法稳定“保持打开”，也无法可靠“自动再次弹出”。当前通过后台队列恢复选区保证流程可继续。

