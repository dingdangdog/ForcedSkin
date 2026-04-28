# 032 — 官网主题修复 + 首页重构 + 测试工具

## 1. 明暗主题修复

### 根本原因
Tailwind 的语义色使用 CSS 变量 `rgb(var(--color-xxx))` 语法，
要求变量值为 **纯 RGB 通道数字**（如 `248 255 248`，不加 `rgb()` 包装）。

但项目中 **没有任何 CSS 文件定义这些变量的默认值**，变量只在客户端 JS 运行后由 theme store 注入，
导致首次渲染时所有颜色变成透明或空白（FOUC）。

### 修复方案

新建 `home/app/assets/css/main.css`，直接定义：
- `:root` → 亮色 light-mint 全部变量
- `.dark` → 暗色 dark-forest 全部变量

颜色值与插件 `engine.js` 的 `DEFAULT_PALETTE` **完全对齐**：

| 变量 | 亮色 | 暗色 |
|------|------|------|
| background | `#F8FFF8` → `248 255 248` | `#101410` → `16 20 16` |
| foreground | `#2C3E2C` → `44 62 44` | `#E0E0E0` → `224 224 224` |
| surface | `#F0FFF0` → `240 255 240` | `#1E221E` → `30 34 30` |
| primary-500 | `#4CAF50` → `76 175 80` | `#4A9B6B` → `74 155 107` |

在 `nuxt.config.ts` 中通过 `css: ['~/assets/css/main.css']` 注入，确保 SSR 阶段就能正确渲染。

### 顺带修复：theme store 接口格式

原 `fetchThemeConfig` 调用 `/api/themes`（返回分页列表），但 store 期望 `{ d: { light, dark } }` 格式 → **永远解析失败**，始终使用 hardcode 值。

新建 `/api/themes/defaults.get.ts`，直接返回默认亮/暗主题对象；store 改为调用该接口。

---

## 2. 首页重构

移除模块：
- ~~"为什么选择 ForcedSkin？"（功能介绍网格）~~
- ~~"主题画廊"（切换亮暗的主题列表）~~

新增模块：

### 2.1 热门主题（亮色 × 2 + 暗色 × 2）
- 从 `/api/themes` 取前 2 亮 + 前 2 暗（按 sortOrder 排序）
- 每张卡片：模拟页面色块预览 + 色条 + 模式徽章 + "预览/收藏"跳转按钮
- 右上角"查看全部主题 →"链接；移动端底部展示按钮

### 2.2 已适配网站（全量展示）
- 从 `/api/adapters` 取全部（最多 100 条）
- 5 列卡片：网站 favicon（Google S2）+ 显示名 + 主域名
- 底部"提交新的网站适配器"入口链接

---

## 3. 数据初始化扩展

`server/plugins/init-data.ts` 新增：

### 示例适配器（8 个）
B站、知乎、GitHub、掘金、V2EX、少数派、微博、X (Twitter)
均为 placeholder 代码，管理员可在后台填入实际适配逻辑。

### 测试账号（2 个）⚠️ 删除标记

| 字段 | 测试用户 | 测试管理员 |
|------|----------|------------|
| id | `test-user-001` | `test-admin-001` |
| name | 测试用户 | 测试管理员 |
| email | testuser@forcedskin.dev | testadmin@forcedskin.dev |
| roles | user | admin |

**测试通过后删除**：`if (!testUserExists) { ... }` 整个 if 块（文件中有注释标记）。

---

## 4. 开发环境测试登录

### `/api/dev/test-login` (POST)
- 仅在 `NODE_ENV !== production` 可用，生产环境返回 404
- 接受 `{ userId }` → 查 DB → 用 `next-auth/jwt encode` 签发 session-token cookie
- 无需 OAuth 即可直接获得完整 NuxtAuth session

### 登录页测试区块（`/auth/login`）
- 底部虚线黄色警告框，标注"仅开发环境可见"
- "以测试用户登录" / "以测试管理员登录" 两个按钮
- 点击调用 `/api/dev/test-login`，成功后刷新 session 并跳转

**测试通过后删除**：
- `home/server/api/dev/test-login.post.ts` 整个文件
- `home/app/pages/auth/login.vue` 中两处 `⚠️ TODO` 注释包围的代码块
