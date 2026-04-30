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

## 代码改动（摘要）

1. **`extension/src/content/engine.js`**  
   - 适配器预队列 `enqueueAdapter` / `registerAdapter`（别名）、`drainAdapterPreQueue`、`clearAdapterPreQueue`；`ThemeEngine.resetAdapters`、`registerAdapter` 按 `id` 去重。

2. **`extension/src/content/content.js`**  
   - 从 `chrome.storage.local.gtsRemoteAdapterScripts` 执行服务端下发的脚本；监听 `ADAPTERS_UPDATE` 热重载。

3. **`extension/src/background.js`**  
   - `syncAdapters()` 请求 `/api/pub/extension-adapters`，写入本地缓存并广播 `ADAPTERS_UPDATE`；安装、浏览器启动、`syncTheme` 时均会同步。

4. **`extension/manifest.json`**  
   - 不再打包 `adapters/bilibili.js`，改由服务端下发。

5. **`home/server/api/pub/extension-adapters.get.ts`**  
   - 公开返回全部 `isActive` 适配器的 `name` + `code` + `updatedAt`。

6. **`home/server/plugins/init-data.ts`**  
   - 空库种子：`code` 直接读取 `server/seeds/bilibili-adapter.fallback.js`（相对 `process.cwd()`），**不再**使用已删除的 resolve 工具。

7. **`home/server/utils/resolve-bilibili-adapter-code.ts`**  
   - **已删除**。

8. **`home/Dockerfile`**  
   - runner 仍复制 `server/seeds`（供运行时读取种子文件若需要；init-data 在构建/启动时读 cwd 下 seeds）。

## 维护说明

- **运行时**：扩展从服务端拉取已上线适配器的 `code`，不写死在插件包里；管理员在后台改库、`syncTheme`/重装扩展后即可下发新版本脚本。
- **空库种子**：`init-data` 将 `home/server/seeds/bilibili-adapter.fallback.js` 写入数据库初始记录；开发时请保持该 seeds 文件与 `extension/src/content/adapters/bilibili.js`（参考实现）一致。
- 已有数据库不会自动覆盖适配器 `code`；需管理员在后台更新或自行迁移。
