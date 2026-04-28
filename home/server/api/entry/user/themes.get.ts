import prisma from "~~/server/lib/prisma";
import { success, error } from "~~/server/utils/result";
import { getUserId } from "~~/server/utils/jwt";

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event);
  if (!userId) return error("未登录");

  try {
    const favorites = await prisma.userThemes.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const themeIds = favorites.map((f) => f.themeId);
    if (themeIds.length === 0) return success([]);

    const themes = await prisma.theme.findMany({
      where: { id: { in: themeIds }, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return success(themes);
  } catch (err: any) {
    return error("获取收藏主题失败", err.message);
  }
});
