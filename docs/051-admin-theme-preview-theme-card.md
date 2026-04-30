# 051 后台主题审核：前台同款预览卡片

**日期：** 2026-04-30

**变更：**

1. `ThemeCard` 增加可选属性 `asPreview`：静态展示、不触发选中、不显示收藏与已选角标，用于后台。
2. 后台「主题管理」列表每条左侧改为与前台一致的 `ThemeCard` 缩略预览（窄列宽度），替代原四格色块。
3. 新建/编辑弹窗大屏下双栏：左侧表单，右侧 sticky「前台效果预览」实时随 JSON、名称、模式更新。

**涉及文件：** `home/app/components/theme/ThemeCard.vue`、`home/app/pages/admin/themes.vue`
