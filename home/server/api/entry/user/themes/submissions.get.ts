import prisma from "~~/server/lib/prisma";
import { success, error, serverError } from "~~/server/utils/result";
import { getUserId } from "~~/server/utils/jwt";

export default defineEventHandler(async (event) => {
  const userId = getUserId(event);
  if (!userId) return error("未登录");

  try {
    const themes = await prisma.theme.findMany({
      where: { submitterId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        mode: true,
        colors: true,
        isActive: true,
        createdAt: true,
      },
    });
    return success(themes);
  } catch (err: any) {
    return serverError("获取投稿主题失败", err, "entry/user/themes/submissions.get");
  }
});
