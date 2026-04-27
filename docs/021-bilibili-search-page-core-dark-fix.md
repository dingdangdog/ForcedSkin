# 021 B站搜索页核心区域暗色修复

时间：2026-04-27

## 问题

搜索页（`bilibili-search`）主背景与结果区未完整应用插件暗色主题，出现大面积原站浅色区域。

## 修复

在 bilibili 适配器中新增搜索页专项：

1. 核心容器层
   - `.search-layout`
   - `.search-header`
   - `.search-input*`
   - `.search-content` / `.search-main` / `.search-result`
   - 结果列表、筛选区、分页区、`#i_cecream`
2. 次级交互层
   - 输入框、筛选项、结果项、分页按钮与激活项
3. 图标层
   - 搜索页相关 `svg path` 统一为 `currentColor`

## 结果预期

暗色模式下搜索页主背景、结果列表与交互组件整体跟随主题，不再出现“主区域仍是浅色”的问题。
