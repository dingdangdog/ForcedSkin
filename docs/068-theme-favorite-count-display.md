# 068 — 主题收藏人数展示

## 变更日期

2026-05-01

## 摘要

在官网首页热门主题、主题市场页与后台主题管理中展示每个主题的收藏人数；公开与管理端列表接口统一附带 `favoriteCount`；用户切换收藏后接口返回最新总人数以便前端即时更新。

## 涉及文件

- `home/server/utils/themeFavoriteCounts.ts`（新建）：按 `user_themes` 表 `groupBy themeId` 聚合人数。
- `home/server/api/themes.get.ts`、`home/server/api/admin/themes.get.ts`：列表项合并 `favoriteCount`。
- `home/server/api/entry/user/themes/favorite.post.ts`：响应增加 `favoriteCount`。
- `home/app/components/theme/ThemeCard.vue`：信息区展示收藏人数文案（i18n）。
- `home/app/pages/index.vue`：热门区块按收藏数优先排序后取前 2 亮/暗主题，并传入 `favorite-count`。
- `home/app/pages/themes.vue`：展示收藏数；收藏切换后用接口返回值更新对应主题。
- `home/app/pages/admin/themes.vue`：标签行展示「收藏 N」。
- `home/i18n/locales/zh.json`、`home/i18n/locales/en.json`：`card.favorites_count`。
