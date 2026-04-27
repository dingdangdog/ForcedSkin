# 020 B站消息页内部对话区修复

时间：2026-04-27

## 问题

消息页外层暗色已生效，但内部对话列表、消息气泡、输入区等仍是站点默认样式，导致视觉不一致。

## 根因

消息页主要内容使用 CSS Modules 哈希类（如 `_ChatContent_*`、`_MessageList_*`、`_Msg_*`），之前仅覆盖外层 `message-*` 类，未命中内部哈希组件。

## 修复

1. 新增内部哈希容器覆盖
   - `[class*='_ChatContent_']`
   - `[class*='_InfiniteScroll_']`
   - `[class*='_MessageList_']`
   - `[class*='_Msg_']`
   - `[class*='_Session_']`
   - `[class*='_Conversation_']`
2. 新增消息气泡/通知/输入区覆盖
   - `[class*='_Msg__Content_']`
   - `[class*='_MsgNotify_']` 及子元素
   - `[class*='_Input_']` / `[class*='_Editor_']` / `[class*='_Toolbar_']`
3. 去除消息页浅色背景图
   - `.message-bg` / `.message-bgc` 强制 `background-image: none`

## 结果预期

消息页内部对话列表、对话框与输入区随主题统一暗色，不再只停留在外层暗化。
