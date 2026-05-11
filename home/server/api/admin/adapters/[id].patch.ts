import prisma from "~~/server/lib/prisma";
import { success, error, serverError } from "~~/server/utils/result";
import { validateAdapterFormulaCodeString } from "~~/server/utils/adapter-formula";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) return error("缺少 ID");

  const body = await readBody(event);
  const { displayName, description, siteDomain, code, isActive, sortOrder, rejectionReason } = body || {};

  if (code !== undefined) {
    const formulaCheck = validateAdapterFormulaCodeString(code);
    if (!formulaCheck.ok) return error(formulaCheck.error || "适配器公式无效");
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (siteDomain !== undefined) updateData.siteDomain = siteDomain;
    if (code !== undefined) updateData.code = code;
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);

    if (isActive !== undefined) {
      updateData.isActive = !!isActive;
      updateData.reviewedAt = new Date();
      if (isActive) {
        // 审核通过：清空拒绝原因
        updateData.rejectionReason = null;
      } else if (rejectionReason !== undefined) {
        // 审核拒绝：记录原因
        updateData.rejectionReason = rejectionReason;
      }
    }

    if (isActive === undefined && rejectionReason !== undefined) {
      updateData.rejectionReason = rejectionReason;
    }

    const updated = await prisma.siteAdapter.update({ where: { id }, data: updateData });
    return success(updated);
  } catch (err: any) {
    if (err.code === "P2025") return error("适配器不存在");
    return serverError("更新失败", err, "admin/adapters/[id].put");
  }
});
