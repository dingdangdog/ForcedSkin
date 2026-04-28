# 028 · 国际化（i18n）— 中英双语支持

## 概述

为官网和浏览器扩展增加国际化支持，提供中文（zh）和英文（en）两种语言，默认英文。

## 官网（Nuxt.js + @nuxtjs/i18n v10）

### 新增文件

| 文件 | 说明 |
|------|------|
| `home/locales/en.json` | 英文翻译文件（全量 key） |
| `home/locales/zh.json` | 中文翻译文件（全量 key） |

### 修改文件

**`home/nuxt.config.ts`**
- 新增 `i18n` 配置块：`lazy: true`，`langDir: 'locales/'`，`defaultLocale: 'en'`，`strategy: 'no_prefix'`
- 语言检测通过 cookie `i18n_locale` 保存用户选择

**`home/app/layouts/default.vue`**
- Header 新增语言切换按钮（`EN ↔ 中文`），通过 `setLocale()` 切换
- 所有导航文本、Footer 文本替换为 `t('...')` 调用

**`home/app/pages/index.vue`**
- Hero 区域、热门主题区、已适配网站区、底部 CTA 全部 i18n 化

**`home/app/pages/themes.vue`**
- 标题、筛选按钮标签、toast 消息全部 i18n 化

**`home/app/pages/adapters.vue`**
- 标题、提交弹窗所有字段标签、toast 消息全部 i18n 化

**`home/app/pages/account.vue`**
- 页面文本全部 i18n 化

**`home/app/pages/auth/login.vue`**
- 登录页标题、按钮文字、错误消息全部 i18n 化
- 错误信息通过 `t('auth.error.{code}')` 动态解析

**`home/app/components/theme/ThemeCard.vue`**
- 亮色/暗色 badge、"已选"标记、收藏按钮 title、模拟 UI 文字（按钮/次要）全部 i18n 化

## 浏览器扩展（Chrome Extension i18n API）

### 新增文件

| 文件 | 说明 |
|------|------|
| `extension/_locales/en/messages.json` | 英文消息（Chrome 扩展 i18n 格式） |
| `extension/_locales/zh_CN/messages.json` | 中文消息 |

### 修改文件

**`extension/manifest.json`**
- `name`、`short_name`、`description` 改为 `__MSG_xxx__` 占位符
- 新增 `"default_locale": "en"` 配置

**`extension/src/popup/popup.html`**
- 所有静态文字标签新增 `data-i18n`、`data-i18n-placeholder`、`data-i18n-title` 属性
- 去除 HTML 内硬编码中文字符串

**`extension/src/popup/popup.js`**
- 新增 `i18n(key, substitutions)` 辅助函数（封装 `chrome.i18n.getMessage`）
- 新增 `applyI18n()` 函数，在初始化时自动填充带 `data-i18n-*` 属性的元素
- 所有 `textContent`、`placeholder` 赋值替换为 `i18n()` 调用
- Chrome 会根据浏览器语言设置自动选择 `en` 或 `zh_CN`

## 语言切换机制

| 端 | 机制 |
|----|------|
| 官网 | Header 右上角切换按钮，通过 `setLocale()` + cookie 持久化 |
| 扩展 | 跟随浏览器语言自动选择（Chrome 内建机制），无需手动切换 |
