import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import prisma from "~~/server/lib/prisma";

const ADAPTER_FORMULA_SEED_FILES = [
  join(process.cwd(), "server/seeds/bilibili-adapter.formula.json"),
  join(process.cwd(), "home/server/seeds/bilibili-adapter.formula.json"),
];

/** SiteAdapter.code 仅存 forcedskin-adapter-formula/v1 的 JSON 文本 */
function readBilibiliAdapterFormulaSeed(): string {
  for (const p of ADAPTER_FORMULA_SEED_FILES) {
    if (existsSync(p)) return readFileSync(p, "utf8");
  }
  throw new Error("[init-data] Missing server/seeds/bilibili-adapter.formula.json");
}

// ── Default theme palettes ─────────────────────────────────────
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

const lightSakuraColors = {
  background: "#FDF6F7",
  foreground: "#331A22",
  surface: "#FCEEF0",
  surfaceMuted: "#FAF2F4",
  border: "#fcb8c7",
  muted: "#8A6A72",
  primary: {
    "50": "#FFF9FB", "100": "#FDEEF2", "200": "#FBDDE8", "300": "#F8CDE0",
    "400": "#F5BBD6", "500": "#f58ec0", "600": "#E88CB0", "700": "#DE6E96",
    "800": "#D4517C", "900": "#CB3462", "950": "#BF1A4A",
  },
  secondary: {
    "50": "#F8F8F8", "100": "#F0F0F0", "200": "#E0E0E0", "300": "#D0D0D0",
    "400": "#C0C0C0", "500": "#B0B0B0", "600": "#A0A0A0", "700": "#909090",
    "800": "#808080", "900": "#707070", "950": "#606060",
  },
  accent: {
    "50": "#FFFDFE", "100": "#FEF9FA", "200": "#FDF3F5", "300": "#FBF0F3",
    "400": "#F8EAEF", "500": "#d979c7", "600": "#EEDCDD", "700": "#e6878f",
    "800": "#DED0D1", "900": "#ed6d7c", "950": "#CDCCCC",
  },
};

function bilibiliAdapterSeedRow(submitterId: string) {
  return {
    name: "bilibili",
    displayName: "Bilibili",
    description: "Fine-tunes header, sidebar, and video detail areas on bilibili.com",
    siteDomain: "bilibili.com,www.bilibili.com",
    code: readBilibiliAdapterFormulaSeed(),
    isActive: true,
    sortOrder: 0,
    submitterId,
  };
}

export default defineNitroPlugin(async () => {
  const themeCount = await prisma.theme.count();
  if (themeCount === 0) {
    await prisma.theme.createMany({
      data: [
        {
          name: "light-mint",
          displayName: "Mint Light",
          description: "Soft mint-green accents on a fresh light background.",
          mode: "light",
          colors: JSON.stringify(lightMintColors),
          isActive: true,
          isDefault: true,
          sortOrder: 0,
        },
        {
          name: "light-sakura",
          displayName: "Sakura Pink",
          description: "Warm blush and rose tones for a gentle light theme.",
          mode: "light",
          colors: JSON.stringify(lightSakuraColors),
          isActive: true,
          isDefault: false,
          sortOrder: 1,
        },
        {
          name: "dark-forest",
          displayName: "Forest Dark",
          description: "Deep forest-green accents for comfortable night reading.",
          mode: "dark",
          colors: JSON.stringify(darkForestColors),
          isActive: true,
          isDefault: true,
          sortOrder: 0,
        },
      ],
    });
    console.log("[init-data] Theme seed completed (Mint, Sakura, Forest)");
  }

  const adapterCount = await prisma.siteAdapter.count();
  if (adapterCount === 0) {
    const firstUser = await prisma.user.findFirst({ select: { id: true } });
    const submitterId = firstUser?.id || "system";

    await prisma.siteAdapter.createMany({
      data: [bilibiliAdapterSeedRow(submitterId)],
    });
    console.log("[init-data] Adapter seed completed (Bilibili only)");
  }
});
