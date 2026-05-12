# 079 — 积分体系与适配需求激励：产品设计说明

**日期**：2026-05-12  
**涉及子项目**：`home`（官网 + API + 管理后台）、`extension`（扩展端）  
**状态**：设计稿（未实现代码；数据库迁移需由开发者本地生成并执行）

---

## 1. 背景与目标

### 1.1 业务背景

社区用户通过扩展或官网提交「适配需求」（选区 + 问题描述），管理员（可结合 AI）将需求落地为正式适配器并上线。为形成正向循环，需要一套**可审计、可解释、可扩展**的积分机制，用于：

- 激励用户**高质量提交**有效需求；
- 激励用户（或指定贡献者）**推动需求闭环**（例如需求被采纳、适配器上线、被其他用户验证有效等）；
- 为后续「兑换权益 / 等级徽章 / 优先审核」等扩展预留空间。

### 1.2 设计原则

1. **单一事实来源**：用户「当前可用积分」必须由**账本流水**汇总或等价地由「余额表 + 流水」双写保证一致；禁止仅依赖可篡改的缓存字段作为唯一依据。
2. **事件驱动**：任何积分变动都对应一条明确的**业务事件**（如 `ADAPTER_REQUEST_SUBMITTED`），并写入不可篡改的流水（允许冲正，但必须留痕）。
3. **可解释**：用户能在前台看到「为什么加分 / 为什么扣分」；管理员能追溯任意一笔流水的来源对象与操作者。
4. **防刷与风控**：积分与「可验证行为」绑定；对重复、低质、恶意提交设阈值与惩罚策略。
5. **与登录强绑定**：提交适配需求**必须登录**；匿名仅可浏览，不可产生积分事件。
6. **与现有模型兼容**：在已有 `User`、`AdapterRequest`、`SiteAdapter` 基础上扩展，避免再造一套平行账号体系。

---

## 2. 核心概念

### 2.1 积分（Points）

- **定义**：平台内虚拟计量单位，用于激励与后续权益兑换（兑换规则可二期再开）。
- **粒度**：建议使用整数；最小变动单位为 1（或 0.01 若未来需要小数，但一期整数更简单）。
- **命名**：对用户展示可用「贡献分 / 积分」；对开发可用 `points` 或 `credits`（全文用「积分」）。

### 2.2 账本流水（Ledger）

每一笔积分变动对应一条流水记录，包含：

- 用户、变动值（正/负）、变动后余额快照（可选）、原因码、关联业务对象 ID、操作者（系统 / 用户 / 管理员）、幂等键、时间。

**冲正**：若误发或事后判定无效，使用「反向流水」或 `VOID` 类型记录，禁止物理删除历史。

### 2.3 余额（Balance）

两种实现二选一（推荐 A）：

- **A（推荐）**：`user_points_balance` 表维护 `available / frozen`（若有冻结场景），每笔业务在事务内「写流水 + 更新余额」。
- **B**：仅流水表，余额由聚合计算（读多写少场景可接受，但列表页压力大，不推荐作为主方案）。

一期建议 **A**，查询简单、风控统计方便。

### 2.4 规则与活动（Rules & Campaigns）

- **规则（Rule）**：长期有效的积分规则，如「有效需求提交 +10」「需求闭环 +50」。
- **活动（Campaign）**：限时倍率或额外奖励，如「春节双倍」「新站首单加成」；活动通过 `rule` 生效窗口或独立 `multiplier` 表实现。

### 2.5 幂等（Idempotency）

所有「可能重试」的入口（扩展提交、Webhook、管理员点击）必须带 **幂等键**，避免网络重试导致重复加分。

建议：`idempotencyKey = hash(eventType + sourceObjectId + ruleCode + period)` 或由客户端生成 UUID 存服务端。

---

## 3. 业务范围与积分事件（一期建议）

> 以下为「建议默认」；具体数值上线前可由运营配置。

### 3.1 需求方（提交者）

| 事件 | 触发条件 | 建议积分 | 说明 |
|------|----------|----------|------|
| `ADAPTER_REQUEST_SUBMITTED` | 已登录用户成功创建 `AdapterRequest`，通过基础校验（非空、长度、域名合法、元素数≥1） | +5～+10 | 防刷：同日同站重复提交只给一次或递减 |
| `ADAPTER_REQUEST_ACCEPTED` | 管理员将状态从 `pending` → `processing` 且标记「已受理」 | +5 | 表示需求有价值进入处理 |
| `ADAPTER_REQUEST_COMPLETED` | 需求关联的适配器已上线（`SiteAdapter.isActive=true`）且关联到该请求 | +20～+50 | 核心激励闭环 |
| `ADAPTER_REQUEST_REJECTED` | 管理员拒绝且原因属于「无效/重复/广告」等 | 0 或 -5 | 慎用扣分，避免争议；建议一期仅 0 |

### 3.2 实现方（完成适配的人）

实现方可能是「管理员账号」或未来「受信任的社区贡献者」。需明确身份：

