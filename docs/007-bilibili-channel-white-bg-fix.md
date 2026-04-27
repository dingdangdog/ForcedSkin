# 007 B站频道白底问题修复

时间：2026-04-27

## 问题现象

暗色模式下，B站顶部频道区域与下滑后固定频道区域仍出现白色 tag 背景。

## 根因

1. 之前主要处理了容器背景与文字/边框
2. 部分子节点（如 `.channel-link`、`.header-channel-fixed-right-item`）仍保留站点原生白底
3. 固定频道条 `header-channel-fixed` 的分层容器未全量覆盖

## 修复内容

更新 `src/content/content.js` 的 bilibili 适配器 `afterApply`：

1. 频道区 tag 子项统一背景/边框/文字
   - `.channel-items__left .channel-link`
   - `.channel-items__right .channel-link__right`
   - `.channel-icons__item`
   - `.channel-entry-more__link`
2. 固定频道条整体容器统一暗色背景
   - `.header-channel-fixed` 及左右中子容器
3. 固定频道条的具体 tag 项统一背景
   - `.header-channel-fixed-right-item`
   - `.left-fixed-channel`
   - `.header-channel-fixed a`

## 结果预期

暗色模式下，上述两处频道区域不再出现白底卡片，背景与文字风格统一跟随主题。
