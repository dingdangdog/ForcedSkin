# 062：弹窗主题页按模式自动展开/收起子列表

## 变更

- `extension/src/popup/popup.js`：抽取 `syncAccordionExpansionToMode(mode)`，与 `loadCurrentMode` 中已有的「仅 light / dark / off 对应展开」逻辑一致。
- 修复 `onModeChange`：此前只把当前模式设为展开，不会收起另一列表，导致例如从暗色切到亮色时两侧仍同时展开。
- 选择 **off（禁用）** 时：`lightExpanded` 与 `darkExpanded` 均为 `false`，两侧子面板收起。
