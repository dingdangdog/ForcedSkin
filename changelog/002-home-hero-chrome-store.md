# 002 — 首页 Hero 标题配色与 Chrome 应用商店链接

**日期：** 2026-06-06

## 变更摘要

优化首页 Hero 区域视觉层次，并增加 Chrome Web Store 扩展安装入口。

## 修改文件

- `home/app/pages/index.vue`
- `home/i18n/locales/en.json`
- `home/i18n/locales/en-GB.json`
- `home/i18n/locales/zh.json`
- `home/i18n/locales/de.json`
- `home/i18n/locales/es.json`
- `home/i18n/locales/ja.json`

## 详细说明

### 1. 标题配色对调

- **之前：** 第一行「Force every website into」为主题色，第二行「your favorite colors」为默认前景色。
- **之后：** 第一行为 `text-foreground`（黑色/前景色），第二行为 `text-primary-500`（主题色）。

### 2. Chrome 应用商店链接

链接地址：`https://chromewebstore.google.com/detail/nljhbgiempaeoklghhpmhnphihlkhalm`

新增位置：

1. **Hero 主按钮区** — 「Add to Chrome / 添加到 Chrome」作为主 CTA（主题色实心按钮），原「浏览主题」「登录」改为次要边框按钮。
2. **Hero 底部说明** — 在浏览器兼容说明后追加「前往 Chrome 应用商店安装」文字链接。
3. **页面底部 CTA 区** — 新增「安装 Chrome 扩展」按钮，与登录、浏览主题并列。

新增 i18n 键：`home.cta_extension`、`home.chrome_store_link`、`home.cta.btn_extension`（六语言均已翻译）。
