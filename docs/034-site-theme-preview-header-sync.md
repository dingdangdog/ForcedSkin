# 034 — 主题市场站内预览与页眉配色同步

**日期**：2026-04-30  
**范围**：`home`

## 现象

在主题市场点击主题卡片「预览/选用」时，`ThemeCard` 内的模拟界面颜色正确，但全站页眉中的站点名（`ForcedSkin`、`text-foreground`）仍沿用默认主题的 CSS 变量。

## 原因

页眉使用 Tailwind 语义色（如 `text-foreground` → `rgb(var(--color-foreground) / …)`），变量由 `theme` Pinia store 的 `applyThemeToDocument()` 写入。

`themes.light` / `themes.dark` 仅在 `fetchThemeConfig()`（`/api/themes/defaults`）时填充为**系统默认**两套主题；用户在商城选中主题虽会 PATCH 账号偏好，但**从未把选中主题的 `colors` 写回 store**，因此 `:root` 上的变量一直是默认绿系，`applyThemeColors` 未用上商城主题。

## 修改

1. **`app/stores/theme.ts`**
   - `applySitePaletteFromThemeRow(row)`：将 API/列表中的一条主题解析为 `ThemeEntry`，写入 `themes.value[light|dark]` 并同步 `themeNames`。
   - `previewThemeOnSite(row)`：调用上述方法，并将 `currentMode` 切到该主题的 `mode`，保证当前界面看到的是正在预览的那一套。

2. **`app/pages/themes.vue`**
   - `selectTheme`：先 `previewThemeOnSite(theme)`，未登录也可本地预览；已登录再 PATCH。
   - `syncStorePalettesFromPrefs()`：拉取列表与用户 `lightTheme`/`darkTheme` 后，把两套配色写入 Pinia，刷新进页即可与账号一致。

3. **`app/pages/account.vue`**
   - 收藏列表里点选主题时同样先 `previewThemeOnSite`，与商城行为一致。

`theme.client.ts` 无需改动；初始化逻辑不变，问题在数据未写入 store。
