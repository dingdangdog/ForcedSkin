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
        implementedByUserId: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const ids = list.map((r) => r.id);
    const ledgers =
      ids.length === 0
        ? []
        : await prisma.pointLedger.findMany({
            where: {
              userId,
              sourceType: "adapter_request",
              sourceId: { in: ids },
            },
            select: { sourceId: true, delta: true },
          });
    const pointsByRequest = new Map<string, number>();
    for (const row of ledgers) {
      if (!row.sourceId) continue;
      pointsByRequest.set(row.sourceId, (pointsByRequest.get(row.sourceId) || 0) + row.delta);
    }

    const enriched = list.map((r) => ({
      ...r,
      pointsFromRequest: pointsByRequest.get(r.id) ?? 0,
    }));

    return success(enriched);
  } catch (err: any) {
    return serverError("获取适配需求失败", err, "entry/user/adapter-requests.get");
  }
});

