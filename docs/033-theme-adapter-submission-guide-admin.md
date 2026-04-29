# 033 — 主题&适配器社区投稿、文档指南与管理员审核

**日期**：2026-04-29  
**涉及子项目**：`home`

---

## 背景

为了让社区用户能够贡献自己的主题和适配器，同时让新用户能够了解如何编写符合规范的内容，本次迭代完成以下三个方向的功能开发：

1. **社区投稿流程**：普通用户可提交主题申请和适配器申请，默认进入"待审核"状态。
2. **规范文档页面**：提供主题颜色字段规范和适配器 API 规范的完整文档，帮助用户自助创作。
3. **管理员审核功能**：后台主题管理页升级，支持按审核状态筛选、上线审批、拒绝并删除操作。

---

## 变更清单

### 1. Prisma Schema

**文件**：`home/prisma/schema.prisma`

- `Theme` 模型新增 `submitterId String? @db.VarChar(36)` 可空字段，标识社区投稿者 ID；`null` 表示官方/管理员创建。
- 新增索引 `@@index([submitterId])`。

> ⚠️ 需开发者手动执行 `prisma migrate` 生成并应用迁移。

---

### 2. 新增 API

**文件**：`home/server/api/entry/themes.post.ts`（新建）

- 路径：`POST /api/entry/themes`（需登录）
- 接收 `name`、`displayName`、`description`、`mode`、`colors` 字段。
- 验证：name 格式、mode 枚举、colors 合法 JSON、name 唯一性。
- 创建时 `isActive: false`，`submitterId` 设为当前用户 ID，进入待审核队列。

**文件**：`home/server/api/admin/themes.get.ts`（更新）

- 新增 `status` 查询参数支持：
  - `pending`：只返回 `isActive=false && submitterId != null`（社区待审核）
  - `active`：只返回 `isActive=true`
  - 不传/其他：返回全部
- 默认排序改为 `[isActive asc, createdAt desc]`，让待审核项排在最前。

---

### 3. 管理员主题管理页升级

**文件**：`home/app/pages/admin/themes.vue`（重写）

- 头部新增筛选器（全部 / 待审核 / 已上线），与适配器管理保持一致的 UI 风格。
- 待审核计数徽标（红/黄点）显示在页面标题旁。
- 列表项新增状态标签：「社区投稿 · 待审核」/ 「社区投稿 · 已上线」。
- 社区待审核项显示「查看/编辑」+「上线」+「拒绝」三个操作按钮；
  「拒绝」二次确认后删除该主题。
- 编辑弹窗的颜色 JSON 区域添加指向 `/guide/theme` 的文档链接。

---

### 4. 用户端主题页新增投稿入口

**文件**：`home/app/pages/themes.vue`（更新）

- 右上角新增「主题创作指南」跳转按钮和「提交主题」操作按钮（未登录时显示登录引导）。
- 提交弹窗含完整表单：标识、模式、显示名称、简介、颜色 JSON（含指南链接）。
- 切换模式时自动填充对应的示例颜色 JSON。
- 提交成功显示 toast；提交前在前端进行格式校验（name 格式、JSON 合法性）。

---

### 5. 新增文档页面

**文件**：`home/app/pages/guide/theme.vue`（新建）

路由：`/guide/theme`

文档内容：
- 快速入门三步骤（选模式 → 填颜色 → 提交）
- 完整颜色字段规范表（9 个字段，含必填/可选、CSS 变量名、示例值）
- 色阶说明（简写 3 档 vs 完整 11 档，Tailwind 规范）
- 完整 JSON 示例（亮色 light-mint / 暗色 dark-forest）
- `vars` 自定义变量用法
- 标识命名规范（正则、格式建议、长度限制）
- 提交与审核流程说明

**文件**：`home/app/pages/guide/adapter.vue`（新建）

路由：`/guide/adapter`

文档内容：
- 工作原理（引擎流程 4 步骤）
- 最小代码示例
- `engineApi.registerAdapter()` 接口文档（字段表）
- `apply(ctx)` Context 对象说明（4 个方法/属性）
- `palette` 颜色字段表
- 完整示例（bilibili 风格，含 SPA onDomChange）
- 最佳实践 & 禁止行为（6 条）
- 提交须知（5 条）
- 目标域名格式说明

---

### 6. 导航 & 页脚更新

**文件**：`home/app/layouts/default.vue`（更新）

- 页脚新增「主题创作指南」（`/guide/theme`）和「适配器开发指南」（`/guide/adapter`）链接。

**文件**：`home/app/pages/adapters.vue`（更新）

- 顶部操作区新增「适配器开发指南」跳转按钮。
- 提交弹窗标题旁添加指向 `/guide/adapter` 的文档链接。

---

### 7. i18n 翻译更新

**文件**：`home/i18n/locales/zh.json` / `home/i18n/locales/en.json`

新增 key：
- `footer.guide_theme` / `footer.guide_adapter`
- `themes.guide_link`、`themes.submit_btn`、`themes.login_to_submit`、`themes.modal_title`、`themes.modal_subtitle`、`themes.field_*`、`themes.submit`、`themes.submit_ok`、`themes.submit_fail` 等
- `adapters.guide_link`

---

## 审核状态流转

```
用户提交
  └→ isActive: false, submitterId: 用户ID   ← 「待审核」
       ├→ 管理员「上线」→ isActive: true      ← 「已上线」（社区投稿标记保留）
       └→ 管理员「拒绝」→ 记录删除
```

官方/管理员直接创建的主题：`submitterId: null`，不经过审核流程，默认 `isActive: true`。
