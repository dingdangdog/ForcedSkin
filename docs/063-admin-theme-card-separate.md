# 063 后台主题列表独立预览卡片 AdminThemeCard

**日期：** 2026-05-01

## 变更说明

1. 新增 `home/app/components/theme/AdminThemeCard.vue`：专用于管理后台主题列表左侧缩略预览。
   - 相对前台 `ThemeCard`：**加宽**（列表中与右侧信息列搭配，父级约 `17.5rem`）、**降低垂直高度**（收紧内边距、精简模拟 UI，色条改为右侧竖排圆点）。
   - **不含**底部信息区（显示名、描述、模式角标等），避免与列表行右侧已有元信息重复。

2. `home/app/pages/admin/themes.vue`：列表项左侧由 `ThemeCard as-preview` 改为 `AdminThemeCard`；新建/编辑弹窗内「前台效果预览」仍使用 `ThemeCard`，以便对照前台真实卡片。

## 涉及文件

- `home/app/components/theme/AdminThemeCard.vue`（新）
- `home/app/pages/admin/themes.vue`
