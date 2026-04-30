import prisma from "~~/server/lib/prisma";
import { success, error, serverError } from "~~/server/utils/result";
import { getUserId } from "~~/server/utils/jwt";
import { normalizeJsonForStorage } from "~~/server/utils/json-storage";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event);
  if (!userId) return error("未登录");

  const body = await readBody(event);
  const { displayName, description, mode, colors } = body || {};

  if (!displayName || !mode || !colors) return error("缺少必要字段");
  if (!["light", "dark"].includes(mode)) return error("mode 只允许 light 或 dark");

  let colorsStr: string;
  try {
    colorsStr = normalizeJsonForStorage(colors);
  } catch {
    return error("colors 必须是合法的 JSON 格式");
  }

  const baseSlug = slugify(displayName) || mode;
  let name = `${baseSlug}-${randomSuffix()}`;

  for (let i = 0; i < 5; i++) {
    const exists = await prisma.theme.findUnique({ where: { name } });
    if (!exists) break;
    name = `${baseSlug}-${randomSuffix()}`;
  }

  try {
    const theme = await prisma.theme.create({
      data: {
        name,
        displayName,
        description: description || "",
        mode,
        colors: colorsStr,
        submitterId: userId,
        isActive: false,
        isDefault: false,
        sortOrder: 0,
      },
    });

    return success(theme);
  } catch (err: any) {
    if (err.code === "P2002") return error("主题标识冲突，请重新提交");
    return serverError("提交失败", err, "entry/themes.post");
  }
});
