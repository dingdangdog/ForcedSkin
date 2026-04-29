import prisma from "~~/server/lib/prisma";
import { success, error, serverError } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { name, displayName, description, mode, colors, isDefault, sortOrder } = body || {};

  if (!name || !displayName || !mode || !colors) return error("缺少必要字段");
  if (!["light", "dark"].includes(mode)) return error("mode 只允许 light 或 dark");
  if (!/^[a-z0-9-]+$/.test(name)) return error("name 只允许小写字母、数字和连字符");

  try {
    const colorsStr = typeof colors === "string" ? colors : JSON.stringify(colors);

    if (isDefault) {
      await prisma.theme.updateMany({ where: { mode, isDefault: true }, data: { isDefault: false } });
    }

    const theme = await prisma.theme.create({
      data: {
        name,
        displayName,
        description: description || "",
        mode,
        colors: colorsStr,
        isDefault: !!isDefault,
        sortOrder: sortOrder ?? 0,
      },
    });

    return success(theme);
  } catch (err: any) {
    if (err.code === "P2002") return error("主题标识已存在");
    return serverError("创建失败", err, "admin/themes.post");
  }
});
