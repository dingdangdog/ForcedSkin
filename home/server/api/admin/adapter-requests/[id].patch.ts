import prisma from "~~/server/lib/prisma";
import { error, serverError, success } from "~~/server/utils/result";

const VALID_STATUS = new Set(["pending", "processing", "completed", "rejected"]);

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) return error("缺少 ID");

  const body = await readBody(event);
  const status = body?.status;
  const adminNote = body?.adminNote;
  const adapterId = body?.adapterId;

  const data: Record<string, any> = {};
  if (typeof status === "string") {
    if (!VALID_STATUS.has(status)) return error("无效状态");
    data.status = status;
    data.reviewedAt = new Date();
  }
  if (adminNote !== undefined) data.adminNote = (adminNote || "").toString().slice(0, 1000);
  if (adapterId !== undefined) data.adapterId = adapterId ? String(adapterId) : null;

  if (Object.keys(data).length === 0) return error("没有可更新字段");

  try {
    const updated = await prisma.adapterRequest.update({
      where: { id },
      data,
    });
    return success(updated);
  } catch (err: any) {
    if (err?.code === "P2025") return error("请求不存在");
    return serverError("更新适配需求失败", err, "admin/adapter-requests/[id].patch");
  }
});

