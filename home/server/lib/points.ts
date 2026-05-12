import prisma from "~~/server/lib/prisma";

/** 兼容 Accelerate 等扩展后的 $transaction 客户端类型 */
type TransactionCallback = Parameters<typeof prisma.$transaction>[0];
export type PointTx = TransactionCallback extends (client: infer C) => unknown ? C : never;

/** 与 PointRule / 业务事件对齐 */
export const POINT_REASON = {
  ADAPTER_REQUEST_SUBMITTED: "ADAPTER_REQUEST_SUBMITTED",
  ADAPTER_REQUEST_ACCEPTED: "ADAPTER_REQUEST_ACCEPTED",
  ADAPTER_REQUEST_COMPLETED: "ADAPTER_REQUEST_COMPLETED",
  ADAPTER_IMPLEMENTED: "ADAPTER_IMPLEMENTED",
  ADMIN_ADJUSTMENT: "ADMIN_ADJUSTMENT",
} as const;

const DEFAULT_RULES: Array<{
  code: string;
  points: number;
  enabled: boolean;
  description: string;
  capPerUserPerDay: number | null;
}> = [
  { code: POINT_REASON.ADAPTER_REQUEST_SUBMITTED, points: 8, enabled: true, description: "成功提交适配需求", capPerUserPerDay: null },
  { code: POINT_REASON.ADAPTER_REQUEST_ACCEPTED, points: 5, enabled: true, description: "需求已被受理并进入处理", capPerUserPerDay: null },
  { code: POINT_REASON.ADAPTER_REQUEST_COMPLETED, points: 35, enabled: true, description: "需求已闭环（适配器已上线）", capPerUserPerDay: null },
  { code: POINT_REASON.ADAPTER_IMPLEMENTED, points: 50, enabled: true, description: "实现并上线关联适配器", capPerUserPerDay: null },
  { code: POINT_REASON.ADMIN_ADJUSTMENT, points: 0, enabled: true, description: "管理员人工调整", capPerUserPerDay: null },
];

export function ledgerTitleForReason(code: string): string {
  const map: Record<string, string> = {
    [POINT_REASON.ADAPTER_REQUEST_SUBMITTED]: "提交适配需求",
    [POINT_REASON.ADAPTER_REQUEST_ACCEPTED]: "需求已受理",
    [POINT_REASON.ADAPTER_REQUEST_COMPLETED]: "需求闭环奖励",
    [POINT_REASON.ADAPTER_IMPLEMENTED]: "适配实现奖励",
    [POINT_REASON.ADMIN_ADJUSTMENT]: "管理员调整",
  };
  return map[code] || code;
}

export async function ensureDefaultPointRules(tx: PointTx) {
  for (const r of DEFAULT_RULES) {
    await tx.pointRule.upsert({
      where: { code: r.code },
      create: r,
      update: {
        description: r.description,
      },
    });
  }
}

function startOfUtcDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

async function getAvailableBalance(tx: PointTx, userId: string): Promise<number> {
  const row = await tx.userPointsBalance.findUnique({ where: { userId } });
  return row?.availablePoints ?? 0;
}

export type ApplyPointsInput = {
  userId: string;
  reasonCode: string;
  /** 仅 ADMIN_ADJUSTMENT：可正可负 */
  deltaOverride?: number;
  idempotencyKey: string;
  title?: string | null;
  meta?: Record<string, unknown> | null;
  sourceType: string;
  sourceId?: string | null;
  actorUserId?: string | null;
  /** 提交分：同用户同站 UTC 当日仅首笔加分（防刷） */
  siteDomainForSubmitCap?: string;
};

