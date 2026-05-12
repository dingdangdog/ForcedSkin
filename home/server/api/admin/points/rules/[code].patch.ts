import prisma from "~~/server/lib/prisma";
import { error, serverError, success } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");
  if (!code) return error("缺少规则 code");

  const body = await readBody(event);
  const data: Record<string, unknown> = {};
  if (body?.points !== undefined) data.points = Math.trunc(Number(body.points)) || 0;
  if (body?.enabled !== undefined) data.enabled = !!body.enabled;
  if (body?.description !== undefined) data.description = String(body.description || "").slice(0, 500);
  if (body?.capPerUserPerDay !== undefined) {
    const v = body.capPerUserPerDay;
    data.capPerUserPerDay = v === null || v === "" ? null : Math.max(0, Math.trunc(Number(v)));
  }

  if (Object.keys(data).length === 0) return error("没有可更新字段");

  try {
    const updated = await prisma.pointRule.update({
      where: { code },
      data,
    });
    return success(updated);
  } catch (err: any) {
    if (err?.code === "P2025") return error("规则不存在");
    return serverError("更新积分规则失败", err, "admin/points/rules/[code].patch");
  }
});
