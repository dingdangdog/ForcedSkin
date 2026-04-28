import prisma from "~~/server/lib/prisma";
import { success, error } from "~~/server/utils/result";

/**
 * 返回系统默认的亮色和暗色主题，供 theme store 初始化使用。
 * theme store 期望格式：{ d: { light: Theme, dark: Theme } }
 */
export default defineEventHandler(async (event) => {
  try {
    const [light, dark] = await Promise.all([
      prisma.theme.findFirst({
        where: { mode: "light", isActive: true, isDefault: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.theme.findFirst({
        where: { mode: "dark", isActive: true, isDefault: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return success({ light, dark });
  } catch (err: any) {
    return error("获取默认主题失败", err.message);
  }
});
