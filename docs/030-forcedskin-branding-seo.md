# 030 - ForcedSkin 品牌化 + SEO 优化

## 品牌定位

- **产品名称**：ForcedSkin（强制换肤）
- **域名**：forcedskin.com
- **Slogan**：让每个网站都有你喜欢的颜色
- **定位**：浏览器换肤扩展 + 主题市场平台

---

## 本次变更

### 扩展（extension/）

| 文件 | 变更 |
|---|---|
| `manifest.json` | name → "ForcedSkin — Web Theme Switcher"，description 英文版，homepage_url，version 0.2.0 |
| `src/background.js` | `API_BASE` = `https://forcedskin.com` |
| `src/popup/popup.html` | 标题改为 ForcedSkin，登录提示文案更新 |

### 官网（home/）

**nuxt.config.ts**
- 全局 `titleTemplate: '%s — ForcedSkin'`
- 全局 meta：description、keywords、og:*、twitter:*、theme-color
- robots.txt 由 `Disallow: /` 改为精准 Disallow（仅屏蔽 /admin/ /account/ /api/）
- Sitemap 声明
- nitro routeRules：/api/pub/** 开启 CORS，私有页设 X-Robots-Tag: noindex

**新增页面**
- `/privacy` — 隐私政策（8 大章节，涵盖数据收集/使用/安全/权利/联系方式）
- `/terms` — 用户服务协议（10 大章节，涵盖注册、行为规范、IP、免责声明、法律适用）
- `/adapters` — 适配器商城（完整实现，含提交弹窗）

**SEO 优化（所有公开页面）**

| 页面 | title | description | og:* | canonical | 结构化数据 |
|---|---|---|---|---|---|
| / | ForcedSkin — 强制换肤... | ✅ | ✅ | ✅ | WebSite + SearchAction |
| /themes | 主题市场 | ✅ | ✅ | ✅ | CollectionPage |
| /adapters | 网站适配器 | ✅ | ✅ | ✅ | CollectionPage |
| /privacy | 隐私政策 | ✅ | ✅ | ✅ | — |
| /terms | 用户协议 | ✅ | ✅ | ✅ | — |
| /login | 登录/注册 | ✅ | — | — | noindex |
| /account | 我的账号 | noindex | — | — | noindex |
| /admin/* | 后台管理 | noindex | — | — | noindex |

**Layout 改造**
- Logo F 图标 + ForcedSkin 文字
- 所有非首页底部加统一简化页脚（含隐私/协议/联系方式链接）

**登录页全面重写**
- 登录 / 注册双 Tab，完整表单验证
- 注册协议声明链接

**新增注册接口**：`POST /api/register`

**public/sitemap.xml**：列出 6 个公开页面，含 lastmod、changefreq、priority

---

## SEO 关键词策略

**核心词**：ForcedSkin、强制换肤、浏览器主题扩展、网页换肤

**长尾词**：
- 浏览器暗色模式扩展
- 全局网页主题切换
- 网页强制换肤插件
- browser dark theme extension
- web skin chrome extension

---

## 待办（需开发者完成）

1. 制作 `og-image.png`（1200×630）放于 `public/` 目录
2. 制作 `favicon.ico`（ForcedSkin F 图标）
3. 向 Google Search Console 提交 sitemap.xml
4. 部署后在 Google Search Console 验证域名所有权
5. 补充 `email@forcedskin.com` 邮箱配置（privacy@、legal@、hello@）
