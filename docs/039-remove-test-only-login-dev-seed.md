# 039 — 移除测试环境专用登录与种子数据

**日期：** 2026-04-30

## 变更说明

按产品要求去掉仅在本地/测试流程中使用的登录能力与数据，保留正式 OAuth 登录页（`/auth/login`）。

## 具体改动

1. **`home/app/pages/auth/login.vue`**  
   删除「测试账号一键登录」脚本与底部黄色虚线区块；移除未使用的 `useAuth().data` 解构。

2. **`home/server/api/dev/test-login.post.ts`**  
   删除开发专用签发 session 的接口（整文件移除）。

3. **`home/server/plugins/init-data.ts`**  
   不再向数据库写入固定 ID 的 `test-user-001` / `test-admin-001` 测试用户。

4. **`home/app/pages/login.vue`**  
   删除仅作 `/login` → `/auth/login` 重定向的页面；站点统一使用 NuxtAuth 标准路径。

5. **`home/app/utils/api.ts`**  
   `400` 跳转目标由 `/login` 改为 `/auth/login`。

6. **`home/public/sitemap.xml`**  
   登录页 URL 由 `https://forcedskin.com/login` 改为 `https://forcedskin.com/auth/login`。

7. **`home/i18n/locales/en.json`、`zh.json`**  
   删除 `auth.dev_title`、`auth.dev_user`、`auth.dev_admin` 文案键。

## 说明

- 生产与正式环境中用户仍通过 GitHub / Google OAuth 在 `/auth/login` 登录。  
- 若历史书签指向 `/login`，部署后该路径将 **404**，需改用 `/auth/login`。  
- 已存在于数据库中的测试用户记录不会由本变更自动删除，需运维按需清理。
