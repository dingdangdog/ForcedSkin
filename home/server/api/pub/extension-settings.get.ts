import { getServerSession } from "#auth";
import prisma from "~~/server/lib/prisma";
import { success, serverError } from "~~/server/utils/result";
import { getAuthPayload } from "~~/server/utils/jwt";

type ThemeRow = Awaited<ReturnType<typeof prisma.theme.findFirst>>;

const parseColors = (t: any) => {
  if (!t?.colors) return null;
  try {
    return typeof t.colors === "string" ? JSON.parse(t.colors) : t.colors;
  } catch {
    return null;
  }
};

const toClientOption = (t: ThemeRow) => {
  if (!t) return null;
  const colors = parseColors(t);
  if (!colors) return null;
  return {
    id: t.id,
    name: t.name,
    displayName: t.displayName,
    mode: t.mode,
    colors,
  };
};

function buildModeOptions(
  mode: "light" | "dark",
  defaultTheme: ThemeRow | null,
  selectedRow: ThemeRow | null,
  selectedName: string | null,
  favoriteThemes: NonNullable<ThemeRow>[],
): ReturnType<typeof toClientOption>[] {
  const map = new Map<string, NonNullable<ThemeRow>>();

  const put = (row: ThemeRow | null) => {
    if (!row || row.mode !== mode) return;
    map.set(row.name, row);
  };

  put(defaultTheme);
  for (const ft of favoriteThemes) {
    put(ft);
  }
  put(selectedRow);

  const arr = Array.from(map.values());
  arr.sort((a, b) => {
    if (selectedName) {
      if (a.name === selectedName) return -1;
      if (b.name === selectedName) return 1;
    }
    const aDef = defaultTheme?.name === a.name ? 0 : 1;
    const bDef = defaultTheme?.name === b.name ? 0 : 1;
    if (aDef !== bDef) return aDef - bDef;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name);
  });

  return arr.map((row) => toClientOption(row)).filter(Boolean) as ReturnType<typeof toClientOption>[];
}

/**
 * 扩展专用接口：返回用户选定的亮/暗主题色值，以及各模式下可选主题列表。
 * 鉴权优先级：
 *   1. NuxtAuth session（网页端登录状态）
 *   2. Authorization: Bearer <legacy-jwt>（扩展端登录状态，保持向后兼容）
 * 未登录时返回系统默认主题；已登录额外合并收藏主题进对应 mode 列表。
 */
export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  });

  try {
    let userId: string | null = null;

    // 1. 尝试 NuxtAuth session
    const session = await getServerSession(event);
    const sessionUser = session?.user as { id?: string } | undefined;
    if (sessionUser?.id) {
      userId = sessionUser.id;
    }

    // 2. Fallback：扩展携带的旧 JWT Bearer token
    if (!userId) {
      const payload = getAuthPayload(event);
      if (payload?.id) userId = payload.id;
    }

    let lightThemeName: string | null = null;
    let darkThemeName: string | null = null;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lightTheme: true, darkTheme: true },
      });
      lightThemeName = user?.lightTheme ?? null;
      darkThemeName = user?.darkTheme ?? null;
    }

    const [defaultLight, defaultDark] = await Promise.all([
      prisma.theme.findFirst({
        where: { mode: "light", isActive: true, isDefault: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.theme.findFirst({
        where: { mode: "dark", isActive: true, isDefault: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    let favoriteThemes: NonNullable<ThemeRow>[] = [];
    if (userId) {
      const favRows = await prisma.userThemes.findMany({
        where: { userId },
        select: { themeId: true },
      });
      const ids = favRows.map((r) => r.themeId);
      if (ids.length) {
        favoriteThemes = await prisma.theme.findMany({
          where: { id: { in: ids }, isActive: true },
        });
      }
    }

    const [selectedLightRow, selectedDarkRow] = await Promise.all([
      lightThemeName
        ? prisma.theme.findFirst({ where: { name: lightThemeName, mode: "light", isActive: true } })
        : Promise.resolve(null),
      darkThemeName
        ? prisma.theme.findFirst({ where: { name: darkThemeName, mode: "dark", isActive: true } })
        : Promise.resolve(null),
    ]);

    const lightTheme =
      selectedLightRow ||
      defaultLight ||
      (await prisma.theme.findFirst({
        where: { mode: "light", isActive: true },
        orderBy: { sortOrder: "asc" },
      }));
    const darkTheme =
      selectedDarkRow ||
      defaultDark ||
      (await prisma.theme.findFirst({
        where: { mode: "dark", isActive: true },
        orderBy: { sortOrder: "asc" },
      }));

    const lightOptions = buildModeOptions("light", defaultLight, selectedLightRow, lightThemeName, favoriteThemes);
    const darkOptions = buildModeOptions("dark", defaultDark, selectedDarkRow, darkThemeName, favoriteThemes);

    return success({
      isLoggedIn: !!userId,
      light: toClientOption(lightTheme),
      dark: toClientOption(darkTheme),
      lightOptions,
      darkOptions,
    });
  } catch (err: any) {
    return serverError("获取设置失败", err, "pub/extension-settings.get");
  }
});
