# 069 — 浏览器扩展：按本地时间的「自动」明暗模式

## 变更日期

2026-05-02

## 摘要

为 ForcedSkin 扩展新增主题模式 `auto`（界面文案「自动」）：根据用户本机本地时间，在固定时段使用亮色主题，其余时段使用暗色主题，无需跟随操作系统外观设置。

## 规则（与代码一致）

- 本地时间小时 `h` 满足 **6 ≤ h < 18**：解析为 **亮色**。
- 其余时段：解析为 **暗色**。
- `background.js` 与 `engine.js`（content）中的起止小时常量需保持同步；当前为 `AUTO_LOCAL_DAY_START_HOUR = 6`、`AUTO_LOCAL_DAY_END_HOUR = 18`。

## 实现要点

1. **`manifest.json`**：声明 `alarms` 权限；版本号递增至 `0.1.2`。
2. **`background.js`**：`THEME_MODES.AUTO`；`resolveEffectiveMode`；向页面投递的 `SETTINGS_UPDATE` 始终使用解析后的 `light` / `dark` / `off`；`chrome.alarms` 在下一 6:00 / 18:00 边界触发后向所有标签页广播刷新并重排闹钟。
3. **`engine.js` / `content.js`**：页面首屏与适配器重载时从 sync 读取的 `auto` 在同一规则下解析，避免后台尚未唤醒时样式错误。
4. **弹窗**：新增单选项、`effectiveMode` 用于预览配色；文案与中英文 `messages.json` 已更新。

## 说明

本方案为**按钟表时间的近似昼夜**，非天文日出日落；若未来需要地理纬度相关日落计算，需另行引入算法或配置项。
