# 022 B站视频页模块前缀化适配

时间：2026-04-27

## 问题

视频详情页存在大量 CSS Modules 哈希类 UI（如 `eplist_*`、`numberListItem_*`），此前逐点处理效率低、漏配多。

## 改造思路

从“单点特殊处理”升级为“同类前缀规则化适配”：

- 通过类名前缀选择器命中同一模块族
- 一次性覆盖该模块族的背景/边框/文字/图标
- 对选中态（`numberListItem_select`）单独设定高对比主题色

## 具体覆盖

1. 模块族容器
   - `eplist_*`
   - `numberList_*`
   - `numberListItem_*`
   - `modeChangeBtn_*`
2. 关键文字与条目
   - 分集条目、标题、统计进度等
3. 选中态强化
   - `numberListItem_select*`
4. 模块内 SVG 图标
   - 统一 `fill/stroke: currentColor`

## 结果预期

同类哈希模块可整体生效，减少“同一页面不同小块反复漏配”的问题。
