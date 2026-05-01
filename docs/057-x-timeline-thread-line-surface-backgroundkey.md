# 057 — X 时间线回复竖线（surface.backgroundKey）

**日期**：2026-05-01  

## 现象

时间线/回复串中，头像列旁的**细竖条**依赖实心 `background-color`。全局引擎按亮度把深色底映射到 `surfaceMuted`、浅色底映射到 `surface`，竖条与卡片大面对比度不足，亮/暗强制主题下都像「消失」。

## 处理

1. **公式**：`surface` 层支持可选 **`backgroundKey`**（调色板键，默认仍为 `surface`）。X 适配器对稳定结构 `article [data-testid="Tweet-User-Avatar"] + div` 使用 **`backgroundKey: "border"`**，竖条使用与分隔线一致的 **`palette.border`**，相对卡片面更易辨认。
2. **实现**：`extension/src/content/adapter-formula.js`、`home/server/utils/adapter-formula.ts`。
3. **仓库配方**：`adapters/x.com.json` 增加上述 `surface` 层（置于层列表前部，在侧栏 richText 之前无妨）。

## 备注

- 若 X 改版 DOM，仅靠 `data-testid` 可能需增删选择器。
- 仍不明显时可改为 `muted` 或 `primary500`（视品牌对比度而定）。
