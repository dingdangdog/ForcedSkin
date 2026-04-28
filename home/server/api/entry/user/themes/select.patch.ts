import prisma from "~~/server/lib/prisma";
import { success, error } from "~~/server/utils/result";
import { getUserId } from "~~/server/utils/jwt";

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event);
  if (!userId) return error("未登录");

  const body = await readBody(event);
  const { lightTheme, darkTheme } = body || {};

  if (!lightTheme && !darkTheme) return error("至少提供一个主题名称");

  try {
    const updateData: any = {};
    if (lightTheme !== undefined) updateData.lightTheme = lightTheme;
    if (darkTheme !== undefined) updateData.darkTheme = darkTheme;

    await prisma.user.update({ where: { id: userId }, data: updateData });
    return success({ lightTheme: updateData.lightTheme, darkTheme: updateData.darkTheme });
  } catch (err: any) {
    return error("更新失败", err.message);
  }
});
