# 061 — 后台适配器/主题代码一键复制

## 变更

- 新增 `home/app/utils/clipboard.ts`：`copyTextToClipboard()` 封装 `navigator.clipboard.writeText`，失败返回 `false`。
- `home/app/pages/admin/adapters.vue`：「查看代码」弹窗标题栏增加 **复制代码**，沿用现有 `showToast` 提示。
- `home/app/pages/admin/themes.vue`：编辑/新建弹窗中「色彩配置 JSON」区域增加 **复制 JSON**，复制当前表单中的 `form.colors`。
