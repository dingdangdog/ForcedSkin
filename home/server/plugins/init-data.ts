import prisma from "~~/server/lib/prisma";

// ── 默认主题色 ────────────────────────────────────────────────
const lightMintColors = {
  background: "#F8FFF8",
  foreground: "#2C3E2C",
  surface: "#F0FFF0",
  surfaceMuted: "#F5FDF5",
  border: "#D8E8D8",
  muted: "#6C7E6C",
  primary: {
    "50": "#E8F5E9", "100": "#C8E6C9", "200": "#A5D6A7",
    "300": "#81C784", "400": "#66BB6A", "500": "#4CAF50",
    "600": "#43A047", "700": "#388E3C", "800": "#2E7D32",
    "900": "#1B5E20", "950": "#0F3D12",
  },
  secondary: {
    "50": "#F8F8F8", "100": "#EEEEEE", "200": "#DDDDDD",
    "300": "#CCCCCC", "400": "#BBBBBB", "500": "#AAAAAA",
    "600": "#999999", "700": "#777777", "800": "#555555",
    "900": "#333333", "950": "#111111",
  },
  accent: {
    "50": "#FFFDE7", "100": "#FFF9C4", "200": "#FFF59D",
    "300": "#FFF176", "400": "#FFEE58", "500": "#FFEB3B",
    "600": "#FDD835", "700": "#FBC02D", "800": "#F9A825",
    "900": "#F57F17", "950": "#AF5C00",
  },
};

const darkForestColors = {
  background: "#101410",
  foreground: "#E0E0E0",
  surface: "#1E221E",
  surfaceMuted: "#161816",
  border: "#333633",
  muted: "#A0A0A0",
  primary: {
    "50": "#E8F5ED", "100": "#C1E0CC", "200": "#9AD0AB",
    "300": "#73BF8A", "400": "#4AA96B", "500": "#4A9B6B",
    "600": "#3F855C", "700": "#346F4D", "800": "#29593E",
    "900": "#1E432F", "950": "#132D20",
  },
  secondary: {
    "50": "#F9FAFB", "100": "#F3F4F6", "200": "#E5E7EB",
    "300": "#D1D5DB", "400": "#9CA3AF", "500": "#6B7280",
    "600": "#4B5563", "700": "#374151", "800": "#1F2937",
    "900": "#111827", "950": "#0B0F15",
  },
  accent: {
    "50": "#F7FCEF", "100": "#EAF5D8", "200": "#DDEEC1",
    "300": "#D0E7AA", "400": "#C3E093", "500": "#7CB342",
    "600": "#6CA03A", "700": "#5C8D32", "800": "#4C7A2A",
    "900": "#3C6722", "950": "#2C541A",
  },
};

// ── 示例适配器 ────────────────────────────────────────────────
const sampleAdapters = [
  {
    name: "bilibili",
    displayName: "哔哩哔哩",
    description: "修复 B站 顶部导航、侧栏、视频描述区的背景与文字颜色",
    siteDomain: "bilibili.com,www.bilibili.com",
    code: "// bilibili adapter placeholder",
    isActive: true,
    sortOrder: 0,
  },
  {
    name: "zhihu",
    displayName: "知乎",
    description: "优化知乎问答页、专栏页的阅读背景色与正文色",
    siteDomain: "zhihu.com,www.zhihu.com",
    code: "// zhihu adapter placeholder",
    isActive: true,
    sortOrder: 1,
  },
  {
    name: "github",
    displayName: "GitHub",
    description: "为 GitHub 代码页、Issue、PR 提供更舒适的阅读配色",
    siteDomain: "github.com",
    code: "// github adapter placeholder",
    isActive: true,
    sortOrder: 2,
  },
  {
    name: "juejin",
    displayName: "掘金",
    description: "适配掘金首页卡片、文章页正文区域",
    siteDomain: "juejin.cn",
    code: "// juejin adapter placeholder",
    isActive: true,
    sortOrder: 3,
  },
  {
    name: "v2ex",
    displayName: "V2EX",
    description: "V2EX 帖子列表与详情页的背景和边框色适配",
    siteDomain: "v2ex.com,www.v2ex.com",
    code: "// v2ex adapter placeholder",
    isActive: true,
    sortOrder: 4,
  },
  {
    name: "sspai",
    displayName: "少数派",
    description: "少数派文章页排版与侧栏颜色优化",
    siteDomain: "sspai.com",
    code: "// sspai adapter placeholder",
    isActive: true,
    sortOrder: 5,
  },
  {
    name: "weibo",
    displayName: "微博",
    description: "微博时间线与详情页背景色替换",
    siteDomain: "weibo.com,www.weibo.com",
    code: "// weibo adapter placeholder",
    isActive: true,
    sortOrder: 6,
  },
  {
    name: "twitter",
    displayName: "X (Twitter)",
    description: "推特 / X 时间线背景与卡片颜色适配",
    siteDomain: "twitter.com,x.com",
    code: "// twitter adapter placeholder",
    isActive: true,
    sortOrder: 7,
  },
];

export default defineNitroPlugin(async () => {
  // ─── 主题初始化 ─────────────────────────────────────────────
  const themeCount = await prisma.theme.count();
  if (themeCount === 0) {
    await prisma.theme.createMany({
      data: [
        {
          name: "light-mint",
          displayName: "薄荷浅绿",
          description: "清新薄荷绿为主色调的浅色主题",
          mode: "light",
          colors: JSON.stringify(lightMintColors),
          isActive: true,
          isDefault: true,
          sortOrder: 0,
        },
        {
          name: "dark-forest",
          displayName: "深林暗色",
          description: "深邃森林绿为主色调的暗色主题",
          mode: "dark",
          colors: JSON.stringify(darkForestColors),
          isActive: true,
          isDefault: true,
          sortOrder: 0,
        },
      ],
    });
    console.log("[init-data] 主题数据初始化完成");
  }

  // ─── 适配器初始化 ────────────────────────────────────────────
  const adapterCount = await prisma.siteAdapter.count();
  if (adapterCount === 0) {
    // 需要一个系统占位 submitterId（第一个用户，或直接写占位值）
    const firstUser = await prisma.user.findFirst({ select: { id: true } });
    const submitterId = firstUser?.id || "system";

    await prisma.siteAdapter.createMany({
      data: sampleAdapters.map(a => ({ ...a, submitterId })),
    });
    console.log("[init-data] 适配器示例数据初始化完成");
  }

  // ─── 测试账号初始化 ──────────────────────────────────────────
  // ⚠️ TODO: 测试通过后删除此 if 块（包含 test-user / test-admin 的创建逻辑）
  const testUserExists = await prisma.user.findUnique({ where: { id: "test-user-001" } });
  if (!testUserExists) {
    await prisma.user.createMany({
      data: [
        {
          id: "test-user-001",
          name: "测试用户",
          email: "testuser@forcedskin.dev",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=testuser",
          roles: "user",
        },
        {
          id: "test-admin-001",
          name: "测试管理员",
          email: "testadmin@forcedskin.dev",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=testadmin",
          roles: "admin",
        },
      ],
    });
    console.log("[init-data] ⚠️  测试账号初始化完成（测试通过后请删除）");
  }
  // ⚠️ END TODO: 删除到此处
});
