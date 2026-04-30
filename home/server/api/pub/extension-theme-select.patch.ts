import prisma from "~~/server/lib/prisma";
import { success, error, serverError } from "~~/server/utils/result";
import { getAuthPayload } from "~~/server/utils/jwt";

/**
 * 扩展端使用 Bearer JWT 更新账号的亮/暗主题（网页端 entry 路由仅认 NuxtAuth session）。
 */
export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  });

  if (event.method === "OPTIONS") {
    return null;
  }

  const payload = getAuthPayload(event);
  if (!payload?.id) {
    return error("未登录");
  }

  const body = await readBody(event);
  const lightTheme = body?.lightTheme as string | undefined;
  const darkTheme = body?.darkTheme as string | undefined;

  if (!lightTheme && !darkTheme) {
    return error("至少提供一个主题名称");
  }

  try {
    if (lightTheme) {
      const t = await prisma.theme.findFirst({
        where: { name: lightTheme, mode: "light", isActive: true },
      });
      if (!t) {
        return error("亮色主题不存在");
      }
    }
    if (darkTheme) {
      const t = await prisma.theme.findFirst({
        where: { name: darkTheme, mode: "dark", isActive: true },
      });
      if (!t) {
        return error("暗色主题不存在");
      }
    }

    const updateData: Record<string, string> = {};
    if (lightTheme !== undefined) {
      updateData.lightTheme = lightTheme;
    }
    if (darkTheme !== undefined) {
      updateData.darkTheme = darkTheme;
    }

    await prisma.user.update({
      where: { id: payload.id },
      data: updateData,
    });
    return success({
      lightTheme: updateData.lightTheme,
      darkTheme: updateData.darkTheme,
    });
  } catch (err: any) {
    return serverError("更新失败", err, "pub/extension-theme-select.patch");
  }
});
