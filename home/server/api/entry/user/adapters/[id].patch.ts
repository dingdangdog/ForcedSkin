import prisma from "~~/server/lib/prisma";
import { success, error, noLogin, serverError } from "~~/server/utils/result";
import { getUserId } from "~~/server/utils/jwt";
import { validateAdapterFormulaCodeString } from "~~/server/utils/adapter-formula";

/**
 * 更新自己的待审核适配器（已上线不可修改，必须联系管理员）
 */
export default defineEventHandler(async (event) => {
  const userId = getUserId(event);
  if (!userId) return noLogin("未登录");

  const id = getRouterParam(event, "id");
  if (!id) return error("缺少 ID");

  const body = await readBody(event);
  const { displayName, description, siteDomain, code } = body || {};

  try {
    const adapter = await prisma.siteAdapter.findUnique({ where: { id } });
    if (!adapter) return error("适配器不存在");
    if (adapter.submitterId !== userId) return error("无权修改他人提交");
    if (adapter.isActive) return error("已上线适配器不可自行修改，请重新提交或联系管理员");

    if (code !== undefined) {
      const formulaCheck = validateAdapterFormulaCodeString(code);
      if (!formulaCheck.ok) return error(formulaCheck.error || "适配器公式无效");
    }

    const updateData: Record<string, unknown> = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (siteDomain !== undefined) updateData.siteDomain = siteDomain;
    if (code !== undefined) updateData.code = code;

    const updated = await prisma.siteAdapter.update({
      where: { id },
      data: updateData,
    });

    return success(updated);
  } catch (err: any) {
    if (err.code === "P2025") return error("适配器不存在");
    return serverError("更新失败", err, "entry/user/adapters/[id].patch");
  }
});
