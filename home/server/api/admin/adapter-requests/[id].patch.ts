import prisma from "~~/server/lib/prisma";
import { error, serverError, success } from "~~/server/utils/result";
import { getUserId } from "~~/server/utils/jwt";
import {
  tryAwardAdapterRequestAccepted,
  tryAwardAdapterRequestClosure,
} from "~~/server/lib/points";

const VALID_STATUS = new Set(["pending", "processing", "completed", "rejected"]);

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) return error("缺少 ID");

  const body = await readBody(event);
  const status = body?.status;
  const adminNote = body?.adminNote;
  const adapterId = body?.adapterId;
  const implementedByUserId = body?.implementedByUserId;

  const data: Record<string, unknown> = {};
  if (typeof status === "string") {
    if (!VALID_STATUS.has(status)) return error("无效状态");
    data.status = status;
    data.reviewedAt = new Date();
  }
  if (adminNote !== undefined) data.adminNote = (adminNote || "").toString().slice(0, 1000);
  if (adapterId !== undefined) data.adapterId = adapterId ? String(adapterId) : null;
  if (implementedByUserId !== undefined) {
    data.implementedByUserId = implementedByUserId ? String(implementedByUserId) : null;
  }

  if (Object.keys(data).length === 0) return error("没有可更新字段");

  try {
    const before = await prisma.adapterRequest.findUnique({ where: { id } });
    if (!before) return error("请求不存在");

    const updated = await prisma.adapterRequest.update({
      where: { id },
      data,
    });

    const actorUserId = getUserId(event);

    await prisma.$transaction(async (tx) => {
      if (before.status === "pending" && updated.status === "processing") {
        await tryAwardAdapterRequestAccepted(tx, {
          requestId: id,
          submitterId: updated.submitterId,
          actorUserId: actorUserId,
        });
      }
      await tryAwardAdapterRequestClosure(tx, { requestId: id, actorUserId: actorUserId });
    });

    return success(updated);
  } catch (err: any) {
    if (err?.code === "P2025") return error("请求不存在");
    return serverError("更新适配需求失败", err, "admin/adapter-requests/[id].patch");
  }
});
