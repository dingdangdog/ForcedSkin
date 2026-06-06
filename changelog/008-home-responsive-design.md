# 008 — 官网全站响应式适配

**日期：** 2026-06-06

## 变更摘要

为 ForcedSkin 官网所有公开页面实现移动端优先的响应式布局，新增前台移动端导航抽屉，并统一各页面的间距、栅格与 typography 断点策略。

## 修改文件

- `home/app/layouts/default.vue` — 移动端汉堡菜单 + 右侧抽屉导航
- `home/app/assets/css/main.css` — 全局 overflow 控制、安全区、横向滚动工具类
- `home/app/pages/index.vue`
- `home/app/pages/themes.vue`
- `home/app/pages/adapters.vue`
- `home/app/pages/about.vue`
- `home/app/pages/privacy.vue`
- `home/app/pages/terms.vue`
- `home/app/pages/guide/theme.vue`
- `home/app/pages/guide/adapter.vue`
- `home/app/pages/account.vue`
- `home/app/pages/account/points.vue`
- `home/app/pages/auth/login.vue`
- `home/i18n/locales/*.json` — 新增 `nav.menu`、`nav.open_menu` 等键

## 详细说明

### 布局（default.vue）

- `< md`：隐藏桌面导航，显示汉堡按钮与右侧滑出抽屉
- 抽屉内含主导航、账号/登录/退出等操作
- 路由切换或点击遮罩自动关闭，打开时锁定 body 滚动
- 页脚链接支持换行，适配窄屏

### 全局 CSS

- `html`/`body` 禁止横向溢出
- `safe-bottom` / `safe-top` 适配刘海屏
- `scroll-x-touch` 用于指南页表格横向滚动
- `prose-responsive` 长文本自动换行

### 页面级优化

- 统一 `px-4 sm:px-6`、`py-8 sm:py-10` 等间距断点
- 标题 `text-2xl sm:text-3xl`，Hero `text-3xl sm:text-4xl md:text-6xl`
- 主题/账号页卡片栅格：`grid-cols-1 sm:grid-cols-2 md:grid-cols-3`
- 弹窗表单在小屏改为单列布局
- Toast 限制最大宽度，避免溢出屏幕
