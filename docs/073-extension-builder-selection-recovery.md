# 073 — 适配器选取结果恢复（popup 关闭场景）

**日期**：2026-05-11  
**涉及子项目**：`extension`

---

## 问题背景

适配器构建器在页面中点选元素时，浏览器 popup 通常会自动收起。原流程中，选中结果主要依赖 popup 进程内 `onMessage` 更新列表；当 popup 已关闭时，用户再次打开会感觉“点了没反应”。

---

## 本次修复

### 1) 后台增加选取队列兜底

**文件**：`extension/src/background.js`

- 新增 `BUILDER_PENDING_SELECTIONS_KEY = "gtsBuilderPendingSelections"`。
- 收到 `BUILDER_ELEMENT_SELECTED` 时，标准化 payload 并写入 `chrome.storage.local` 队列（最多保留最近 200 条）。
- 新增 `GET_AND_CLEAR_BUILDER_SELECTIONS` 消息：读取并清空队列，供 popup 恢复显示。

### 2) popup 在进入构建器页时恢复选取结果

**文件**：`extension/src/popup/popup.js`

- 新增 `consumePendingBuilderSelections()`，调用后台 `GET_AND_CLEAR_BUILDER_SELECTIONS`。
- 将恢复结果合并到 `builderState.elements`（按 selector 去重）并触发 `renderBuilderActive()`。
- 新增提示：恢复了多少条刚选中的元素，提示用户继续设置 layer 类型。

### 3) i18n 文案

**文件**：`extension/_locales/zh_CN/messages.json`、`extension/_locales/en/messages.json`

- 新增 `builderPickedRecovered`：
  - zh: `已同步 {1} 个刚刚选中的元素，请继续配置层类型`
  - en: `Recovered {1} newly picked element(s). Continue assigning layer types.`

---

## 修复后的操作流（用户视角）

1. popup 里点「开始选取元素」；
2. 回到页面点击元素（popup 可能自动关闭，正常）；
3. 重新打开 popup 并切到构建器；
4. 刚才点击的元素会自动恢复到列表中，可继续改 layer、测试和提交。

