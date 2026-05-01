# 056 — svgRecolor 支持 fill/stroke 调色板键（X 侧栏 SVG）

**日期**：2026-05-01  

## 背景

`richText` 仅处理 `HTMLElement`，无法给 `svg` 写 `color`；原 `svgRecolor` 固定为 `fill`/`stroke: currentColor`，在 X 等站会在 `svg` 上另写 `color`，导致图标长期呈浅灰。

## 改动

- **`extension/src/content/adapter-formula.js`**：`svgRecolor` 可选字段 **`fill`**、**`stroke`**，值为调色板键名（与 `richText.color` 同源）时，写入对应颜色的 `!important`；省略时行为与旧版相同，仍为 `currentColor`。
- **`home/server/utils/adapter-formula.ts`**：校验 `fill`/`stroke` 若存在则须为合法调色板键。
- **`adapters/x.com.json`**：侧栏 `svg path` 使用 `"fill": "foreground", "stroke": "foreground"`，不依赖 `svg` 上的继承色。

## 兼容

未写 `fill`/`stroke` 的公式（如 B 站种子）行为不变。
