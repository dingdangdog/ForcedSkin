import prisma from "~~/server/lib/prisma";
import { success, error, serverError } from "~~/server/utils/result";
import { normalizeJsonForStorage } from "~~/server/utils/json-storage";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) return error("缺少 ID");

  const body = await readBody(event);
  const { displayName, description, colors, isActive, isDefault, sortOrder } = body || {};

  try {
    const theme = await prisma.theme.findUnique({ where: { id } });
    if (!theme) return error("主题不存在");

    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = !!isActive;
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);
    if (colors !== undefined) {
      updateData.colors = normalizeJsonForStorage(colors);
    }

    if (isDefault) {
      await prisma.theme.updateMany({ where: { mode: theme.mode, isDefault: true }, data: { isDefault: false } });
      updateData.isDefault = true;
    } else if (isDefault === false) {
      updateData.isDefault = false;
    }

    const updated = await prisma.theme.update({ where: { id }, data: updateData });
    return success(updated);
  } catch (err: any) {
    return serverError("更新失败", err, "admin/themes/[id].put");
  }
});
