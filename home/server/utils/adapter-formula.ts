/** 扩展端与服务端共用的声明式适配器 schema（仅存 JSON，不存可执行 JS） */

export const ADAPTER_FORMULA_SCHEMA = "forcedskin-adapter-formula/v1" as const;

const LAYER_KINDS = new Set([
  "surface",
  "accent",
  "canvas",
  "richText",
  "svgRecolor",
]);

const HOST_OPS = new Set(["equals", "suffixDomain"]);

export interface AdapterFormulaValidation {
  ok: boolean;
  error?: string;
}

/** 校验适配器「公式」JSON（写入 SiteAdapter.code 的内容应为合法 JSON 字符串） */
export function validateAdapterFormulaPayload(parsed: unknown): AdapterFormulaValidation {
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "适配器须为 JSON 对象（forcedskin-adapter-formula/v1）" };
  }
  const o = parsed as Record<string, unknown>;
  if (o.schema !== ADAPTER_FORMULA_SCHEMA) {
    return { ok: false, error: `schema 必须为 "${ADAPTER_FORMULA_SCHEMA}"` };
  }
  if (typeof o.id !== "string" || !o.id.trim()) {
    return { ok: false, error: "缺少 id（英文字符串）" };
  }
  if (o.priority !== undefined && (typeof o.priority !== "number" || Number.isNaN(o.priority))) {
    return { ok: false, error: "priority 必须为数字" };
  }

  const match = o.match;
  if (!match || typeof match !== "object") {
    return { ok: false, error: "缺少 match 对象" };
  }
  const hostname = (match as Record<string, unknown>).hostname;
  if (!Array.isArray(hostname) || hostname.length === 0) {
    return { ok: false, error: "match.hostname 必须为非空数组" };
  }
  for (const rule of hostname) {
    if (!rule || typeof rule !== "object") return { ok: false, error: "hostname 规则格式无效" };
    const r = rule as Record<string, unknown>;
    if (typeof r.op !== "string" || !HOST_OPS.has(r.op)) {
      return { ok: false, error: `hostname 规则 op 仅支持: ${[...HOST_OPS].join(", ")}` };
    }
    if (typeof r.value !== "string" || !r.value.trim()) {
      return { ok: false, error: "hostname 规则 value 不能为空" };
    }
  }

  const layers = o.layers;
  if (!Array.isArray(layers) || layers.length === 0) {
    return { ok: false, error: "layers 必须为非空数组" };
  }

  for (const layer of layers) {
    if (!layer || typeof layer !== "object") return { ok: false, error: "layer 格式无效" };
    const L = layer as Record<string, unknown>;
    if (typeof L.kind !== "string" || !LAYER_KINDS.has(L.kind)) {
      return { ok: false, error: `layer.kind 无效，允许: ${[...LAYER_KINDS].join(", ")}` };
    }

    const selectors = L.selectors;
    if (!Array.isArray(selectors) || selectors.length === 0) {
      return { ok: false, error: `layer(${L.kind}) 缺少 selectors 数组` };
    }
    if (!selectors.every((s) => typeof s === "string" && s.trim())) {
      return { ok: false, error: "selectors 必须为非空字符串数组" };
    }

    if (L.kind === "richText") {
      const vars = L.cssVars;
      if (!vars || typeof vars !== "object") return { ok: false, error: "richText 须包含 cssVars 对象" };
      for (const v of Object.values(vars)) {
        if (typeof v !== "string" || !v.trim()) return { ok: false, error: "richText cssVars 的值须为调色板键名字符串" };
      }
      if (L.color !== undefined && typeof L.color !== "string") {
        return { ok: false, error: "richText.color 须为调色板键名" };
      }
    }

    if (L.kind === "surface" && L.skipOverlayLike !== undefined && typeof L.skipOverlayLike !== "boolean") {
      return { ok: false, error: "surface.skipOverlayLike 须为布尔值" };
    }
  }

  return { ok: true };
}

export function validateAdapterFormulaCodeString(code: string): AdapterFormulaValidation {
  const trimmed = (code || "").trim();
  if (!trimmed.startsWith("{")) {
    return { ok: false, error: "适配器 code 须为 JSON 公式（以 { 开头），不再接受 JavaScript 源码" };
  }
  try {
    const parsed = JSON.parse(trimmed);
    return validateAdapterFormulaPayload(parsed);
  } catch {
    return { ok: false, error: "code 不是合法 JSON" };
  }
}
