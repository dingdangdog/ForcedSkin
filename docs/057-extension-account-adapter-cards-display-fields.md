# 057 — 扩展账号页适配器卡片展示字段

## 变更

- **popup** `renderAdapterReadonlyCard`：卡片标题只使用接口/缓存中的 `displayName`，副标题只使用 `siteDomain`；不再用内部脚本键 `name` 作为展示回退。
- **background** `syncAdapters`：写入本地缓存时，`displayName` 仅在接口提供非空字符串时保存，不再用 `name` 冒充展示名。
- **background** `GET_ADAPTER_LIST`：返回给弹窗的 `displayName` / `siteDomain` 不再用 `name` 回填；`name` 仍保留于对象中供脚本执行等内部用途。

## 原因

账号页适配器列表应对用户展示人类可读站点名与域名；内部 `name` 仅为标识/存储键，不宜出现在 UI 上。
