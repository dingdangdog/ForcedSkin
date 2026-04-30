# 037 — 插件 OAuth 登录与官网会话桥接

## 背景

官网已经切换到 `NuxtAuth`（GitHub / Google OAuth），但插件仍使用已废弃的账号密码登录流程，导致登录体验不一致，也无法复用官网会话。

本次改造目标：

1. 插件登录方式与官网一致（OAuth）。
2. 插件可复用官网登录状态：网页已登录时，插件可直接完成授权，不再重复输入账号。

---

## 变更列表

### 1) 新增桥接接口：`home/server/api/extension/auth/bridge.get.ts`

- 接收 `redirect_uri`（插件 `chrome.identity.getRedirectURL(...)`）参数。
- 读取当前官网 `NuxtAuth` session：
  - 若未登录：302 重定向到 `/auth/login?callbackUrl=<当前桥接URL>`。
  - 若已登录：为插件签发 30 天 Bearer JWT（兼容现有插件主题同步接口）。
- 最终 302 回跳到插件回调地址，并附带：
  - `token`
  - `id/name/email/avatar/roles`
  - `lightTheme/darkTheme`

这实现了“官网登录态 -> 插件登录态”的安全桥接。

### 2) 插件权限更新：`extension/manifest.json`

- 新增 `"identity"` 权限，用于调用 `chrome.identity.launchWebAuthFlow`。

### 3) 插件后台登录流程更新：`extension/src/background.js`

- 删除旧 `doLogin(username, password)`（`/api/login`）路径。
- 新增 `doOauthLogin()`：
  - 通过 `chrome.identity.getRedirectURL` 生成插件回调地址。
  - 打开 `https://forcedskin.com/api/extension/auth/bridge?...` 完成 OAuth / 会话桥接。
  - 解析回跳 URL 中的 `token + user` 并存入 `chrome.storage.local`。
- 消息类型由 `LOGIN` 改为 `LOGIN_WITH_OAUTH`。

### 4) Popup 登录 UI 更新：`extension/src/popup/popup.html` + `extension/src/popup/popup.js`

- 登录区移除用户名/密码输入框。
- 改为单按钮触发 `LOGIN_WITH_OAUTH`。
- 登录文案与状态文案更新为 OAuth 语义（打开登录窗口、OAuth 登录成功/失败）。

### 5) 多语言文案更新

- `extension/_locales/zh_CN/messages.json`
- `extension/_locales/en/messages.json`

新增并替换 OAuth 对应 key：

- `loginBtnOauth`
- `loggingInOauth`
- `loginSuccessOauth`
- `loginFailOauth`

---

## 结果

### 插件与官网登录方式一致

- 官网仍使用 GitHub / Google OAuth（NuxtAuth）。
- 插件通过官网桥接页完成同样的 OAuth 登录链路。

### 登录态共享（可实现并已实现）

- 若官网已登录，插件点击登录后可直接获取 token（通常无需再次登录）。
- 若官网未登录，会先进入官网登录页；登录完成后自动返回插件授权回调。

---

## 注意事项

- 浏览器会话隔离策略可能导致极少数场景下仍需再次确认登录（例如隐私模式、清理了站点 Cookie、或跨浏览器配置差异），属于浏览器安全策略行为。
- 当前桥接接口允许 `http/https/chrome-extension://` 作为回调协议，若后续需要更强约束，可增加扩展 ID 白名单校验（推荐生产启用）。
