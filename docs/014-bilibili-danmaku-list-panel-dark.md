# 014 B站展开弹幕列表暗色修复

时间：2026-04-27

## 问题

折叠弹幕入口已处理，但展开后的「弹幕列表」长列表区域（`bpx-player-wraplist`、`bpx-player-dm-*`、`bui-long-list` 等）仍呈现站点浅色底或表头/加载态不协调；表头内 SVG 使用 `fill="#999"`，与暗色背景对比差。

## 修复

1. `cssForRoot` 增加先手样式：用 `--gts-surface` / `--gts-fg` 等变量铺底列表容器、表头、加载行，并将 `.bpx-player-dm-btn-icon svg path` 设为 `currentColor`。
2. `bilibili` 适配器 `afterApply` 中 `queryAllDeep` 覆盖上述选择器，并单独处理：
   - `.dm-info-time` → 次要色 `muted`
   - `.dm-info-dm` → 前景色
   - 表头按钮区 `.bpx-player-dm-btn-*`、`.bpx-player-dm-load-status` 等使用 `surfaceMuted` 背景

## 结果预期

暗色模式下展开弹幕列表时，列表区、表头、加载提示与行内文字与主题一致，不再出现大块浅色底或灰字不清。
