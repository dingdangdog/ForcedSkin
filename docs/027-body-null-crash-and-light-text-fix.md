# 027 首屏报错与亮色浅字修复

时间：2026-04-27

## 问题 1：`getComputedStyle` 报错

在 `document_start` 阶段，部分页面 `document.body` 尚未就绪，导致调用 `getComputedStyle(document.body)` 抛出：

- `TypeError: parameter 1 is not of type 'Element'`

## 修复

更新 `src/content/engine.js`：

1. 新增 `resolveDocumentBgColor()`
   - 优先读取 `document.body`
   - 若不存在则回退到 `document.documentElement`
   - 再回退到白色默认值，确保始终返回可用颜色
2. `applyGlobalRewriteToElements` 不再直接读取 `document.body`，改为通过 `resolveDocumentBgColor()` 获取兜底背景色。

## 问题 2：亮色模式仍有浅色文字

根因是部分站点原本深色主题，文本为浅色；当容器背景已被插件改成亮色时，文字对比判定仍基于“旧背景”，导致未触发纠正。

## 修复

在同一处逻辑中，若元素背景被重写为主题背景，则文本对比直接基于“新背景色”判定，低对比时强制纠正到主题前景色/链接色。

## 结果

- 消除首屏 `getComputedStyle` 崩溃
- 亮色模式下，深色站点迁移过来的浅色文字会被更稳定地纠正
