import prisma from "~~/server/lib/prisma";

/** 按主题 ID 聚合收藏人数；themeIds 为空时返回空对象 */
export async function themeFavoriteCountMap(themeIds: string[]): Promise<Record<string, number>> {
  if (!themeIds.length) return {};
  const rows = await prisma.userThemes.groupBy({
    by: ["themeId"],
    where: { themeId: { in: themeIds } },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.themeId, r._count._all]));
}
