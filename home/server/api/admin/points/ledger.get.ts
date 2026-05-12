import prisma from "~~/server/lib/prisma";
import { serverError, success } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 30));
    const userId = query.userId as string | undefined;
    const reasonCode = query.reasonCode as string | undefined;

    const where: Record<string, unknown> = {};
    if (userId) where.userId = String(userId);
    if (reasonCode) where.reasonCode = String(reasonCode);

    const [total, list] = await Promise.all([
      prisma.pointLedger.count({ where }),
      prisma.pointLedger.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
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
    return serverError("获取积分流水失败", err, "admin/points/ledger.get");
  }
});
