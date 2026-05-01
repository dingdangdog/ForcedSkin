# 067 后台用户管理列表页

**日期：** 2026-05-01

## 变更说明

1. **`GET api/admin/users`**（`home/server/api/admin/users.get.ts`）：分页返回用户列表，字段含 `id、name、email、avatar、roles、createdAt、lastLoginAt`（不含 OAuth id）。沿用 `/api/admin` 服务端管理员校验。
2. **`home/app/pages/admin/users.vue`**：用户管理页，表格展示上述字段，角色拆分为标签；分页每页 20 条，上一页/下一页。
3. **`home/app/layouts/admin.vue`**：侧栏增加「用户管理」入口（`UsersIcon`）；修正 **`isActive('/admin')`** 仅在路径恰为控制台时高亮，避免此前在其它后台页误高亮「控制台」。
4. **`home/app/pages/admin/index.vue`**：快捷操作增加「用户管理」链接。

## 涉及文件

- `home/server/api/admin/users.get.ts`（新）
- `home/app/pages/admin/users.vue`（新）
- `home/app/layouts/admin.vue`
- `home/app/pages/admin/index.vue`
