import prisma from "~~/server/lib/prisma";
import { success, error } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) return error("缺少 ID");

  try {
    await prisma.theme.delete({ where: { id } });
    return success(null);
  } catch (err: any) {
    if (err.code === "P2025") return error("主题不存在");
    return error("删除失败", err.message);
  }
});
