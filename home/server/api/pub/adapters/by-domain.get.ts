import prisma from "~~/server/lib/prisma";
import { success, serverError } from "~~/server/utils/result";
import { resolveExtensionAdapterPresentation } from "~~/server/utils/extension-adapter-presentation";

/**
 * 公共接口：查询某个域名下已有的适配器
 * 扩展提交前和网页提交时调用，提示用户该网站已有适配器
 */
export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  });

  try {
    const query = getQuery(event);
    const domain = (query.domain as string || "").trim().toLowerCase();
    if (!domain) return success({ adapters: [], total: 0 });

    const adapters = await prisma.siteAdapter.findMany({
      where: {
        siteDomain: { contains: domain },
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        displayName: true,
        siteDomain: true,
        code: true,
        createdAt: true,
      },
    });

    const mapped = adapters.map((a) => {
      const { displayName, siteDomain } = resolveExtensionAdapterPresentation({
        name: a.name,
        displayName: a.displayName,
        siteDomain: a.siteDomain,
        code: a.code,
      });
      return { id: a.id, name: a.name, displayName, siteDomain, code: a.code, createdAt: a.createdAt };
    });

    return success({ adapters: mapped, total: mapped.length, domain });
  } catch (err: any) {
    return serverError("查询域名适配器失败", err, "pub/adapters/by-domain.get");
  }
});
