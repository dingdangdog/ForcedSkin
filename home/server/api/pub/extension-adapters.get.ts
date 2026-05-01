import prisma from "~~/server/lib/prisma";
import { resolveExtensionAdapterPresentation } from "~~/server/utils/extension-adapter-presentation";
import { success, serverError } from "~~/server/utils/result";

/**
 * 扩展拉取：全部「已上线」站点适配器的声明式公式（forcedskin-adapter-formula/v1 JSON，字段 code）。
 * 扩展本地解析，不执行任意 JavaScript 源码。
 */
export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  });

  try {
    const rows = await prisma.siteAdapter.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      select: {
        name: true,
        displayName: true,
        siteDomain: true,
        code: true,
        updatedAt: true,
      },
    });

    const adapters = rows.map((r) => {
      const { displayName, siteDomain } = resolveExtensionAdapterPresentation({
        name: r.name,
        displayName: r.displayName,
        siteDomain: r.siteDomain,
        code: r.code,
      });
      return {
        name: r.name,
        displayName,
        siteDomain,
        code: r.code,
        updatedAt: r.updatedAt.toISOString(),
      };
    });

    return success({ adapters });
  } catch (err: unknown) {
    return serverError("获取扩展适配器脚本失败", err, "pub/extension-adapters.get");
  }
});
