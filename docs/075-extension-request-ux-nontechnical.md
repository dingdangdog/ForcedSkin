# 075 — 适配需求提交流：面向普通用户去技术化

**日期**：2026-05-11  
**涉及子项目**：`extension`

---

## 调整背景

用户反馈当前构建器仍暴露 `surface/accent` 等技术概念，不符合“普通用户只提问题、管理员实现适配器”的目标。

---

## 本次调整

### 1) 移除用户侧 layer 类型操作

**文件**：`extension/src/popup/popup.js`

- 选中元素列表中移除 layer 类型下拉，不再要求用户理解技术层概念。
- 提交 payload 的 `selectedElements` 去掉 `layerKind`，仅保留选区信息（selector / tagName / textHint / classHint）。

### 2) 文案全面改为“描述问题”

**文件**：`extension/_locales/zh_CN/messages.json`、`extension/_locales/en/messages.json`

- 构建器引导改为：
  - 选取“有问题”的区域
  - 用自然语言描述现象与期望
  - 由管理员实现
- 反馈输入框改名为“问题描述”，示例改为可读性/对比度/hover 状态等非技术表达。
- 恢复选区提示文案也改为“继续补充问题描述”。