| 事件 | 触发条件 | 建议积分 | 说明 |
|------|----------|----------|------|
| `ADAPTER_IMPLEMENTED` | 某用户作为 `implementedByUserId` 创建或更新并上线适配器，且绑定 `adapterRequestId` | +30～+80 | 与难度挂钩可二期 |
| `ADAPTER_MERGED_CONTRIBUTION` | 将他人需求合并进既有适配器，仍记一次实现贡献 | 适当低于全新实现 | 可配置 |

### 3.3 质量与验证（二期预留）

- 用户点赞「适配有效」、或「回归不破坏」自动化检测通过 → 追加小额积分。
- 引入「信誉分」与「积分」分离，避免纯刷互动分。

---

## 4. 数据模型（新表设计草案）

> 表名为草案，落地时按 Prisma 命名风格统一；**不附 migration SQL**（由开发者执行 `prisma migrate`）。

### 4.1 `user_points_balance`（用户积分余额）

| 字段 | 类型 | 说明 |
|------|------|------|
| `userId` | PK/FK → `User.id` | 一对一 |
| `availablePoints` | Int | 可用积分 |
| `frozenPoints` | Int | 冻结（可选，一期可恒为 0） |
| `lifetimeEarned` | Int | 累计获得（便于展示荣誉） |
| `lifetimeSpent` | Int | 累计消耗（兑换开启后使用） |
| `updatedAt` | DateTime | 更新时间 |

### 4.2 `point_ledger`（积分流水）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | cuid | 主键 |
| `userId` | FK | 受益或被扣用户 |
| `delta` | Int | 正加负减 |
| `balanceAfter` | Int? | 可选快照 |
| `reasonCode` | String | 机器可读原因，如 `ADAPTER_REQUEST_COMPLETED` |
| `title` | String? | 对用户展示短标题 |
| `meta` | Json? | 结构化附加信息（requestId、adapterId 等） |
| `sourceType` | String | `adapter_request` / `site_adapter` / `admin_adjustment` 等 |
| `sourceId` | String? | 关联对象 ID |
| `actorUserId` | String? | 触发者；系统事件为空 |
| `idempotencyKey` | String | 唯一索引，防重 |
| `createdAt` | DateTime | 创建时间 |

**索引**：`(userId, createdAt desc)`、`idempotencyKey` 唯一。

### 4.3 `point_rule`（积分规则配置）

| 字段 | 说明 |
|------|------|
| `code` | 唯一，如 `REQUEST_SUBMIT` |
| `points` | 默认分值 |
| `enabled` | 开关 |
| `description` | 运营说明 |
| `capPerUserPerDay` | 可选上限 |

便于不改代码调分。

### 4.4 `adapter_request` 扩展字段（在现有表上增量）

在已有 `AdapterRequest`（或等价表）上建议增加：

| 字段 | 说明 |
|------|------|
| `implementedByUserId` | 可选，记录实现者（管理员或贡献者） |
| `linkedAdapterId` | 与 `SiteAdapter.id` 关联，闭环时写入 |
| `pointsAwardedSubmit` | Bool 或 Int 标记是否已发放提交分（防重复） |
| `pointsAwardedComplete` | 同上，闭环分 |

或用「幂等流水」单独保证，不必冗余字段；冗余字段仅优化查询。

### 4.5 `site_adapter` 扩展字段（可选）

| 字段 | 说明 |
|------|------|
| `derivedFromRequestId` | 由哪条需求生成（可空） |
| `implementedByUserId` | 实现者 |

---

## 5. 业务流程（与积分耦合）

### 5.1 提交需求（必须登录）

1. 扩展 / 官网调用 `POST /api/entry/adapter-requests`（需 Session 或 Bearer 与官网一致策略）。
2. 未登录 → **403**，扩展提示登录；**不产生积分**。
3. 校验通过后创建 `AdapterRequest`。
4. 在同一事务或紧接着的可靠任务中：
   - 写入 `point_ledger`（`ADAPTER_REQUEST_SUBMITTED`）；
   - 更新 `user_points_balance`；
   - 使用 `idempotencyKey = submit:${requestId}` 防重。

### 5.2 管理员受理

- `PATCH` 状态 → `processing` → 触发 `ADAPTER_REQUEST_ACCEPTED`（若规则启用）。

### 5.3 完成闭环（上线适配器）

1. 管理员在后台创建/更新 `SiteAdapter` 并 `isActive=true`，或从需求页「一键生成草稿适配器」。
2. 将 `AdapterRequest.linkedAdapterId` 与 `SiteAdapter.derivedFromRequestId` 互相关联。
3. 触发：
   - 提交者：`ADAPTER_REQUEST_COMPLETED`
   - 实现者：`ADAPTER_IMPLEMENTED`（若 `implementedByUserId` 存在且非系统账号）

**注意**：若实现者与提交者为同一人，是否叠加两条规则需产品决策（建议：允许叠加，但设日上限）。

### 5.4 拒绝与无效

- 仅更新请求状态 + 记录原因；
- 默认不扣分；若开启扣分，必须**规则可配置 + 用户协议更新 + 申诉入口**（建议二期）。

