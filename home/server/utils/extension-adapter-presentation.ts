/**
 * 扩展拉取列表用：当 DB 中 displayName / siteDomain 为空时，
 * 从 forcedskin-adapter-formula/v1 的 code（JSON）中推断，保证接口总有可读展示信息。
 */

function trimStr(s: unknown): string {
  return typeof s === "string" ? s.trim() : "";
}

function parseFormulaCode(code: string): Record<string, unknown> | null {
  try {
    const p = JSON.parse(code);
    return p && typeof p === "object" && !Array.isArray(p) ? (p as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** 从 match.hostname 规则收集 value，去重后用 ", " 连接 */
function hostRulesToSiteDomain(formula: Record<string, unknown>): string {
  const match = formula.match;
  if (!match || typeof match !== "object" || Array.isArray(match)) return "";
  const hostname = (match as Record<string, unknown>).hostname;
  if (!Array.isArray(hostname)) return "";
  const values: string[] = [];
  for (const rule of hostname) {
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) continue;
    const v = (rule as Record<string, unknown>).value;
    if (typeof v === "string" && v.trim()) values.push(v.trim());
  }
  return [...new Set(values)].join(", ");
}

function titleizeSlug(slug: string): string {
  if (!slug) return "";
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * @param row — 来自 SiteAdapter 的选中字段
 * @returns 供扩展弹窗展示的 displayName / siteDomain（非空时优先 DB，否则从公式或 name 推断）
 */
export function resolveExtensionAdapterPresentation(row: {
  name: string;
  displayName: string;
  siteDomain: string;
  code: string;
}): { displayName: string; siteDomain: string } {
  let displayName = trimStr(row.displayName);
  let siteDomain = trimStr(row.siteDomain);
  const formula = parseFormulaCode(row.code);

  if (!siteDomain && formula) {
    siteDomain = hostRulesToSiteDomain(formula);
  }

  if (!displayName && formula) {
    const id = trimStr(formula.id);
    if (id) displayName = titleizeSlug(id);
  }
  if (!displayName) {
    const base = row.name.split("-")[0] || row.name;
    displayName = titleizeSlug(base) || row.name;
  }

  return { displayName, siteDomain };
}
