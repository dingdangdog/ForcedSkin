import prisma from "~~/server/lib/prisma";
import { getUserId } from "~~/server/utils/jwt";
import { noLogin, serverError, success } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  const userId = getUserId(event);
  if (!userId) return noLogin("未登录");

  try {
    const query = getQuery(event);
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 20));
    const sign = query.sign as string | undefined;
    const where: { userId: string; delta?: { gt?: number; lt?: number } } = { userId };
    if (sign === "earn") where.delta = { gt: 0 };
    else if (sign === "spend") where.delta = { lt: 0 };

    const [total, list] = await Promise.all([
      prisma.pointLedger.count({ where }),
      prisma.pointLedger.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          delta: true,
          balanceAfter: true,
          reasonCode: true,
          title: true,
          sourceType: true,
          sourceId: true,
          createdAt: true,
        },
      }),
    ]);

    return success({
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
      list,
    });
  } catch (err: unknown) {
    return serverError("获取积分流水失败", err, "entry/user/points/ledger.get");
  }
});
