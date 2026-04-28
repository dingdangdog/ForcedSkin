# 029 - 主题色插件 + 网站适配器插件系统重构

## 需求概述

在现有扩展基础上，增加两个「插件系统」：

1. **主题色插件**：官网管理主题，用户收藏并选择自己的亮/暗主题，扩展登录后拉取并应用
2. **网站适配器插件**：社区提交针对特定网站的精细适配代码，管理员审核，用户可启用

---

## Schema 变更（home/prisma/schema.prisma）

### Theme 模型补全

| 新增字段 | 类型 | 说明 |
|---|---|---|
| `displayName` | String | 显示名称（如"深林暗色"） |
| `isActive` | Boolean | 替代旧 `status` 字符串，布尔值更直观 |
| `sortOrder` | Int | 排序权重 |

删除了 `status String` 字段。

### 新增 UserAdapters 表

用户已启用的适配器关联表，`userId + adapterId` 联合唯一。

### SiteAdapter 字段调整

- `userId` → `submitterId`（语义更清晰）
- `name` 改为英文标识，新增 `displayName`
- `siteDomain` 支持逗号分隔多域名
- `status` → `isActive Boolean`（`false` = 待审核，`true` = 已上线）

---

## 服务端 API（home/server/api/）

| 路径 | 方法 | 说明 |
|---|---|---|
| `/api/themes` | GET | 公开主题列表，支持 `mode`/`page`/`pageSize` 筛选 |
| `/api/themes/[id]` | GET | 主题详情 |
| `/api/adapters` | GET | 公开已上线适配器列表 |
| `/api/entry/user/themes` | GET | 当前用户收藏的主题 |
| `/api/entry/user/themes/favorite` | POST | 切换收藏状态（themeId） |
| `/api/entry/user/themes/select` | PATCH | 更新用户选定的亮/暗主题 name |
| `/api/entry/adapters` | POST | 提交新适配器（待审核） |
| `/api/pub/extension-settings` | GET | 扩展专用：支持 Bearer Token，返回用户选定主题的完整色值 |
| `/api/admin/themes` | GET/POST | 管理员：主题列表/创建 |
| `/api/admin/themes/[id]` | PATCH/DELETE | 管理员：更新/删除主题 |
| `/api/admin/adapters` | GET | 管理员：适配器列表（含待审核） |
| `/api/admin/adapters/[id]` | PATCH/DELETE | 管理员：上线/下线/删除适配器 |

---

## 官网前端（home/app/）

### 新增/改造页面

- **`/`（首页）**：英雄区 + 功能亮点 + 主题画廊（亮/暗切换）
- **`/themes`**：完整主题浏览，支持收藏、选为亮/暗主题
- **`/account`**：用户账号页，管理收藏，查看并更换当前亮/暗主题
- **`/admin/themes`**：主题 CRUD，色彩 JSON 编辑
- **`/admin/adapters`**：适配器审核（上线/下线/删除/查看代码）

### 新增组件

- **`components/theme/ThemeCard.vue`**：主题预览卡片，内联渲染配色方案的 mini UI 预览，支持收藏/选择操作

### Layout 改造

- `layouts/default.vue`：加入顶部导航（首页/主题/适配器/账号/管理）

---

## 扩展改造（extension/src/）

### popup

新增登录区块：
- 未登录：显示用户名/密码输入框
- 已登录：显示用户名、当前亮/暗主题名称、「同步主题配色」按钮

### background.js

新增消息处理：

| 消息类型 | 说明 |
|---|---|
| `LOGIN` | 调用 `/api/login`，存储 token 和用户信息到 `chrome.storage.local` |
| `LOGOUT` | 清除 token/user/palette |
| `SYNC_THEME` | 调用 `/api/pub/extension-settings`，拉取用户主题色值存入 `gtsPalette` |
| `GET_USER_INFO` | 返回 local storage 中的 user 对象 |

`SETTINGS_UPDATE` 消息新增 `palette` 字段，一同下发给所有标签页。

### engine.js

- `DEFAULT_PALETTE`：原 `PALETTE` 常量，保留作为回退
- `PALETTE`：变量，可被运行时替换
- `normalizeRemoteColors(colors, mode)`：把官网 ThemeColors JSON 格式转为引擎内部格式
- `ThemeEngine.setPalette(remotePalette)`：接受官网返回的 `{ light: {...}, dark: {...} }` 并更新 `PALETTE`
- `ThemeEngine.loadInitialSettings()`：同时从 `chrome.storage.local` 读取 `gtsPalette`

### content.js

- 接收 `SETTINGS_UPDATE` 中的 `palette` 字段并调用 `engine.setPalette()`
- 初始化时读取并应用 `palette`

---

## 注意事项

- `extension/src/background.js` 中 `API_BASE` 常量需在部署后替换为实际域名
- `pub/extension-settings` 接口允许跨域（`Access-Control-Allow-Origin: *`），因为扩展无法携带 cookie，需通过 `Authorization: Bearer <token>` 头鉴权
- Prisma 迁移：需执行 `prisma migrate dev` 生成迁移文件（由开发者自行执行）
