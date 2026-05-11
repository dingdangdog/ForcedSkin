import prisma from "~~/server/lib/prisma";
import { success, error, noLogin, serverError } from "~~/server/utils/result";
import { getUserId } from "~~/server/utils/jwt";

/**
 * 删除自己的待审核适配器提交（仅允许删除 isActive=false 的）
 */
export default defineEventHandler(async (event) => {
  const userId = getUserId(event);
  if (!userId) return noLogin("未登录");

  const id = getRouterParam(event, "id");
  if (!id) return error("缺少 ID");

  try {
    const adapter = await prisma.siteAdapter.findUnique({ where: { id } });
    if (!adapter) return error("适配器不存在");
    if (adapter.submitterId !== userId) return error("无权删除他人提交");
    if (adapter.isActive) return error("已上线的适配器不可删除，请联系管理员");

    await prisma.siteAdapter.delete({ where: { id } });
    return success({ deleted: true });
  } catch (err: any) {
    if (err.code === "P2025") return error("适配器不存在");
    return serverError("删除失败", err, "entry/user/adapters/[id].delete");
  }
});
