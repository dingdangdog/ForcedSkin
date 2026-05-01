# 064 适配器管理后台编辑

**日期：** 2026-05-01

## 变更说明

`home/app/pages/admin/adapters.vue` 增加后台编辑能力，与已有 `PATCH api/admin/adapters/[id]` 字段对齐：

- 弹窗表单可修改：显示名称、域名（逗号分隔）、描述、排序、适配公式代码。
- `name` 标识只读展示（数据库唯一键，接口未支持修改）。
- 列表操作「查看代码」改为「编辑」，在弹窗内保留「复制代码」与指向 `/guide/adapter` 的规范链接。
- 保存失败时 Toast 提示检查公式有效性（与服务端 `validateAdapterFormulaCodeString` 一致）。

## 涉及文件

- `home/app/pages/admin/adapters.vue`
