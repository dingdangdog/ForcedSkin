# 059 — 适配器展示字段：线上接口缺键与扩展兜底

## 根因（已抓包）

请求 `GET https://forcedskin.com/api/pub/extension-adapters` 时，返回体里每条适配器仅有 `name`、`code`、`updatedAt`，**没有** `displayName`、`siteDomain`。扩展侧此前用 `typeof x === "string"` 读取，得到空串，卡片即显示为 `—`。

这与「数据库里有两列」不矛盾：**库里有值，但当前生产环境下发的 JSON 未包含这两列**（未部署含 `select`/映射的新版本接口，或构建/路由异常）。本地仓库里的 `extension-adapters.get.ts` 本应返回这两字段。

## 变更

- **`extension/src/background.js`**
  - 增加 `normalizeAdapterPresentation()`：优先用接口/缓存的 `displayName`、`siteDomain`（及 `display_name`、`site_domain`）；为空时从 `code` 公式 JSON 的 `match.hostname` 与 `id` 推断；仍不足时用 `name` 第一段 titleize。
  - `syncAdapters` 写入缓存、`GET_ADAPTER_LIST` 读缓存并下发给弹窗时均统一走该归一化，保证旧接口与旧缓存也能展示站点名与域名。

## 后续

- 将 `home` 中含 `displayName` / `siteDomain` 的 `extension-adapters` 接口部署到生产后，扩展会优先使用接口给出的 DB 值；公式推断仅作后备。
