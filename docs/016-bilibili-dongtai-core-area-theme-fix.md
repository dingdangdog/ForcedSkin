# 016 B站动态页核心区域主题修复

时间：2026-04-27

## 问题

B站动态页部分核心区域（如个人信息卡）未正确切换到插件主题背景色，出现“页面整体偏暗，但局部卡片仍是站点默认色”的不一致。

## 修复

在 bilibili 适配器中新增动态页专项覆盖：

1. 核心容器层
   - `.bili-dyn-my-info`、`.bili-dyn-my-info__content`、`.bili-dyn-my-info__stats`
   - `.bili-dyn-list`、`.bili-dyn-item`、`.bili-dyn-item__main`
   - `.bili-dyn-live-users`、`.bili-dyn-up-list`、`.bili-topic-selector`、`.bili-dyn-publishing`
2. 关键文本层
   - 个人信息名称/统计数字/标签
   - 动态卡标题、描述、摘要、侧栏用户名与标题
3. 次级组件层
   - 统计项、头像外圈、Tab、操作区、popover 及箭头
   - 使用 `surfaceMuted` 与边框色统一层次

## 结果预期

动态页核心卡片（包括你提到的个人信息区域）在暗色模式下与插件主题配色一致，减少局部“未暗化”区域。
