# 001 — 官网多语言下拉切换与语种扩展

**日期：** 2026-06-06

## 变更摘要

将官网导航栏的语言切换从二元按钮改为带国旗 emoji 的下拉选择器，并扩展 i18n 支持日语、中文、西班牙语、德语与英式英语。

## 新增文件

- `home/app/utils/i18n-locales.ts` — 集中管理 locale 元数据（国旗、ISO、OG 映射）
- `home/app/components/app/LocaleSwitcher.vue` — 语言下拉切换组件
- `home/i18n/locales/ja.json` — 日语翻译
- `home/i18n/locales/es.json` — 西班牙语翻译
- `home/i18n/locales/de.json` — 德语翻译
- `home/i18n/locales/en-GB.json` — 英式英语翻译

## 修改文件

- `home/nuxt.config.ts` — 注册 6 种 locale，动态生成各语言前缀的 noindex 规则
- `home/app/layouts/default.vue` — 使用 `AppLocaleSwitcher` 替换原 toggle 按钮
- `home/app/app.vue` — `<html lang>` 随当前 locale ISO 动态设置
- `home/app/composables/useForcedSkinSeo.ts` — hreflang / og:locale 覆盖全部语种
- `home/app/utils/localized-auth-login.ts` — 登录路径推导支持所有非默认 locale
- `home/app/layouts/admin.vue` — 路由高亮剥离逻辑改为通用 `stripLocalePrefix`
- `home/i18n/locales/en.json`、`zh.json` — 新增 `common.language` 键

## 支持语种

| 代码 | 国旗 | 路由前缀 |
|------|------|----------|
| en（默认） | 🇺🇸 | 无 |
| en-GB | 🇬🇧 | `/en-GB` |
| zh | 🇨🇳 | `/zh` |
| ja | 🇯🇵 | `/ja` |
| es | 🇪🇸 | `/es` |
| de | 🇩🇪 | `/de` |
