import prisma from "~~/server/lib/prisma";
import { success, serverError } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 20));

    const [total, adapters] = await Promise.all([
      prisma.siteAdapter.count({ where: { isActive: true } }),
      prisma.siteAdapter.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          displayName: true,
          description: true,
          siteDomain: true,
          sortOrder: true,
          createdAt: true,
        },
      }),
    ]);

    return success({ total, page, pageSize, pages: Math.ceil(total / pageSize), list: adapters });
  } catch (err: any) {
    return serverError("获取适配器列表失败", err, "adapters.get");
  }
});
