# 077 — 构建器提交：域名从当前标签页读取

**日期**：2026-05-11  
**涉及子项目**：`extension`

---

## 问题

提交适配需求时出现英文 `Please enter the target site domain`（`builderDomainEmpty`）。原因是旧逻辑从 `#builderCurrentSite` 的文案里用固定中文前缀截取域名；当用户直接进入「已选元素」界面或英文环境时，该节点未刷新或前缀不匹配，导致 `hostname` 为空，**在插件内提前 return**，尚未请求服务端。

---

## 修复

**文件**：`extension/src/popup/popup.html`

- 将 `#builderCurrentSite` 移到 `panel-builder` 顶层，空态/编辑态均可见。

**文件**：`extension/src/popup/popup.js`

- 新增 `updateBuilderSiteDisplay()`：用 `getCurrentTabHostname()` 刷新展示，前缀走 i18n `builderCurrentSitePrefix`。
- `builderSubmit` 改为 `await getCurrentTabHostname()` 作为 `siteDomain`，空时用 `builderSiteUnavailable` 提示（非「请输入域名」）。
- 进入构建器 Tab、`renderBuilderEmpty` / `renderBuilderActive` 时刷新站点展示。

**文件**：`extension/_locales/zh_CN/messages.json`、`extension/_locales/en/messages.json`

- 新增 `builderCurrentSitePrefix`、`builderSiteUnavailable`。

---

## 与服务端关系

- 域名校验为 **插件本地**；服务端未升级时，请求可能 404 或其它错误，但不会先误报「请输入域名」。
- 新接口路径：`POST /api/entry/adapter-requests`（需服务端已部署对应路由与表迁移）。
