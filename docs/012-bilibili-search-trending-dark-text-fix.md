# 012 B站搜索趋势弹层暗色文字修复

时间：2026-04-27

## 问题

暗色模式下，B站搜索框弹出的“热搜趋势”区域背景已变暗，但文字仍偏黑，导致可读性极差。

## 修复

在 bilibili 适配器中新增搜索趋势弹层专项处理：

1. 容器层（背景/边框/文字）
   - `.trending`
   - `.trendings-double`
   - `.trendings-col`
   - `.trending-item`
   - `.trending .header`
2. 标题与条目文字
   - `.trending .title`
   - `.trending-text`
3. 排名颜色分层
   - `.trendings-rank` 使用主题主色
   - `.trendings-rank.search-rank-top` 使用更强调主色

## 结果预期

暗色模式下，搜索趋势弹层文字与排名可读，避免“暗底黑字”问题。
