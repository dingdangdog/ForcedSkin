import prisma from "~~/server/lib/prisma";
import { success, noLogin, serverError } from "~~/server/utils/result";
import { getUserId } from "~~/server/utils/jwt";

/**
 * 获取当前用户的适配器提交列表（含审核状态）
 * 扩展端和网页端共用此接口
 */
export default defineEventHandler(async (event) => {
  const userId = getUserId(event);
  if (!userId) return noLogin("未登录");

  try {
    const adapters = await prisma.siteAdapter.findMany({
      where: { submitterId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        siteDomain: true,
        code: true,
        isActive: true,
        rejectionReason: true,
        source: true,
        createdAt: true,
        updatedAt: true,
        reviewedAt: true,
      },
    });

    return success(adapters);
  } catch (err: any) {
    return serverError("获取我的适配器列表失败", err, "entry/user/adapters.get");
  }
});