export async function applyPointsInTx(
  tx: PointTx,
  input: ApplyPointsInput,
): Promise<{ applied: boolean; delta: number; balanceAfter: number }> {
  await ensureDefaultPointRules(tx);

  const dup = await tx.pointLedger.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (dup) {
    const bal = await getAvailableBalance(tx, input.userId);
    return { applied: false, delta: 0, balanceAfter: bal };
  }

  let delta = 0;
  if (input.reasonCode === POINT_REASON.ADMIN_ADJUSTMENT) {
    if (input.deltaOverride === undefined || input.deltaOverride === null) {
      const bal = await getAvailableBalance(tx, input.userId);
      return { applied: false, delta: 0, balanceAfter: bal };
    }
    delta = Math.trunc(input.deltaOverride);
  } else {
    const rule = await tx.pointRule.findUnique({ where: { code: input.reasonCode } });
    if (!rule?.enabled) {
      const bal = await getAvailableBalance(tx, input.userId);
      return { applied: false, delta: 0, balanceAfter: bal };
    }
    delta = rule.points;
  }

  if (delta === 0) {
    const bal = await getAvailableBalance(tx, input.userId);
    return { applied: false, delta: 0, balanceAfter: bal };
  }

  if (input.reasonCode === POINT_REASON.ADAPTER_REQUEST_SUBMITTED && input.siteDomainForSubmitCap) {
    const rule = await tx.pointRule.findUnique({ where: { code: input.reasonCode } });
    const maxPerSiteDay = 1;
    const since = startOfUtcDay();
    const sameSiteToday = await tx.pointLedger.count({
      where: {
        userId: input.userId,
        reasonCode: POINT_REASON.ADAPTER_REQUEST_SUBMITTED,
        createdAt: { gte: since },
        meta: { path: ["siteDomain"], equals: input.siteDomainForSubmitCap },
      },
    });
    if (sameSiteToday >= maxPerSiteDay) {
      const bal = await getAvailableBalance(tx, input.userId);
      return { applied: false, delta: 0, balanceAfter: bal };
    }
    if (rule?.capPerUserPerDay != null && rule.capPerUserPerDay > 0) {
      const totalToday = await tx.pointLedger.count({
        where: {
          userId: input.userId,
          reasonCode: POINT_REASON.ADAPTER_REQUEST_SUBMITTED,
          createdAt: { gte: since },
        },
      });
      if (totalToday >= rule.capPerUserPerDay) {
        const bal = await getAvailableBalance(tx, input.userId);
        return { applied: false, delta: 0, balanceAfter: bal };
      }
    }
  }

  const prev = await getAvailableBalance(tx, input.userId);
  const next = prev + delta;

  if (input.reasonCode !== POINT_REASON.ADMIN_ADJUSTMENT && next < 0) {
    return { applied: false, delta: 0, balanceAfter: prev };
  }

  const title = input.title ?? ledgerTitleForReason(input.reasonCode);

  await tx.pointLedger.create({
    data: {
      userId: input.userId,
      delta,
      balanceAfter: next,
      reasonCode: input.reasonCode,
      title,
      meta: input.meta === undefined || input.meta === null ? undefined : (input.meta as object),
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? undefined,
      actorUserId: input.actorUserId ?? undefined,
      idempotencyKey: input.idempotencyKey,
    },
  });

  const earnedInc = delta > 0 ? delta : 0;
  const spentInc = delta < 0 ? -delta : 0;

  await tx.userPointsBalance.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      availablePoints: next,
      frozenPoints: 0,
      lifetimeEarned: earnedInc,
      lifetimeSpent: spentInc,
    },
    update: {
      availablePoints: next,
      lifetimeEarned: { increment: earnedInc },
      lifetimeSpent: { increment: spentInc },
    },
  });

  return { applied: true, delta, balanceAfter: next };
}

/** pending → processing 时调用 */
export async function tryAwardAdapterRequestAccepted(
  tx: PointTx,
  params: { requestId: string; submitterId: string; actorUserId: string | null },
) {
  return applyPointsInTx(tx, {
    userId: params.submitterId,
    reasonCode: POINT_REASON.ADAPTER_REQUEST_ACCEPTED,
    idempotencyKey: `accepted:${params.requestId}`,
    sourceType: "adapter_request",
    sourceId: params.requestId,
    actorUserId: params.actorUserId,
    meta: { requestId: params.requestId },
  });
}

/**
 * 需求闭环：已关联适配器且适配器已上线时，给提交者与实现者加分。
 */
export async function tryAwardAdapterRequestClosure(
  tx: PointTx,
  params: { requestId: string; actorUserId: string | null },
) {
  const request = await tx.adapterRequest.findUnique({ where: { id: params.requestId } });
  if (!request?.adapterId) return;

  const adapter = await tx.siteAdapter.findUnique({ where: { id: request.adapterId } });
  if (!adapter?.isActive) return;

  const submitterId = request.submitterId;
  const implId = adapter.implementedByUserId || request.implementedByUserId || null;

  await applyPointsInTx(tx, {
    userId: submitterId,
    reasonCode: POINT_REASON.ADAPTER_REQUEST_COMPLETED,
    idempotencyKey: `complete:submitter:${params.requestId}`,
    sourceType: "adapter_request",
    sourceId: params.requestId,
    actorUserId: params.actorUserId,
    meta: { requestId: params.requestId, adapterId: adapter.id },
  });

  if (implId) {
    await applyPointsInTx(tx, {
      userId: implId,
      reasonCode: POINT_REASON.ADAPTER_IMPLEMENTED,
      idempotencyKey: `implemented:${adapter.id}:${implId}`,
      sourceType: "site_adapter",
      sourceId: adapter.id,
      actorUserId: params.actorUserId,
      meta: { requestId: params.requestId, adapterId: adapter.id },
    });
  }
}

/** 适配器上线后：根据 derivedFromRequestId / 反查 adapter_requests 尝试闭环发分 */
export async function tryAwardClosureForAdapterId(
  tx: PointTx,
  adapterId: string,
  actorUserId: string | null,
) {
  const adapter = await tx.siteAdapter.findUnique({ where: { id: adapterId } });
  if (!adapter?.isActive) return;

  const ids = new Set<string>();
  if (adapter.derivedFromRequestId) ids.add(adapter.derivedFromRequestId);

  const linked = await tx.adapterRequest.findMany({
    where: { adapterId: adapter.id },
    select: { id: true },
  });
  linked.forEach((r) => ids.add(r.id));

  for (const rid of ids) {
    await tryAwardAdapterRequestClosure(tx, { requestId: rid, actorUserId });
  }
}
