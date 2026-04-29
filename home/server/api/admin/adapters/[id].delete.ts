import prisma from "~~/server/lib/prisma";
import { success, error, serverError } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) return error("缺少 ID");

  try {
    await prisma.siteAdapter.delete({ where: { id } });
    return success(null);
  } catch (err: any) {
    if (err.code === "P2025") return error("适配器不存在");
    return serverError("删除失败", err, "admin/adapters/[id].delete");
  }
});
