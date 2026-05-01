# 058 — 扩展适配器公开接口补全展示字段

## 问题

`/api/pub/extension-adapters` 虽已查询 `displayName`、`siteDomain`，但历史或手工数据可能为空，扩展侧不再用 `name` 回填后，账号页卡片会显示为 `—`。

## 变更

- 新增 `home/server/utils/extension-adapter-presentation.ts`：`resolveExtensionAdapterPresentation()` 在 DB 值为空时，
  - `siteDomain`：从公式 JSON 的 `match.hostname` 规则收集 `value` 去重拼接；
  - `displayName`：优先公式 `id` 转标题样式，否则用 `name` 的第一段（如 `foo-bar-xyz` → 对 `foo` 做 titleize）作为可读名。
- `home/server/api/pub/extension-adapters.get.ts` 对每条记录映射时调用上述解析，保证响应里展示字段尽量有内容（仍保留原始 `name` / `code`）。

## 说明

不修改数据库内容，仅在读接口层推断；用户部署后需在扩展中「刷新适配器」以更新本地缓存。
