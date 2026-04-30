# 042 — 适配器改为「公式 JSON」存储（forcedskin-adapter-formula/v1）

**日期**：2026-04-30  

## 结论（回应「能不能只存公式」）

**能。** 服务端 `SiteAdapter.code` **只保存声明式 JSON**，扩展内置 **`adapter-formula.js` 解释器**解析后注册 `ThemeEngine` 适配器；**不再**存储或下发可执行 JavaScript，扩展侧 **不再**使用 `new Function` 执行服务端内容。

超出当前 schema 表达能力的需求（例如全新交互逻辑），应通过 **扩展发版**扩展解释器支持的 `layer.kind` 或字段，而不是开放任意脚本。

## Schema 概要

- **根**：`schema: "forcedskin-adapter-formula/v1"`，`id`，`priority?`，`match.hostname[]`，`layers[]`。
- **hostname 规则**：`equals` | `suffixDomain`。
- **layer.kind**：`surface` | `accent` | `canvas` | `richText` | `svgRecolor`（语义与指南「着色分层」一致）。
- **校验**：`home/server/utils/adapter-formula.ts`；提交与管理端更新 `code` 时均校验。

## 主要文件

| 路径 | 说明 |
|------|------|
| `home/server/seeds/bilibili-adapter.formula.json` | B 站完整公式；空库 `init-data` 读入写入 DB |
| `extension/src/content/adapter-formula.js` | 客户端解释器 |
| `extension/src/content/content.js` | 从缓存读取 JSON，调用 `__GTS_ADAPTER_FORMULA__.install` |
| `home/server/api/pub/extension-adapters.get.ts` | 下发 JSON 字符串（仍使用字段名 `code` 兼容 DB） |

## 移除

- `home/server/seeds/bilibili-adapter.fallback.js`、`extension/src/content/adapters/bilibili.js`
- `home/server/utils/resolve-bilibili-adapter-code.ts`

## 文档与界面

- `home/app/pages/guide/adapter.vue`：公式字段表与示例 JSON。
- `home/i18n/locales/*.json`：`field_code` / `field_code_ph` 文案。
- `docs/040`、`docs/041`：维护说明已指向公式与 seeds JSON。
