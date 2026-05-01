# 054 — 主题/适配器创作指南全文 i18n + 快速开始序号排版

时间：2026-05-01

## 目标

1. `guide/theme.vue`、`guide/adapter.vue` 去除硬编码中文，按当前语言读取 `guide_theme`、`guide_adapter` 文案。
2. 修正「快速开始」及适配器「工作原理」中 **序号与标题分两大行**：改为 **单行 flex**，序号 `shrink-0`，标题可 `truncate`，避免在无必要处断行。
3. 修复 `vue-i18n`/unplugin 对 JSON 字面量 `{}`、占位符 `{}` 的解析冲突：字段 **示例 JSON** 从 locale 迁至 `guide/theme.vue` 内常量 `fieldExamples`；文案中避免出现未转义的 `{shade}`。

## 主要变更

- `home/i18n/locales/en.json`、`zh.json`：新增大块 `guide_theme`、`guide_adapter`；顺带修复此前外链块误插入导致的 **缺少 `seo` 包裹**（`keywords` 等须位于 `seo` 根下）。
- `home/app/pages/guide/theme.vue`：`useI18n` + `t()`；卡片标题行 `flex flex-nowrap items-baseline`。
- `home/app/pages/guide/adapter.vue`：同上；工作原理列表 `flex flex-nowrap` + 序号 `shrink-0`。
