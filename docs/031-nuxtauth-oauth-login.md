# 031 — NuxtAuth OAuth 登录（GitHub / Google）

## 背景

用户已安装 `@sidebase/nuxt-auth@1.2.0` + `next-auth@4.21.1`，服务端 handler 已建立。
本次任务：**移除密码登录，仅开放 GitHub / Google OAuth；统一鉴权体系到 NuxtAuth session。**

---

## 变更列表

### 1. `home/prisma/schema.prisma` — User 模型重构
- 移除：`username`、`password`（不再支持密码登录）
- 新增：`githubId String? @unique`、`googleId String? @unique`、`avatar String?`
- 保留：`roles`、`lightTheme`、`darkTheme`

### 2. `home/nuxt.config.ts`
- `modules` 中添加 `@sidebase/nuxt-auth`
- 增加 `auth` 配置块（`provider.type: 'authjs'`，关闭全局中间件）
- `runtimeConfig` 补充：`github.clientId / clientSecrets`、`google.clientId / clientSecrets`、`dataPath`

### 3. `home/server/api/auth/[...].ts` — handler 重写
- **移除** `CredentialsProvider`（密码登录彻底关闭）
- **移除** 本地头像下载逻辑（改为直接存储 OAuth 头像 URL）
- 提取 `upsertOAuthUser()` 工具函数，统一处理 GitHub / Google 首次注册与重复登录
- 字段对齐新 schema：`id` 代替 `userId`，`name` 代替 `nickName`
- `jwt callback` 新增 `roles` 字段写入 token
- `session callback` 暴露 `user.id`、`user.roles`、`user.provider`

### 4. `home/server/utils/common.ts` — 新建
- `getUUID(len)`：安全随机字符串（crypto）
- `encryptBySHA256(userName, password)`：保留兼容性

### 5. `home/server/middleware/auth.ts` — 重写
- 改用 `getServerSession(event)` 替代旧 JWT Cookie 解析
- 把 `userId`、`userRoles` 注入 `event.context`
- `/api/admin/**` 路由额外校验 `admin` 角色

### 6. `home/server/utils/jwt.ts` — 重写
- `getUserId(event)` 直接读 `event.context.userId`（中间件注入）
- 原 `getAuthPayload` 保留，仅给 `/api/pub/extension-settings` 兼容旧扩展 Bearer Token

### 7. `home/server/api/pub/extension-settings.get.ts` — 更新
- 鉴权优先用 NuxtAuth session，fallback 旧 Bearer JWT
- 字段对齐新 User schema

### 8. `home/server/api/entry/user/info.ts` — 更新
- 字段对齐新 schema（`id`, `name`, `avatar`, `roles`, `lightTheme`, `darkTheme`）

### 9. `home/app/pages/auth/login.vue` — 新建（核心页面）
- 路由 `/auth/login`（NuxtAuth 默认 signIn 页）
- GitHub / Google 两个 OAuth 按钮，`signIn(provider, { callbackUrl })` 触发
- 解析 `?error=` 展示友好中文错误
- loading 状态（旋转动画）
- 已登录自动跳转
- 独立 layout（不含 header/footer）

### 10. `home/app/pages/login.vue` — 改为重定向
- 直接 `navigateTo('/auth/login')` 兼容旧链接

### 11. `home/app/middleware/auth.ts` — 重写
- 用 `useAuth().status` 判断是否已登录，未登录跳到 `/auth/login?callbackUrl=...`

### 12. `home/app/middleware/admin.ts` — 重写
- 用 `useAuth().data.user.roles` 判断 admin 角色

### 13. `home/app/layouts/default.vue` — 更新
- 用 `useAuth()` 替代旧 `useUserStore`
- 头部显示头像、用户名、退出按钮
- 退出调用 NuxtAuth `signOut({ callbackUrl: '/' })`

### 14. `home/app/pages/account.vue`、`themes.vue`、`adapters.vue` — 更新
- 用 `useAuth()` 替代 `useUserStore` 的登录状态判断

---

## 环境变量说明

```dotenv
AUTH_SECRET=random-secret-min-32-chars

# GitHub OAuth App（在 https://github.com/settings/developers 创建）
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# Google OAuth App（在 https://console.cloud.google.com 创建）
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# 生产环境必须设置
NEXTAUTH_URL=https://forcedskin.com
```

## OAuth App 回调 URL 配置

| 提供商 | 回调 URL                                          |
|--------|---------------------------------------------------|
| GitHub | `https://forcedskin.com/api/auth/callback/github` |
| Google | `https://forcedskin.com/api/auth/callback/google` |
| 开发时 | `http://localhost:3000/api/auth/callback/<provider>` |

## 待用户执行

```bash
# 1. 在 prisma 迁移（添加 githubId / googleId / avatar，移除 username / password）
npx prisma migrate dev --name oauth-user-schema

# 2. 在 GitHub / Google 控制台创建 OAuth App 并填写上述回调 URL

# 3. 配置环境变量后启动
pnpm dev
```
