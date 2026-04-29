import prisma from "~~/server/lib/prisma";
import { success, error, serverError } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const mode = query.mode as string | undefined;
    const status = query.status as string | undefined; // "pending" | "active" | "all"

    const where: any = {};
    if (mode === "light" || mode === "dark") where.mode = mode;
    if (status === "pending") {
      where.isActive = false;
      where.submitterId = { not: null };
    } else if (status === "active") {
      where.isActive = true;
    }

    const [total, list] = await Promise.all([
      prisma.theme.count({ where }),
      prisma.theme.findMany({
        where,
        orderBy: [{ isActive: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return success({ total, page, pageSize, pages: Math.ceil(total / pageSize), list });
  } catch (err: any) {
    return serverError("获取主题列表失败", err, "admin/themes.get");
  }
});
