import prisma from "~~/server/lib/prisma";
import { success, error } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) return error("缺少主题 ID");

  try {
    const theme = await prisma.theme.findFirst({
      where: { id, isActive: true },
    });
    if (!theme) return error("主题不存在", null);
    return success(theme);
  } catch (err: any) {
    return error("获取主题失败", err.message);
  }
});
