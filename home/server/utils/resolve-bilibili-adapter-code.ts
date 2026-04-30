import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REL_SEGMENTS = ["extension", "src", "content", "adapters", "bilibili.js"];

/** 与源码目录并列的 seeds（开发 cwd=home；生产镜像需复制 server/seeds） */
function bundledFallbackPath(): string {
  return join(process.cwd(), "server/seeds/bilibili-adapter.fallback.js");
}

function extensionCandidatePaths(): string[] {
  const paths: string[] = [];
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 14; i++) {
    paths.push(join(dir, ...REL_SEGMENTS));
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const cwd = process.cwd();
  paths.push(join(cwd, ...REL_SEGMENTS));
  paths.push(join(cwd, "..", ...REL_SEGMENTS));
  return [...new Set(paths)];
}

/**
 * 优先读取仓库内扩展源码（开发 / 完整 monorepo）；
 * 否则使用随 home 打包的 fallback（与 extension 文件人工对齐）。
 */
export function resolveBilibiliAdapterCode(): string {
  for (const p of extensionCandidatePaths()) {
    if (!existsSync(p)) continue;
    try {
      return readFileSync(p, "utf8");
    } catch {
      /* try next */
    }
  }
  const fb = bundledFallbackPath();
  if (existsSync(fb)) return readFileSync(fb, "utf8");
  throw new Error(
    "[resolve-bilibili-adapter-code] Missing extension adapter and server/seeds/bilibili-adapter.fallback.js",
  );
}
