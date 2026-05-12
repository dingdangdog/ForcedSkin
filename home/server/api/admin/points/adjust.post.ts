import prisma from "~~/server/lib/prisma";
import { error, serverError, success } from "~~/server/utils/result";
import { getUserId } from "~~/server/utils/jwt";
import { applyPointsInTx, POINT_REASON } from "~~/server/lib/points";

export default defineEventHandler(async (event) => {
  const actorUserId = getUserId(event);
  if (!actorUserId) return error("未登录");

  const body = await readBody(event);
  const userId = body?.userId ? String(body.userId) : "";
  const delta = body?.delta !== undefined ? Math.trunc(Number(body.delta)) : NaN;
  const note = (body?.note || "").toString().trim().slice(0, 500);
  const idempotencyKey = body?.idempotencyKey ? String(body.idempotencyKey).trim() : "";

  if (!userId) return error("缺少 userId");
  if (!Number.isFinite(delta) || delta === 0) return error("delta 必须为非零整数");
  if (!idempotencyKey || idempotencyKey.length > 180) return error("请提供 idempotencyKey（建议 UUID）");

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return error("用户不存在");

  try {
    const result = await prisma.$transaction(async (tx) => {
      return applyPointsInTx(tx, {
        userId,
        reasonCode: POINT_REASON.ADMIN_ADJUSTMENT,
        deltaOverride: delta,
        idempotencyKey: `admin-adjust:${idempotencyKey}`,
        sourceType: "admin_adjustment",
        sourceId: actorUserId,
        actorUserId,
        meta: { note, adminId: actorUserId },
      });
    });

    return success(result);
  } catch (err: unknown) {
    return serverError("人工调整积分失败", err, "admin/points/adjust.post");
  }
});
