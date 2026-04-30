# 040 — 适配器「着色分层」规范、指南对齐与 B 站种子同步入库

**日期**：2026-04-30  

## 背景

- 适配器规范散落在旧文档与指南页中，部分描述与当前引擎实现不一致（例如 `priority` 顺序、`onDomChange`、`markApplied` 自定义字符串、`palette.primary` 形状等）。
- 希望将「哪些区域用什么 palette 字段」收敛为可复述的**分层公式**，便于社区适配器一致实现。
- 数据库初始化中的 B 站适配器长期为占位注释，应与扩展内真实脚本一致。

## 引擎事实摘要（与实现对齐）

1. **`priority`**：`resolveAdapters()` 按数值**升序**排序，**越小越早**执行；`registerAdapter` 默认填满 `priority: 50`，站点适配建议 `100`。
2. **`apply(ctx)`**：当前仅传入 `{ queryAllDeep, palette, markApplied }`；DOM 变更由引擎 `MutationObserver` + `refreshAdaptersDebounced` 处理，**无** `onDomChange`。
3. **`palette`**：为扁平对象（含 `primary500` / `primary700`），来自官网 JSON 经 `normalizeRemoteColors` 映射。
4. **`markApplied`**：仅 `MARK_BG` / `MARK_TEXT` / `MARK_BORDER`（即 `"bg"` / `"text"` / `"border"`）会被 `clearAppliedStyles` 识别；自定义记号无法清除对应 inline 样式。
5. **全局不改色**：`shouldSkipElement` 覆盖媒体节点、背景图、遮罩类 class、`data-gts-ignore` Subtree 等（详见 `extension/src/content/engine.js`）。

## 「着色分层」固定公式（StyleLayer）

规范化为五类语义分层（**按组件语义选用 palette，而非按 DIV 标签名**）：

| kind | 用途 | 典型映射 | markApplied |
|------|------|----------|-------------|
| surface | 面板/列表/导航容器 | bg=surface, fg=foreground, border=border | bg + text + border |
| accent | 选中/激活 | bg+border=primary700, fg=background | bg + text + border |
| canvas | 大面积底图区 | 去 background-image，bg=background | 通常 bg |
| richText | 站内富文本变量 | 站点自定义 CSS 变量 + fg | 多为 text |
| svgShapes | SVG 形状 | fill/stroke→currentColor | 可不标记 |

适配器内应对 **半透明遮罩、播放器相关叠层** 等做额外 `skip`，与引擎跳过逻辑对齐。

## 代码改动

1. **`extension/src/content/adapters/bilibili.js`**  
   - 用 `styleLayers` 数组 + `applyStyleLayers` 实现上述分层；文件头注释写明公式表与跳过规则。

2. **`home/server/seeds/bilibili-adapter.fallback.js`**  
   - 与扩展脚本逻辑保持一致（含一行「镜像」说明）；供无 monorepo 路径时的种子读取。

3. **`home/server/utils/resolve-bilibili-adapter-code.ts`**  
   - 向上遍历目录与 `process.cwd()`，优先读取 `extension/src/content/adapters/bilibili.js`；失败则读 `server/seeds/bilibili-adapter.fallback.js`。

4. **`home/server/plugins/init-data.ts`**  
   - 空库写入 B 站适配器时，`code` 使用 `resolveBilibiliAdapterCode()`，与扩展规则同步。

5. **`home/Dockerfile`**  
   - runner 阶段增加 `COPY ... /app/server/seeds`，保证生产镜像内可读到 fallback 文件。

6. **`home/app/pages/guide/adapter.vue`**  
   - 修正工作原理、`priority`、`match`、palette、`markApplied` 描述；删除不存在的 `onDomChange`；新增「着色分层公式」章节。

## 维护说明

- 修改 B 站适配器时：**先改** `extension/src/content/adapters/bilibili.js`，再将同名逻辑同步到 `home/server/seeds/bilibili-adapter.fallback.js`（空库种子与环境无扩展目录时依赖后者）。
- 已有数据库不会自动覆盖适配器 `code`；需管理员在后台更新或自行迁移。
