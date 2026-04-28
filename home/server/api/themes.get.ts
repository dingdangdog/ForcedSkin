import prisma from "~~/server/lib/prisma";
import { success, error } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const mode = query.mode as string | undefined;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 20));

    const where: any = { isActive: true };
    if (mode === "light" || mode === "dark") where.mode = mode;

    const [total, themes] = await Promise.all([
      prisma.theme.count({ where }),
      prisma.theme.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          displayName: true,
          description: true,
          mode: true,
          colors: true,
          isDefault: true,
          sortOrder: true,
          createdAt: true,
        },
      }),
    ]);

    return success({
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
      list: themes,
    });
  } catch (err: any) {
    console.error("获取主题列表失败:", err);
    return error("获取主题列表失败", err.message);
  }
});
