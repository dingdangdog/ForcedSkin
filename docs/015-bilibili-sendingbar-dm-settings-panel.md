# 015 B站发送栏与弹幕设置面板暗色修复

时间：2026-04-27

## 问题

播放器内发送栏与弹幕设置面板存在大量独立子组件（switch/checkbox/radio/select/progress/button/icon），之前只覆盖了局部容器，导致颜色不统一。

## 修复

在 bilibili 适配器中增加“发送栏 + 设置面板”专项覆盖：

1. 容器层统一暗色
   - `bpx-player-sending-bar`、`bpx-player-video-info*`、`bpx-player-dm-root`
   - `bpx-player-dm-setting*`、`bui-panel*`
   - `bpx-player-video-inputbar*`、`bpx-player-dm-input`
2. 子组件统一暗色
   - checkbox/radio/select/progress 的 label、value、item、bar、dot
   - 设置项标题/高级设置按钮/恢复默认按钮
3. 图标统一
   - 覆盖发送栏与设置面板内 `svg path` 使用 `currentColor`

## 结果预期

该区域从“局部暗色”变为完整暗色：容器、文字、控件、图标风格一致。
