# 018 B站动态页 Tabs 暗色对比修复

时间：2026-04-27

## 问题

动态页分类 Tabs（`bili-dyn-list-tabs__list`）在暗色模式下仅应用了背景/边框，未完整处理文字与激活态样式，导致观感不正确。

## 修复

在 bilibili 适配器中新增 Tabs 专项：

1. 列表容器
   - `.bili-dyn-list-tabs__list` 使用 `surface` 背景与统一边框
2. 普通项
   - `.bili-dyn-list-tabs__item` 使用 `surfaceMuted` 背景、前景文字色
3. 激活项
   - `.bili-dyn-list-tabs__item.active` 使用 `primary700` 背景与边框
   - 激活文字改为 `background`（高对比）
4. 高亮条
   - `.bili-dyn-list-tabs__highlight` 使用 `primary500`

## 结果预期

暗色模式下动态页 Tabs 普通态与激活态层级清晰、文字可读性稳定。
