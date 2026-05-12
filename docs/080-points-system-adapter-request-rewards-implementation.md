# 080 — 积分体系与适配需求激励（实现记录）

**日期**：2026-05-11  
**依据设计**：[079-points-system-adapter-request-rewards.md](./079-points-system-adapter-request-rewards.md)  
**涉及**：`home`（Prisma、API、账户页、管理后台）、`extension`（提交反馈、账号 Tab）

---

## 1. 数据库（Prisma）

在 `home/prisma/schema.prisma` 中新增/扩展：

- **模型**：`UserPointsBalance`（`user_points_balances`）、`PointLedger`（`point_ledgers`，`idempotencyKey` 唯一）、`PointRule`（`point_rules`，`code` 主键）。
- **User**：可选关联 `pointsBalance`。
- **AdapterRequest**：`implementedByUserId`（可选）。
- **SiteAdapter**：`derivedFromRequestId`、`implementedByUserId`（可选）。

> 按仓库规则，**未**提交 Prisma migration SQL；请在本地执行 `pnpm exec prisma migrate dev`（或等价命令）生成并应用迁移。

---

## 2. 服务端逻辑

- **`server/lib/points.ts`**：默认规则种子、UTC 日切、同站每日首笔提交防刷、`applyPointsInTx`、受理/闭环发分、`tryAwardClosureForAdapterId`。
- **`server/middleware/auth.ts`**：`/api/entry` 在 Session 缺失时回退 **Bearer JWT**（与扩展 bridge 一致）；`/api/admin` 仍仅允许 Session 且需 admin 角色。
- **入口**：`POST api/entry/adapter-requests` 事务内创建需求并尝试发放 `ADAPTER_REQUEST_SUBMITTED`，响应含 `pointsDelta` / `pointsGranted`；域名校验增强。
- **用户**：`GET api/entry/user/points`、`GET api/entry/user/points/ledger`；`GET api/entry/user/adapter-requests` 增加每条 `pointsFromRequest`（同用户下与该请求 ID 关联的流水合计）。
- **管理**：`GET/PATCH api/admin/points/rules`、`POST api/admin/points/adjust`（需 `idempotencyKey`）、`GET api/admin/points/ledger`；`PATCH admin/adapter-requests/:id` 在状态变更后触发受理/闭环积分；`PATCH admin/adapters/:id` 支持 `derivedFromRequestId` / `implementedByUserId`，上线时同步需求关联并尝试闭环发分。

---

## 3. 前端（home）

- **`/account`**：积分卡片（可用分、累计获得、最近 5 条流水摘要，链至流水页）。
- **`/account/points`**：流水列表与获得/消耗筛选、分页。
- **`/admin/points`**：规则配置、人工调整、全站流水检索。
- **`layouts/admin.vue`**：导航增加「适配需求」「积分管理」。
- **`/admin/adapter-requests`**：关联适配器 ID、实现者用户 ID、「保存关联」与状态按钮协同。
- **`/admin/adapters`**：编辑弹窗增加来源需求 ID、实现者用户 ID。

---

## 4. 扩展（extension）

- 提交需求成功时根据 `pointsDelta` 展示 `submitOkWithPoints` 文案。
- **账号 Tab**：通过 `GET_USER_POINTS` 拉取可用分并展示 `accountPointsSummary`。
- 文案：`zh_CN` / `en` 的 `submitOkWithPoints`、`accountPointsSummary`。

---

## 5. 验收对齐（079 摘要）

- 未登录：`/api/entry` 无 Session 且无合法 Bearer 时仍 403；扩展需先 OAuth。
- 积分变动有流水 + 余额双写；幂等键避免重复加分。
- 用户账户页可看积分与原因摘要；管理员可检索流水与人工调整（审计写入 `meta` / `actorUserId`）。
- 闭环：需求关联已上线适配器且（可选）配置实现者时，按规则发放提交者闭环分与实现者分（幂等防重）。
