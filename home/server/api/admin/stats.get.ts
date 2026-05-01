import prisma from "~~/server/lib/prisma";
import { success, serverError } from "~~/server/utils/result";

/** 控制台概况统计（需管理员，由 server middleware 校验） */
export default defineEventHandler(async () => {
  try {
    const userCount = await prisma.user.count();
    return success({ userCount });
  } catch (err: any) {
    return serverError("获取统计数据失败", err, "admin/stats.get");
  }
});
