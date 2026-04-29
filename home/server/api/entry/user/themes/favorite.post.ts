import prisma from "~~/server/lib/prisma";
import { success, error, serverError } from "~~/server/utils/result";
import { getUserId } from "~~/server/utils/jwt";

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event);
  if (!userId) return error("未登录");

  const body = await readBody(event);
  const themeId = body?.themeId as string;
  if (!themeId) return error("缺少 themeId");

  try {
    const theme = await prisma.theme.findFirst({ where: { id: themeId, isActive: true } });
    if (!theme) return error("主题不存在");

    const existing = await prisma.userThemes.findUnique({
      where: { userId_themeId: { userId, themeId } },
    });

    if (existing) {
      await prisma.userThemes.delete({ where: { userId_themeId: { userId, themeId } } });
      return success({ favorited: false });
    } else {
      await prisma.userThemes.create({ data: { userId, themeId } });
      return success({ favorited: true });
    }
  } catch (err: any) {
    return serverError("操作失败", err, "entry/user/themes/favorite.post");
  }
});
