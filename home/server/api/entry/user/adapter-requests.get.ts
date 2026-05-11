import prisma from "~~/server/lib/prisma";
import { noLogin, serverError, success } from "~~/server/utils/result";
import { getUserId } from "~~/server/utils/jwt";

export default defineEventHandler(async (event) => {
  const userId = getUserId(event);
  if (!userId) return noLogin("未登录");

  try {
    const list = await prisma.adapterRequest.findMany({
      where: { submitterId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        siteDomain: true,
        selectedElements: true,
        feedback: true,
        status: true,
        source: true,
        adminNote: true,
        adapterId: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return success(list);
  } catch (err: any) {
    return serverError("获取适配需求失败", err, "entry/user/adapter-requests.get");
  }
});

