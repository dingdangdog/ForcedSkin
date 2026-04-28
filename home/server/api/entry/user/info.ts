import prisma from "~~/server/lib/prisma";
import { success, noLogin } from "~~/server/utils/result";
import { getUserId } from "~~/server/utils/jwt";

export default defineEventHandler(async (event) => {
  const userId = getUserId(event);
  if (!userId) return noLogin("未登录");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      roles: true,
      lightTheme: true,
      darkTheme: true,
      createdAt: true,
    },
  });

  return success(user);
});
