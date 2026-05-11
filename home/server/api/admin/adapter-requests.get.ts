import prisma from "~~/server/lib/prisma";
import { serverError, success } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const status = (query.status as string | undefined) || "all";
    const source = query.source as string | undefined;

    const where: Record<string, any> = {};
    if (status !== "all") where.status = status;
    if (source === "extension" || source === "website") where.source = source;

    const [total, list] = await Promise.all([
      prisma.adapterRequest.count({ where }),
      prisma.adapterRequest.findMany({
        where,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return success({ total, page, pageSize, pages: Math.ceil(total / pageSize), list });
  } catch (err: any) {
    return serverError("获取适配需求列表失败", err, "admin/adapter-requests.get");
  }
});

