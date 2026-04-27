# 010 B站评论区 Shadow DOM 文字修复

时间：2026-04-27

## 问题

B站视频详情评论区在暗色模式下出现“文字先看不见”的情况，典型节点为 `bili-rich-text`。

## 根因

`bili-rich-text` 使用 Shadow DOM，内部文字颜色由组件变量控制，外层普通文字改色规则无法稳定覆盖。

## 修复

在 `bilibili` 适配器中新增专项处理：

1. 对 `bili-rich-text` 主机节点注入变量
   - `--bili-rich-text-color`
   - `--bili-rich-text-link-color`
   - `--bili-rich-text-link-color-hover`
2. 评论区外层容器文本兜底
   - `.reply-content`
   - `.sub-reply-content`
   - `.reply-info`
   - `.reply-item`
   - `.comment-container`

## 结果预期

暗色模式下评论正文与链接文字可读，避免“先不可见再恢复”。
