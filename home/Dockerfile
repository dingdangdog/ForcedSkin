# syntax=docker/dockerfile:1

# 多阶段构建 Dockerfile for Nuxt 4 + Prisma
FROM node:22.21.1-alpine3.22 AS builder

WORKDIR /app

# Prisma/Node 运行所需基础依赖
RUN apk add --no-cache openssl libc6-compat

# 使用项目锁文件做可重复构建
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# 拷贝源码并构建
COPY . .
RUN pnpm build

# 生产运行镜像
FROM node:22.21.1-alpine3.22 AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

# 创建非 root 用户
RUN addgroup -S nodejs && adduser -S nuxtjs -G nodejs

# 复制运行所需产物
COPY --from=builder --chown=nuxtjs:nodejs /app/.output ./.output
COPY --from=builder --chown=nuxtjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nuxtjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nuxtjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nuxtjs:nodejs /app/server/seeds ./server/seeds

# 切换到非 root 用户
USER nuxtjs

# 暴露端口
EXPOSE 7061

# 设置环境变量
ENV TZ=Asia/Shanghai
ENV NODE_ENV=production
ENV PORT=7061

# 数据库配置（可通过 docker-compose 覆盖）
ENV DATABASE_MODE=postgre
ENV DATABASE_URL="postgresql://postgres:123456@localhost:5432/loden?schema=public"

# 资源路径配置
ENV NUXT_RESOURCE=/app/resources

# 认证配置（可通过 docker-compose 覆盖）
ENV NUXT_AUTH_BASE_URL="https://forcedskin.com/api/auth"
ENV NUXT_AUTH_SECRET="login123"
ENV NUXT_SITE_URL="salt123"
# ENV NUXT_SALT="salt123"
# ENV NUXT_TOKEN_SECRET=""


# 网站配置（可通过 docker-compose 覆盖）
ENV NUXT_PUBLIC_SITE_URL=""
ENV NUXT_PUBLIC_API_BASE=/

# OAuth 配置（可通过 docker-compose 覆盖）
ENV GITHUB_CLIENT_ID=""
ENV GITHUB_CLIENT_SECRET=""
ENV GOOGLE_CLIENT_ID=""
ENV GOOGLE_CLIENT_SECRET=""

# 启动应用
CMD ["node", ".output/server/index.mjs"]
