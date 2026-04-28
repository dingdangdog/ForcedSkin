/**
 * server/utils/jwt.ts
 * 鉴权工具——基于 NuxtAuth (next-auth) Session
 *
 * server/middleware/auth.ts 已在请求进入时把 userId 写入 event.context。
 * 各 API handler 只需调用 getUserId(event) 即可。
 */

/** 获取当前请求的用户 ID（由 auth middleware 注入 event.context.userId） */
export const getUserId = (event: any): string | null => {
  return event.context.userId ?? null;
};

/** 获取当前用户的角色字符串（逗号分隔） */
export const getUserRoles = (event: any): string => {
  return event.context.userRoles ?? "";
};

/** 判断是否具有 admin 角色 */
export const hasAdminRole = (roles: string | null | undefined): boolean => {
  if (!roles) return false;
  return roles
    .split(",")
    .map((r) => r.trim())
    .includes("admin");
};

/**
 * @deprecated 原 JWT 解析函数，NuxtAuth 接管后不再使用
 *             保留仅用于兼容扩展的 Bearer Token（/api/pub/extension-settings）
 */
import jwtLib from "jsonwebtoken";
export interface AuthPayload {
  id: string;
  username?: string;
  name?: string;
  email?: string | null;
  roles?: string | null;
}
export const getAuthPayload = (event: any): AuthPayload | null => {
  let token =
    getHeader(event, "Authorization") || getCookie(event, "Authorization");
  if (token?.startsWith("Bearer ")) token = token.slice(7);
  const secretKey = useRuntimeConfig().authSecret;
  if (!token) return null;
  try {
    const decoded = jwtLib.verify(token, secretKey) as AuthPayload & { iat?: number; exp?: number };
    return { id: decoded?.id || "", roles: decoded?.roles ?? null };
  } catch {
    return null;
  }
};
