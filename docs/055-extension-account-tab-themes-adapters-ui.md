# 055 — 扩展账号页：我的主题横向列表与适配器区域

**日期**：2026-05-01  

## 变更摘要

1. **账号页 UI**
   - 移除「全部可选主题」双区块（亮色/暗色分组的网格卡片）及「与账号同步」两行摘要 + 全宽同步按钮布局。
   - 新增「我的主题」：标题与「同步主题」按钮同一行左右分布；下方为仅展示、不可点击的缩小主题卡，亮色与暗色条目在同一横向滚动条中连续排列，并以角标区分亮/暗。
   - 新增「适配器」：标题与「更新适配器」按钮同一行；下方横向滚动展示当前本地已缓存的适配器（展示名 + 站点域名）；仅展示，无收藏/启用开关（与官网策略一致：已上线适配器全部下发同步）。

2. **后台逻辑**
   - `syncTheme()` 不再隐式调用 `syncAdapters()`；主题与适配器由各自按钮或安装/启动时的全量拉取触发。
   - 新增消息：`SYNC_ADAPTERS`、`GET_ADAPTER_LIST`（弹窗拉列表时不返回 `code` 正文）。
   - 登录成功后仍顺序执行主题同步与适配器更新，保证首次进入即有列表可展示。

3. **服务端**
   - `GET /api/pub/extension-adapters` 响应中每条适配器增加 `displayName`、`siteDomain`（仍含 `code` 供扩展缓存公式 JSON）。

## 涉及文件

- `extension/src/popup/popup.html`、`popup.js`、`popup.css`
- `extension/src/background.js`
- `extension/_locales/zh_CN/messages.json`、`extension/_locales/en/messages.json`
- `home/server/api/pub/extension-adapters.get.ts`
