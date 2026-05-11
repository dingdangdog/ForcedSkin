# 071 — 适配器统一审核队列与合并流程补全

**日期**：2026-05-11  
**涉及子项目**：`home`、`extension`

---

## 背景说明

用户询问是否需单独「用户申请表」、官网与扩展提交是否统一、同站多适配器合并如何实现。经代码核对：

- **数据模型**：社区/扩展提交的适配器与已上线记录共用 `SiteAdapter` 表；`isActive=false` 且 `rejectionReason` 为空表示**待审核**，`source` 区分 `website` / `extension`。无需额外表即可统一审核与列表查询。
- **合并能力**：`POST /api/admin/adapters/merge` 已将源公式层合并进目标；此前后台界面仅在「已上线」行提供合并，且**平铺列表**缺少合并按钮；**待审核**稿件无法一键并入已有已上线适配器，与产品预期不符。

---

## 变更清单

### 1. 管理端 `GET /api/admin/adapters?status=pending`

**文件**：`home/server/api/admin/adapters.get.ts`

- `pending` 条件增加 `rejectionReason: null`，与页面「待审核」Tab 一致，避免控制台待审数量把「已拒绝」算入。

### 2. 管理端适配器页

**文件**：`home/app/pages/admin/adapters.vue`

- 新增 `hasOtherActiveOnSameDomain`，仅在存在**其他**同域名已上线适配器时显示合并类操作。
- **待审核**行增加「并入已上线…」，调用与已上线相同的 `openMerge`，将待审稿合并进选中的已上线目标（后端逻辑已支持）。
- **已上线**行仅在存在其他已上线同域记录时显示「合并到…」，避免无效入口。
- **平铺（非分组）**视图补齐上述按钮，与分组视图行为一致。
- 合并弹窗文案更新，说明待审核可直接并入已上线。

### 3. 官网适配器投稿页

**文件**：`home/app/pages/adapters.vue`

- 提交时显式传 `source: "website"`。
- 根据 `POST /api/entry/adapters` 返回的 `existingAdapters` 切换提示文案（与扩展端语义对齐）。

### 4. i18n

**文件**：`home/i18n/locales/zh.json`、`home/i18n/locales/en.json`

- `adapters.submit_ok_existing`：当域名下已有已上线适配器时的提交成功说明。

### 5. 扩展构建器提交反馈

**文件**：`extension/src/popup/popup.js`、`extension/_locales/zh_CN/messages.json`、`extension/_locales/en/messages.json`

- 若返回含 `existingAdapters`，状态栏展示 `submitOkExisting`。

### 6. 账号页来源展示

**文件**：`home/app/pages/account.vue`

- 非 `extension` 来源显示「官网提交」，与「扩展提交」对称。

---

## 后续可选优化（未在本变更中实现）

- **两则均为待审、且尚无已上线**：仍需先上线其一或手工编辑，再合并；若需「待审+待审」自动合成，要在产品与数据层单独设计。
- **域名规范化**：`siteDomain` 字符串不完全一致时，同站分组/合并提示可能分散；可对主域名做规范化索引或归一化展示。
