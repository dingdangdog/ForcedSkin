# 065 Nuxt typecheck 结果与部分修复

**日期：** 2026-05-01

## `pnpm exec nuxi typecheck` 结果

以 **非零退出码** 结束。主要类别：

1. **vue-tsc / Volar**：`npx` 拉取的 `vue-tsc` 与本地 `vue-router` 的 volar 插件链路找不到 `@vue/language-core`，属于工具链与依赖未在项目中**固定安装**导致的环境问题。建议在 `home` 中 `pnpm add -D vue-tsc @vue/language-core`（版本与当前 Vue 对齐）后改用本地 `pnpm exec vue-tsc`，避免 npx 临时包。

2. **应用与服务器 TS 报错（尚未在本次全部消除）**：`account.vue` / `themes.vue` 等与 `ThemeCard` 上重复的 `Theme` 类型不一致；`server/api/pub/extension-settings.get.ts` 空对象类型；`server/utils/config-cache.ts` 与 Prisma 扩展类型不匹配等。

## 本次已做代码调整

- 新增 `app/composables/useAdminPageHead.ts`，集中后台页 `useHead` + `titleTemplate: false`（经 `unknown` 断言满足类型）。
- `admin/index.vue`、`admin/themes.vue`、`admin/adapters.vue` 改为调用 `useAdminPageHead`。
- `app/middleware/auth.ts`：用局部变量 `st` 保存并在 `loading` 等待后重新赋值，消除对 `authenticated` 的无效收窄报错。

## 涉及文件

- `home/app/composables/useAdminPageHead.ts`
- `home/app/pages/admin/index.vue`
- `home/app/pages/admin/themes.vue`
- `home/app/pages/admin/adapters.vue`
- `home/app/middleware/auth.ts`
