# 060 — 适配器列表与首页统一站点 favicon

## 原因

首页「已适配网站」使用 `siteDomain` 首域 + Google s2 favicons 展示三方 logo；`adapters.vue` 仅渲染 `displayName` 首字母，视觉上不一致。

## 变更

- 新增 `home/app/utils/adapter-branding.ts`：`getAdapterMainDomain`、`getAdapterFaviconUrl`（域名 `encodeURIComponent`，与首页原逻辑等价略严）。
- `home/app/pages/index.vue` 改为引用上述工具，删除内联重复函数。
- `home/app/pages/adapters.vue` 卡片左侧改为与首页相同的 favicon 区域（无可用域名时仍 fallback 首字母；`sz=64` 适配 `w-10` 卡片）。
