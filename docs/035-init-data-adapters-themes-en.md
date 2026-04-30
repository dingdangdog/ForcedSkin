# 035 — 初始化数据：精简适配器与英文主题（含 Sakura Pink）

**日期**：2026-04-30  
**文件**：`home/server/plugins/init-data.ts`

## 适配器

- 仅在 `siteAdapter.count() === 0` 时写入 **一条** B 站适配器。
- `displayName` / `description` 改为英文；`code` 仍为占位注释（可由扩展构建链路替换为真实脚本）。

## 主题

- 仍为「空库时才种子」，但条目改为 **3 条**：
  1. **light-mint** — `Mint Light`，英文描述；默认亮色。
  2. **light-sakura** — `Sakura Pink`，用户提供粉色 JSON（完整 primary / secondary / accent 色阶）。
  3. **dark-forest** — `Forest Dark`，英文描述；默认暗色。
- 原有中文 `displayName` / `description` 全部改为英文。

## 说明

已存在数据的库不会自动删适配器或改主题；需自行清空相关表或换新库才会重新跑种子。
