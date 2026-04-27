# 011 B站评论多层 ShadowRoot 命中修复

时间：2026-04-27

## 问题

视频详情评论区暗色文字修复没有生效。

## 根因

评论组件节点（包括 `bili-rich-text`）位于多层 `shadowRoot` 内，`document.querySelectorAll(...)` 只能查到 light DOM，无法命中大部分真实节点。

## 修复

1. 新增深度查询能力
   - `getAllRoots()`：遍历文档与所有开放 `shadowRoot`
   - `queryAllDeep(selector)`：在全部 root 中查询
2. 评论区修复逻辑切换为深度查询
   - `bili-rich-text` 变量注入改为 `queryAllDeep("bili-rich-text")`
   - 评论正文容器改为 `queryAllDeep("#contents,...,#comment")`

## 结果预期

评论文本与链接颜色修复可穿透多层 Shadow DOM，在暗色模式下稳定可见。
