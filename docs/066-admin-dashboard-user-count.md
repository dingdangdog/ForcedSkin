# 066 管理控制台展示注册用户数

**日期：** 2026-05-01

## 变更说明

1. 新增 `home/server/api/admin/stats.get.ts`：`prisma.user.count()`，返回 `{ userCount }`。路由前缀 `/api/admin`，沿用现有服务端中间件的管理员校验。
2. `home/app/pages/admin/index.vue`：概况网格增加 **注册用户** 卡片，并在 `onMounted` 中并行请求 `api/admin/stats`；网格布局改为 `grid-cols-2 sm:grid-cols-3 xl:grid-cols-5`，以容纳五个指标。

## 涉及文件

- `home/server/api/admin/stats.get.ts`（新）
- `home/app/pages/admin/index.vue`
