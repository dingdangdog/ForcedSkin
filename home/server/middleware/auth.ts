import { getServerSession } from "#auth";
import { noLogin } from "~~/server/utils/result";
import { getAuthPayload } from "~~/server/utils/jwt";

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

  if (sessionUser?.id) {
    event.context.userId = sessionUser.id;
    event.context.userRoles = sessionUser.roles ?? "user";
  } else if (under(pathname, "/api/entry")) {
    // 扩展端 Bearer JWT（与 extension auth bridge 一致）
    const payload = getAuthPayload(event);
    if (payload?.id) {
      event.context.userId = payload.id;
      event.context.userRoles = payload.roles ?? "user";
    } else {
      return noLogin("未登录或登录已失效");
    }
  } else {
    return noLogin("未登录或登录已失效");
  }

  // admin 路由额外校验（仅 Session；后台操作不使用扩展 JWT）
  if (under(pathname, "/api/admin")) {
    if (!sessionUser?.id) {
      return noLogin("需要登录管理后台");
    }
    const roles: string = sessionUser.roles ?? event.context.userRoles ?? "";
    if (!roles.split(",").map((r) => r.trim()).includes("admin")) {
      return noLogin("需要管理员权限");
    }
  }
});
