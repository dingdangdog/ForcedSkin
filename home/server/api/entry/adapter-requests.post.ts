import prisma from "~~/server/lib/prisma";
import { error, noLogin, serverError, success } from "~~/server/utils/result";
import { getUserId } from "~~/server/utils/jwt";

function normalizeElements(raw: any): Array<{ selector: string; tagName?: string; textHint?: string; classHint?: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => ({
      selector: typeof x?.selector === "string" ? x.selector.trim() : "",
      tagName: typeof x?.tagName === "string" ? x.tagName : undefined,
      textHint: typeof x?.textHint === "string" ? x.textHint : undefined,
      classHint: typeof x?.classHint === "string" ? x.classHint : undefined,
    }))
    .filter((x) => !!x.selector);
}

export default defineEventHandler(async (event) => {
  const userId = getUserId(event);
  if (!userId) return noLogin("未登录");

  const body = await readBody(event);
  const siteDomain = (body?.siteDomain || "").toString().trim().toLowerCase();
  const feedback = (body?.feedback || "").toString().trim();
  const source = body?.source === "website" ? "website" : "extension";
  const elements = normalizeElements(body?.selectedElements);

  if (!siteDomain) return error("缺少网站域名");
  if (elements.length === 0) return error("请至少选择一个元素");
  if (!feedback || feedback.length < 6) return error("请填写更具体的需求描述（至少 6 个字）");

  try {
    const req = await prisma.adapterRequest.create({
      data: {
        submitterId: userId,
        siteDomain,
        selectedElements: JSON.stringify(elements),
        feedback: feedback.slice(0, 1000),
        status: "pending",
        source,
      },
      select: {
        id: true,
        siteDomain: true,
        status: true,
        source: true,
        createdAt: true,
      },
    });

    return success(req);
  } catch (err: any) {
    return serverError("提交适配需求失败", err, "entry/adapter-requests.post");
  }
});

