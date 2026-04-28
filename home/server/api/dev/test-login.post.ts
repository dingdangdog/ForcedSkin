/**
 * ⚠️ TODO: 测试登录接口 — 测试通过后删除整个文件
 *
 * 开发专用：接受 userId，直接签发 NuxtAuth JWT cookie，跳过 OAuth 流程。
 * 生产环境不可用（返回 404）。
 */
import { encode } from "next-auth/jwt";
import prisma from "~~/server/lib/prisma";

export default defineEventHandler(async (event) => {
  // ⚠️ 仅开发环境可用
  const config = useRuntimeConfig();
  if (config.env === "production") {
    throw createError({ statusCode: 404, message: "Not found" });
  }

  const body = await readBody<{ userId: string }>(event);
  const userId = body?.userId;
  if (!userId) throw createError({ statusCode: 400, message: "userId is required" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw createError({ statusCode: 404, message: "User not found" });

  const now = Math.floor(Date.now() / 1000);
  const token = await encode({
    token: {
      sub: user.id,
      name: user.name,
      email: user.email ?? "",
      picture: user.avatar ?? "",
      // 自定义扩展字段（与 jwt callback 保持一致）
      id: user.id,
      roles: user.roles ?? "user",
      provider: "test",
      iat: now,
      exp: now + 86400,  // 1 天
    },
    secret: config.authSecret,
    maxAge: 86400,
  });

  // next-auth v4 默认 cookie 名（非 https 环境）
  const cookieName = "next-auth.session-token";
  setCookie(event, cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
    secure: false,
  });

  return { ok: true, userId: user.id, name: user.name, roles: user.roles };
});
