import { getServerSession } from "#auth";
import prisma from "~~/server/lib/prisma";
import { success, serverError } from "~~/server/utils/result";
import { getAuthPayload } from "~~/server/utils/jwt";

/**
 * 扩展专用接口：返回用户选定的亮/暗主题色值
 * 鉴权优先级：
 *   1. NuxtAuth session（网页端登录状态）
 *   2. Authorization: Bearer <legacy-jwt>（扩展端登录状态，保持向后兼容）
 * 未登录时返回系统默认主题。
 */
export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  });

  try {
    let userId: string | null = null;

    // 1. 尝试 NuxtAuth session
    const session = await getServerSession(event);
    const sessionUser = session?.user as { id?: string } | undefined;
    if (sessionUser?.id) {
      userId = sessionUser.id;
    }

    // 2. Fallback：扩展携带的旧 JWT Bearer token
    if (!userId) {
      const payload = getAuthPayload(event);
      if (payload?.id) userId = payload.id;
    }

    let lightThemeName: string | null = null;
    let darkThemeName: string | null = null;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lightTheme: true, darkTheme: true },
      });
      lightThemeName = user?.lightTheme ?? null;
      darkThemeName = user?.darkTheme ?? null;
    }

    const [lightTheme, darkTheme] = await Promise.all([
      lightThemeName
        ? prisma.theme.findFirst({ where: { name: lightThemeName, isActive: true } })
        : prisma.theme.findFirst({ where: { mode: "light", isActive: true, isDefault: true }, orderBy: { sortOrder: "asc" } }),
      darkThemeName
        ? prisma.theme.findFirst({ where: { name: darkThemeName, isActive: true } })
        : prisma.theme.findFirst({ where: { mode: "dark", isActive: true, isDefault: true }, orderBy: { sortOrder: "asc" } }),
    ]);

    const parseColors = (t: any) => {
      if (!t?.colors) return null;
      try { return typeof t.colors === "string" ? JSON.parse(t.colors) : t.colors; } catch { return null; }
    };

    return success({
      isLoggedIn: !!userId,
      light: lightTheme ? { id: lightTheme.id, name: lightTheme.name, displayName: lightTheme.displayName, colors: parseColors(lightTheme) } : null,
      dark: darkTheme ? { id: darkTheme.id, name: darkTheme.name, displayName: darkTheme.displayName, colors: parseColors(darkTheme) } : null,
    });
  } catch (err: any) {
    return serverError("获取设置失败", err, "pub/extension-settings.get");
  }
});
