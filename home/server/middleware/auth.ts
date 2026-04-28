import { getServerSession } from "#auth";
import { noLogin } from "~~/server/utils/result";
import prisma from "~~/server/lib/prisma";

function normalizePath(pathname: string): string {
  return (pathname.replace(/\/+$/, "") || "/").toLowerCase();
}

function under(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export default defineEventHandler(async (event) => {
  if (event.method === "OPTIONS") return;

  const pathname = normalizePath(getRequestURL(event).pathname);

  const needsAuth =
    under(pathname, "/api/entry") || under(pathname, "/api/admin");

  if (!needsAuth) return;

  // 通过 NuxtAuth 获取当前 session
  const session = await getServerSession(event);
  const sessionUser = session?.user as
    | { id: string; roles?: string }
    | undefined;

  if (!sessionUser?.id) {
    return noLogin("未登录或登录已失效");
  }

  // 把 userId 写入 context，下游 handler 直接用 event.context.userId
  event.context.userId = sessionUser.id;
  event.context.userRoles = sessionUser.roles ?? "user";

  // admin 路由额外校验
  if (under(pathname, "/api/admin")) {
    const roles: string = sessionUser.roles ?? event.context.userRoles ?? "";
    if (!roles.split(",").map((r) => r.trim()).includes("admin")) {
      return noLogin("需要管理员权限");
    }
  }
});
