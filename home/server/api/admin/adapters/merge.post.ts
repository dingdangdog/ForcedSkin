import prisma from "~~/server/lib/prisma";
import { success, error, serverError } from "~~/server/utils/result";
import { validateAdapterFormulaPayload } from "~~/server/utils/adapter-formula";

/**
 * 管理员合并适配器：将 sourceId 的层合并到 targetId 中
 * 合并策略：逐层合并 selectors 数组（去重）
 * 合并后 source 标记 parentId = targetId, isActive = false (下线)
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { sourceId, targetId } = body || {};

  if (!sourceId || !targetId) return error("缺少 sourceId 或 targetId");
  if (sourceId === targetId) return error("不能合并自己");

  try {
    const [source, target] = await Promise.all([
      prisma.siteAdapter.findUnique({ where: { id: sourceId } }),
      prisma.siteAdapter.findUnique({ where: { id: targetId } }),
    ]);

    if (!source) return error("源适配器不存在");
    if (!target) return error("目标适配器不存在");

    // 解析两个公式的 JSON
    let sourceFormula: any, targetFormula: any;
    try {
      sourceFormula = JSON.parse(source.code);
      targetFormula = JSON.parse(target.code);
    } catch {
      return error("公式解析失败，请确认两个适配器都是合法的 JSON 格式");
    }

    if (sourceFormula.schema !== "forcedskin-adapter-formula/v1" ||
        targetFormula.schema !== "forcedskin-adapter-formula/v1") {
      return error("仅支持 forcedskin-adapter-formula/v1 格式的合并");
    }

    // 合并逻辑：逐层合并 selectors（去重）
    const sourceLayers = sourceFormula.layers || [];
    const targetLayers = targetFormula.layers || [];
    const mergedLayers: any[] = [];

    // 按 kind 分组
    const kindMap = new Map<string, Set<string>>();
    const layerMeta = new Map<string, any>();

    for (const layer of [...targetLayers, ...sourceLayers]) {
      const kind = layer.kind;
      if (!kind) continue;

      if (!kindMap.has(kind)) {
        kindMap.set(kind, new Set());
        layerMeta.set(kind, { ...layer });
      }

      const selectors = (layer.selectors || []) as string[];
      for (const s of selectors) {
        if (typeof s === "string" && s.trim()) kindMap.get(kind)!.add(s.trim());
      }

      // 保留额外属性（如 richText.cssVars、surface.skipOverlayLike 等）
      const existing = layerMeta.get(kind)!;
      for (const [k, v] of Object.entries(layer)) {
        if (k !== "kind" && k !== "selectors" && v !== undefined) {
          existing[k] = v;
        }
      }
    }

    for (const [kind, selectors] of kindMap) {
      const meta = layerMeta.get(kind) || {};
      mergedLayers.push({
        kind,
        ...meta,
        selectors: Array.from(selectors),
      });
    }

    targetFormula.layers = mergedLayers;
    const mergedCode = JSON.stringify(targetFormula, null, 2);

    // 验证合并结果
    const parsed = JSON.parse(mergedCode);
    const validation = validateAdapterFormulaPayload(parsed);
    if (!validation.ok) return error(`合并后的公式无效: ${validation.error}`);

    // 更新目标适配器
    await prisma.siteAdapter.update({
      where: { id: targetId },
      data: {
        code: mergedCode,
        description: target.description
          ? `${target.description}（已合并 ${source.displayName} 的贡献）`
          : `已合并 ${source.displayName} 的贡献`,
      },
    });

    // 标记源适配器为已合并（下线 + parentId）
    await prisma.siteAdapter.update({
      where: { id: sourceId },
      data: {
        isActive: false,
        parentId: targetId,
        rejectionReason: `已合并到「${target.displayName}」`,
        reviewedAt: new Date(),
      },
    });

    return success({ merged: true, targetId, sourceId });
  } catch (err: any) {
    if (err.code === "P2025") return error("适配器不存在");
    return serverError("合并失败", err, "admin/adapters/merge.post");
  }
});
