# 041 — 适配器改为服务端下发 + 扩展本地缓存

**日期**：2026-04-30  

## 问题

此前 B 站等适配器脚本打在扩展 `manifest` 里随版本发布；服务端 `SiteAdapter` 入库脚本又与仓库遍历耦合，无法达成「后台改规则、用户不重装扩展」的目标。

## 方案

1. **接口**：`GET /api/pub/extension-adapters`  
   - 返回全部 `isActive === true` 的 `{ name, code, updatedAt }`，供扩展拉取；已与其它 `/api/pub/**` 一样放行 CORS。

2. **扩展后台**（`background.js`）  
   - `syncAdapters()`：拉取接口 → `chrome.storage.local["gtsRemoteAdapterScripts"]`  
   - 触发时机：`chrome.runtime.onInstalled`、`chrome.runtime.onStartup`、`syncTheme`（同步主题前）  
   - 成功后对所有网页 Tab 发送 `ADAPTERS_UPDATE`。

3. **内容脚本**（`content.js`）  
   - 读取缓存，`JSON.parse` 后交给 **`adapter-formula.js` 解释器**（`__GTS_ADAPTER_FORMULA__.install`）；**禁止** `new Function` 执行服务端内容。  
   - 收到 `ADAPTERS_UPDATE` 时：`resetAdapters` → 重新解析缓存中的公式 → 按当前主题重跑。

4. **引擎**（`engine.js`）  
   - 预队列、`ThemeEngine.resetAdapters`、`registerAdapter` 按 `id` 去重。

5. **manifest**  
   - 加载顺序：`engine.js` → `adapter-formula.js` → `content.js`；站点逻辑不在扩展包内硬编码。

6. **初始化**（`init-data.ts`）  
   - 读取 `server/seeds/bilibili-adapter.formula.json` 的 JSON 文本写入首条 B 站 `SiteAdapter.code`。

7. **Dockerfile**  
   - runner 复制 `server/seeds`（含 `.formula.json`）。

## 运营侧操作

- 更新适配逻辑：在后台编辑适配器 **`code`（JSON 公式）** 并保存；用户下次同步主题或重启浏览器即可拉到新公式。  
- 新库部署：`init-data` 写入 B 站公式种子。
