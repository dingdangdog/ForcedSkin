# 043 扩展：主题候选列表与横向选色条

## 日期

2026-04-30

## 背景

官网已上线后，浏览器扩展需要区分游客与登录用户的主题数据来源，并在仅选择「亮/暗」模式时仍能切换具体配色（例如同一模式下多个收藏主题）。

## 服务端

1. **`GET /api/pub/extension-settings`**（`home/server/api/pub/extension-settings.get.ts`）  
   - 未登录：与原先一致，解析系统默认亮/暗主题，并新增 `lightOptions`、`darkOptions` 数组（当前至少包含各模式的默认主题）。  
   - 已登录：在默认主题与账号当前选中的亮/暗主题基础上，合并该用户**收藏**的对应 `mode` 主题，去重后排序（当前选中优先，其次默认，再按 `sortOrder`/名称）。  
   - 每项包含 `id`、`name`、`displayName`、`mode`、解析后的 `colors`，供扩展本地渲染与配色。

2. **`PATCH /api/pub/extension-theme-select`**（`home/server/api/pub/extension-theme-select.patch.ts`，新建）  
   - 使用与扩展 OAuth 一致的 `Authorization: Bearer <jwt>`。  
   - 请求体支持 `lightTheme` / `darkTheme`（主题 `name` 字段），校验主题为对应 `mode` 且 `isActive` 后更新用户表。  
   - 原因：`/api/entry/*` 仅认 NuxtAuth 会话，扩展无法直接使用原 `themes/select` PATCH。

## 扩展（`extension/`）

1. **`background.js`**  
   - 持久化 `gtsThemeCatalog`、`gtsPickLight`、`gtsPickDark`；从接口写入 catalog 与当前选中，并用选中项的 `colors` 组合 `gtsPalette`。  
   - 游客：在 catalog 合法前提下保留本机选中的亮/暗具体主题；同步/安装/启动时拉取默认与候选列表。  
   - 已登录：同步后以服务端当前选中为准；`APPLY_THEME_VARIANT` 在本机更新配色并 best-effort 调用 `extension-theme-select`。  
   - `GET_SETTINGS` 在本地无 catalog 时自动拉取并写入；`LOGOUT` 清除 catalog 与选中缓存。

2. **Popup**  
   - 选择「亮色主题」时展示亮色候选横向滚动条（chip：色块 + 名称）；暗色同理；「不修改」时隐藏两条。  
   - 版本号升至 `0.2.1`；文案 `_locales` 增加 `pickLightTheme` / `pickDarkTheme`。

## 验证建议

- 未登录打开扩展：应能加载默认亮/暗候选并切换本地配色。  
- 登录且收藏多个同 mode 主题：同步后横向列表含多项，切换 chip 后页面配色变化，官网账号亮/暗应随之更新（需部署新版本 API）。
