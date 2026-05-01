# 053 — 官网多语言前缀路由与 SEO 本地化

时间：2026-05-01

## 目标

1. **按语言区分 URL 路径**：`@nuxtjs/i18n` 使用 `strategy: prefix_except_default`，英文（默认）无前缀，中文为 `/zh/...`，便于搜索引擎抓取不同语种页面。
2. **路由跳转统一本地化**：站内 `NuxtLink`、`navigateTo`、middleware 重定向等均通过 `useLocalePath()`/`useSwitchLocalePath()`，避免中英文混链。
3. **各页 Meta / canonical / hreflang / 结构化文案随语言切换**：新增 `seo.*` i18n 键与 composable `useForcedSkinSeo`，标题仍走全局 `titleTemplate: '%s — ForcedSkin'`；后台静态标题使用 `titleTemplate: false`。

## 主要变更文件

| 区域 | 说明 |
|------|------|
| `home/nuxt.config.ts` | i18n 策略；`langDir: 'locales/'`（相对 **i18n 模块内置根目录**，实际文件位于 `home/i18n/locales/*.json`）；locales 增加 `iso`；`nitro.routeRules` 增加 `/zh/account|admin|auth` 的 noindex；全局 `head` 去掉与各页重复的 canonical / og:locale |
| `home/app/composables/useForcedSkinSeo.ts` | 统一 description / og:url / canonical / alternate hreflang（含 x-default=en）及主题页 CollectionPage JSON-LD |
| `home/app/utils/localized-auth-login.ts` + `home/app/utils/api.ts` | 在无法安全使用 composable 的上下文里根据 `i18n_locale` cookie 跳转 `/zh/auth/login` 或 `/auth/login` |
| `home/app/app.vue` | 按当前 locale 动态 `html lang` |
| `home/app/layouts/default.vue`、`admin.vue`、`home/app/middleware/*.ts`、`home/app/pages/**` | `localePath` / `switchLocalePath` |
| `home/i18n/locales/en.json`、`zh.json` | 新增 `seo` 命名空间文案 |
| `home/public/sitemap.xml` | 公开页中英文 URL + hreflang 成对录入；移除 noindex 的 `/auth/login` |

## 说明

部署后若在 CDN 或服务端重写过路径，请确保 `/zh/**` 与默认语言前缀规则一致；扩展或其他系统若硬编码 `forcedskin.com/...`，需按需改为带上用户语言的 `localePath`。
