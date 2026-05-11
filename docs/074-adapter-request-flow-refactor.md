# 074 — 适配器需求提交流重构（用户无须提交代码）

**日期**：2026-05-11  
**涉及子项目**：`extension`、`home`

---

## 目标

将插件构建器从“用户提交公式代码”改为“用户提交页面选区 + 文字需求”，由管理员（可结合 AI）后续实现适配器。

---

## 主要变更

### 1) 数据模型：新增适配请求表

**文件**：`home/prisma/schema.prisma`

- 新增 `AdapterRequest`（`adapter_requests`）模型：
  - `submitterId`
  - `siteDomain`
  - `selectedElements`（JSON 字符串）
  - `feedback`（用户需求说明）
  - `status`（`pending | processing | completed | rejected`）
  - `source`（`extension | website`）
  - `adminNote`、`adapterId`、`reviewedAt`

> 按项目规则，本次**未生成 Prisma migration SQL**，需开发者在本地执行迁移命令生成并应用。

### 2) 后端 API：请求制流程

- 新增 `POST /api/entry/adapter-requests`
  - 登录用户提交适配需求（域名 + 元素列表 + 反馈文字）
- 新增 `GET /api/entry/user/adapter-requests`
  - 用户查看自己提交的需求及处理状态
- 新增 `GET /api/admin/adapter-requests`
  - 管理员查看需求列表（支持状态筛选）
- 新增 `PATCH /api/admin/adapter-requests/:id`
  - 管理员更新状态、备注、关联适配器 ID

### 3) 扩展端：构建器提交改为“需求”

**文件**：`extension/src/background.js`、`extension/src/popup/popup.js`、`extension/src/popup/popup.html`

- `SUBMIT_ADAPTER` 改为请求 `POST /api/entry/adapter-requests`
- payload 改为：
  - `siteDomain`
  - `selectedElements`
  - `feedback`
  - `source`
- popup 构建器 UI 改为填写“需求描述”文本框，不再要求用户理解/提交底层公式代码。

### 4) 管理端页面：需求管理

**文件**：`home/app/pages/admin/adapter-requests.vue`

- 新增后台页面，支持：
  - 查看请求详情（域名、反馈、元素 selector）
  - 标记状态（处理中/完成/拒绝）
  - 填写管理员备注（可写 AI 处理策略）

### 5) 扩展文案更新

**文件**：`extension/_locales/zh_CN/messages.json`、`extension/_locales/en/messages.json`

- 引导文案改为“提交需求而非提交代码”
- 新增反馈描述相关提示
- 新增“选取模式启动”提示文案

