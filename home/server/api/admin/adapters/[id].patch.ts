import prisma from "~~/server/lib/prisma";
import { success, error, serverError } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) return error("缺少 ID");

  const body = await readBody(event);
  const { displayName, description, siteDomain, code, isActive, sortOrder } = body || {};

  try {
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (siteDomain !== undefined) updateData.siteDomain = siteDomain;
    if (code !== undefined) updateData.code = code;
    if (isActive !== undefined) updateData.isActive = !!isActive;
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);

    const updated = await prisma.siteAdapter.update({ where: { id }, data: updateData });
    return success(updated);
  } catch (err: any) {
    if (err.code === "P2025") return error("适配器不存在");
    return serverError("更新失败", err, "admin/adapters/[id].put");
  }
});
