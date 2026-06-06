# 007 — 官网关于页面（多语言）

**日期：** 2026-06-06

## 变更摘要

新增 `/about` 关于页面，介绍 ForcedSkin 官网与浏览器扩展的功能，支持六语言 i18n，并在页脚增加入口链接。

## 修改文件

- `home/app/pages/about.vue`（新建）
- `home/app/layouts/default.vue`
- `home/i18n/locales/en.json`
- `home/i18n/locales/en-GB.json`
- `home/i18n/locales/zh.json`
- `home/i18n/locales/de.json`
- `home/i18n/locales/es.json`
- `home/i18n/locales/ja.json`

## 详细说明

### 页面内容

- **ForcedSkin 是什么**：浏览器换肤平台概述
- **官网功能**：主题市场、网站适配器、账号同步、创作指南
- **扩展功能**：强制换肤、亮/暗/自动/关闭模式、白名单、账号同步、适配器构建器
- **使用步骤**：安装扩展 → 选主题 → 登录同步 → 可选投稿
- **隐私提示**：链至隐私政策
- **CTA**：Chrome 商店、主题市场、登录

### i18n

新增 `about.*`、`seo.about.*`、`footer.about` 键，覆盖 en / en-GB / zh / de / es / ja。

### 导航

页脚新增「关于我们 / About」链接（与隐私政策、用户协议并列）。
