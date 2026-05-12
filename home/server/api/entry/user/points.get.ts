import prisma from "~~/server/lib/prisma";
import { getUserId } from "~~/server/utils/jwt";
import { noLogin, serverError, success } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  const userId = getUserId(event);
  if (!userId) return noLogin("未登录");

  try {
    const [balance, recent] = await Promise.all([
      prisma.userPointsBalance.findUnique({ where: { userId } }),
      prisma.pointLedger.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          delta: true,
          reasonCode: true,
          title: true,
          createdAt: true,
        },
      }),
    ]);

    return success({
      availablePoints: balance?.availablePoints ?? 0,
      frozenPoints: balance?.frozenPoints ?? 0,
      lifetimeEarned: balance?.lifetimeEarned ?? 0,
      lifetimeSpent: balance?.lifetimeSpent ?? 0,
      recentLedger: recent,
    });
  } catch (err: unknown) {
    return serverError("获取积分信息失败", err, "entry/user/points.get");
  }
});
