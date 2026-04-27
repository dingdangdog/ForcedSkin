# 024 透明蒙版误改回归修复

时间：2026-04-27

## 问题

引擎重构后，全域强制背景策略误伤透明蒙版/遮罩层，导致视频区域可视性异常。

## 根因

1. 引擎层对背景色改写阈值过宽，半透明层被误判为可改写容器
2. B站适配层覆盖范围过大，`bpx/bui` 类族中包含大量遮罩层类名

## 修复

1. 引擎层 `engine.js`
   - 增加蒙版类关键词跳过：
     - `mask/overlay/backdrop/shade/modal-backdrop/curtain`
   - `pointer-events: none` 节点直接跳过
   - 背景改写阈值从 `alpha > 0.7` 收紧为 `alpha >= 0.97`
2. B站适配层 `adapters/bilibili.js`
   - 新增 `shouldSkipOverlayLike()`，在批量覆盖前过滤遮罩/半透明层

## 结果预期

透明蒙版与视频相关遮罩恢复原行为，不再被强制铺底色；主题适配继续作用于内容容器。
