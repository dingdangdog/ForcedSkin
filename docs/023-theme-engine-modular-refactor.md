# 023 主题引擎模块化重构

时间：2026-04-27

## 目标

将“补丁式规则堆叠”升级为“引擎化、模块化、可扩展”的统一主题系统，覆盖内联写死、动态加载、SVG、Shadow DOM 等共性问题。

## 架构变更

1. 新增引擎层 `src/content/engine.js`
   - 统一调色板与模式管理（亮/暗/关闭）
   - 统一根变量映射（`--text*`、`--bg*`、`--line*`）
   - 全域改写策略：
     - 深度遍历（包含 `shadowRoot`）
     - 文本/背景/边框对比度驱动改写
     - SVG `fill/stroke` 统一为 `currentColor`
     - 动态变更监听（MutationObserver + 节流）
2. 新增站点适配层 `src/content/adapters/bilibili.js`
   - B站域名命中后执行强化规则
   - 通过前缀类族和哈希类族统一覆盖，减少单点补丁
3. 启动层 `src/content/content.js`
   - 仅负责引擎初始化、注册适配器、监听设置更新
4. 更新 `manifest.json`
   - 内容脚本按顺序注入：
     - `engine.js`
     - `adapters/bilibili.js`
     - `content.js`

## 结果

从“按模块逐条打补丁”切换到“按原因统一处理 + 站点补充”的体系化实现，后续新增网站或模块时可复用同一引擎逻辑，维护成本显著降低。
