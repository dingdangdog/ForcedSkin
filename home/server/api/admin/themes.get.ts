import prisma from "~~/server/lib/prisma";
import { success, error } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const mode = query.mode as string | undefined;

    const where: any = {};
    if (mode === "light" || mode === "dark") where.mode = mode;

    const [total, list] = await Promise.all([
      prisma.theme.count({ where }),
      prisma.theme.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return success({ total, page, pageSize, pages: Math.ceil(total / pageSize), list });
  } catch (err: any) {
    return error("获取主题列表失败", err.message);
  }
});
