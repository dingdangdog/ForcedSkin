import prisma from "~~/server/lib/prisma";
import { success, error, serverError } from "~~/server/utils/result";
import { getUserId } from "~~/server/utils/jwt";
import { validateAdapterFormulaCodeString } from "~~/server/utils/adapter-formula";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event);
  if (!userId) return error("未登录");

  const body = await readBody(event);
  const { displayName, description, siteDomain, code } = body || {};

  if (!displayName || !siteDomain || !code) return error("缺少必要字段");

  const formulaCheck = validateAdapterFormulaCodeString(code);
  if (!formulaCheck.ok) return error(formulaCheck.error || "适配器公式无效");

  const baseSlug = slugify(displayName) || "adapter";
  let name = `${baseSlug}-${randomSuffix()}`;

  for (let i = 0; i < 5; i++) {
    const exists = await prisma.siteAdapter.findUnique({ where: { name } });
    if (!exists) break;
    name = `${baseSlug}-${randomSuffix()}`;
  }

  try {
    const adapter = await prisma.siteAdapter.create({
      data: {
        submitterId: userId,
        name,
        displayName,
        description: description || "",
        siteDomain,
        code,
        isActive: false,
      },
    });

    return success(adapter);
  } catch (err: any) {
    if (err.code === "P2002") return error("适配器标识冲突，请重新提交");
    return serverError("提交失败", err, "entry/adapters.post");
  }
});