---

## 6. 防刷与风控

1. **同用户 + 同站点 + 短时间** 多次提交：只给首次提交分，或递减。
2. **内容质量门槛**：描述长度、元素数量、重复 selector 比例；过低不发分或标记人工审核。
3. **同需求重复绑定适配器**：`idempotencyKey` 绑定 `requestId + COMPLETE`。
4. **管理员加分**：单独 `reasonCode=ADMIN_ADJUSTMENT`，需二次确认与审计日志（谁在何时改了多少）。
5. **速率限制**：API 层按 IP + userId 限流。

---

## 7. API 设计（草案）

### 7.1 用户侧

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/entry/user/points` | 当前余额 + 近期流水摘要 |
| `GET` | `/api/entry/user/points/ledger` | 分页流水 |
| `POST` | `/api/entry/adapter-requests` | 已存在则强化「必须登录」与错误码 |

### 7.2 管理侧

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/admin/points/rules` | 规则列表 |
| `PATCH` | `/api/admin/points/rules/:code` | 调分、开关 |
| `POST` | `/api/admin/points/adjust` | 人工调整（强审计） |
| `GET` | `/api/admin/points/ledger` | 全站流水筛选 |

### 7.3 内部服务（可选）

- `POST /api/internal/points/emit` 仅服务端调用（若拆微服务）；一期可内联在业务 handler。

---

## 8. 页面与信息架构

### 8.1 用户官网

- **`/account` 增加「积分」卡片**：可用分、累计获得、最近流水 5 条 + 「查看全部」。
- **`/account/points`（新页）**：流水列表、筛选（获得/消耗）、说明文案（积分规则入口）。
- **适配需求相关**：若已有「我的请求」列表，在每条请求上展示「本请求已获积分 / 待闭环」等状态（可选）。

### 8.2 管理后台

- **`/admin/points`**：规则配置、人工调整、流水检索。
- **`/admin/adapter-requests`**（已有或增强）：受理、关联适配器、标记实现者、触发闭环事件。
- **`/admin/adapters`**：创建适配器时可选「来源需求」「实现者」。

### 8.3 扩展端

- 提交需求前强制登录（已有 OAuth 流程则拦截并引导）。
- 提交成功 toast 显示「+X 积分」（从接口返回 `pointsDelta`）。
- 「账号」Tab 简要展示积分；或跳转官网账户页。

---

## 9. 与登录、鉴权的一致性

1. **扩展提交**：与官网一致使用已登录态；未登录不得创建 `AdapterRequest`。
2. **官网提交**：同样必须登录；游客仅展示说明页。
3. **服务端**：`auth` 中间件已保护 `/api/entry/*`；需确保扩展桥接 token 与 session 策略统一，避免「一端能交一端不能」。

---

## 10. 事务与一致性

推荐模式（伪代码）：

```text
BEGIN;
  INSERT adapter_request ...;
  INSERT point_ledger ... ON CONFLICT (idempotency_key) DO NOTHING;
  IF inserted THEN
    UPDATE user_points_balance SET available = available + :delta;
END;
```

若流水未插入（冲突），则余额不变。

---

## 11. 国际化与合规

- 用户可见文案：积分规则、获得/扣除原因、申诉方式（若扣分）。
- 隐私：流水可隐藏敏感 `meta` 字段对外展示。
- 服务条款：说明积分非现金、平台保留解释权、异常回收条款。

---

## 12. 分阶段落地（建议）

| 阶段 | 内容 |
|------|------|
| **P0** | 表结构 + 余额 + 流水；提交需求必须登录；仅 `SUBMIT` 事件加分 |
| **P1** | 受理 / 闭环 / 实现者加分；管理后台规则页；账户页流水 |
| **P2** | 活动倍率、等级徽章、兑换权益、反作弊高级策略 |

---

## 13. 待产品拍板的开放问题

1. 实现者为「官方管理员账号」时，是否还给个人绑定积分，还是记入「官方运营池」？
2. 同一用户既是提交者又是实现者，积分是否封顶？
3. 积分是否过期？（建议一期不过期，降低争议）
4. 是否需要「撤销已上线适配器」时的积分冲正流程？

---

## 14. 验收标准（摘要）

- 未登录无法提交适配需求；接口返回明确错误码与文案。
- 每次符合条件的积分变动均有流水且余额一致；重复请求不重复加分。
- 用户可在账户页看到积分与原因；管理员可检索与人工调整并留痕。
- 需求闭环时，提交者与实现者（若配置）按规则获得对应积分。

---

## 15. 与当前代码库的关系说明

当前仓库已存在「适配需求」方向的部分实现（如 `AdapterRequest` 相关 API 草案、扩展提交流改造等）。本设计文档作为**上层产品规格**，落地时应：

1. 对齐现有表名与字段，必要时增量迁移；
2. 将积分发放点嵌入现有状态机（`pending → processing → completed`）；
3. 扩展与官网统一登录校验后再开放积分。

---

**文档结束。**
