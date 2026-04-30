# 036 — Dockerfile 对齐当前构建系统（pnpm + Nuxt 产物）

**日期**：2026-04-30  
**文件**：`home/Dockerfile`

## 调整目的

- 现有项目使用 `pnpm-lock.yaml`，原 Dockerfile 仍按 `npm` 安装依赖，不符合当前可重复构建策略。
- 原镜像内置了数据库与认证类默认值（含敏感信息示例），不适合作为通用打包配置。

## 主要改动

1. **对齐包管理器**
   - 构建阶段改为 `corepack enable + pnpm install --frozen-lockfile`。
   - 仅复制 `package.json` 与 `pnpm-lock.yaml` 用于依赖层缓存。

2. **保留多阶段构建**
   - `builder` 负责安装依赖与 `pnpm build`。
   - `runner` 只保留 Nuxt 运行所需文件：`.output`、`package.json`、`prisma`、`prisma.config.ts`。

3. **精简并安全化环境变量**
   - 保留通用运行变量：`TZ`、`NODE_ENV`、`HOST`、`PORT`、`NUXT_RESOURCE`。
   - 移除镜像内写死的数据库连接、认证密钥、OAuth 配置，改为运行时由部署环境注入。

4. **运行配置规范化**
   - 使用非 root 用户 `nuxtjs` 运行。
   - 暴露端口 `7061`，启动命令保持 `node .output/server/index.mjs`。

## 结果

新的 Dockerfile 已与当前项目的依赖管理和打包产物路径保持一致，更适合在 CI/CD 与生产环境中直接复用。
