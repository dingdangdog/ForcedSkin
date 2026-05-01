import prisma from "~~/server/lib/prisma";
import { serverError, success } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const [total, list] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          roles: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return success({
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
      list,
    });
  } catch (err: unknown) {
    return serverError("获取用户列表失败", err, "admin/users.get");
  }
});
