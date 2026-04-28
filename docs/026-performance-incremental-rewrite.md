# 026 主题引擎卡顿优化（增量重写）

时间：2026-04-27

## 问题

页面出现明显卡顿，根因是主题引擎在 DOM 变化时频繁执行全量重写，且样式写入会反向触发观察器，导致高频循环。

## 优化点

1. `src/content/engine.js`
   - `parseCssColor` 增加颜色解析缓存 `COLOR_CACHE`，减少重复解析开销。
   - 新增 `collectThemeCandidatesFromNode` 与 `applyGlobalRewriteToElements`，支持按节点子树增量处理。
   - `applyGlobalRewrite` 改为：
     - 首次/切换模式：全量处理
     - DOM 动态变化：仅处理新增节点相关子树
   - `MutationObserver` 监听由 `attributes + childList` 改为仅 `childList`，避免样式写入导致自触发循环。
   - 新增 `isApplying` 保护，避免引擎自身写样式时重复调度。
   - 新增 `refreshAdaptersDebounced`，将站点适配器重跑改为延迟合并触发。

## 结果

在保持现有主题效果的前提下，显著降低动态页面（特别是 B 站）中的重排/重绘与样式计算压力，缓解滚动、切页、加载时卡顿。
