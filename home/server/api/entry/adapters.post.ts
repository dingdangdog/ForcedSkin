import prisma from "~~/server/lib/prisma";
import { success, error } from "~~/server/utils/result";
import { getUserId } from "~~/server/utils/jwt";

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event);
  if (!userId) return error("未登录");

  const body = await readBody(event);
  const { name, displayName, description, siteDomain, code } = body || {};

  if (!name || !displayName || !siteDomain || !code) return error("缺少必要字段");
  if (!/^[a-z0-9-]+$/.test(name)) return error("name 只允许小写字母、数字和连字符");

  try {
    const exists = await prisma.siteAdapter.findUnique({ where: { name } });
    if (exists) return error("该标识已存在");

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
    return error("提交失败", err.message);
  }
});
