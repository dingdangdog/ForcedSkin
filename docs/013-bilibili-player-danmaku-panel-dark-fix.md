# 013 B站播放器弹幕面板暗色修复

时间：2026-04-27

## 问题

播放器内折叠下拉区域（`bui/bpx` 组件）暗色模式下未完整跟随主题，只命中部分文字/边框。

## 修复

在 bilibili 适配器新增播放器弹幕面板专项：

1. 容器与下拉项统一暗色
   - `.bui-collapse-header`
   - `.bui-collapse-arrow`
   - `.bpx-player-filter`
   - `.bui-dropdown-wrap`
   - `.bui-dropdown-display`
   - `.bui-dropdown-items`
   - `.bui-dropdown-item`
2. 交互状态补充
   - `.bui-dropdown-item:hover`
   - `.bui-dropdown-item.bui-hide`
3. 箭头/菜单图标统一
   - `.bui-collapse-arrow svg path`
   - `.bui-dropdown-icon svg path`
   - 强制 `fill: currentColor`

## 结果预期

该区域背景、文字、图标、交互态均按暗色主题显示，不再出现“局部未暗化”。
