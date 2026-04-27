# 017 B站页头图标偶发消失修复

时间：2026-04-27

## 问题

暗色模式下，B站页头右侧菜单图标偶发“看不见”，常见于动态更新/悬浮态/折叠态切换后。

## 根因

页头图标大量依赖 `currentColor`（`fill`/`stroke`），在某些动态状态下会继承到不正确颜色，导致图标与背景对比不足。

## 修复

在 bilibili 适配器新增页头图标可见性兜底：

1. 页头入口文字和图标容器统一前景色
   - `.right-entry*`、`.right-entry-icon`、`.header-upload-entry*`、`.v-popover-wrap`
2. 页头 SVG 图标统一当前色
   - `.right-entry-icon path/g`
   - `.header-upload-entry__icon path/g`
   - `.bpx-common-svg-icon path`
   - 强制 `fill/stroke: currentColor`

## 结果预期

暗色模式下页头菜单图标在动态状态切换时保持可见，不再偶发“消失”。
