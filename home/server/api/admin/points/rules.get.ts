import prisma from "~~/server/lib/prisma";
import { ensureDefaultPointRules } from "~~/server/lib/points";
import { serverError, success } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  try {
    await prisma.$transaction(async (tx) => {
      await ensureDefaultPointRules(tx);
    });
    const list = await prisma.pointRule.findMany({ orderBy: { code: "asc" } });
    return success(list);
  } catch (err: unknown) {
    return serverError("获取积分规则失败", err, "admin/points/rules.get");
  }
});
