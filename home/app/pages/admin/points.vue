<script setup lang="ts">
import { doApi } from "~/utils/api";

definePageMeta({ layout: "admin", middleware: "admin" });
useAdminPageHead("积分管理 — ForcedSkin 后台");

interface PointRule {
  code: string;
  points: number;
  enabled: boolean;
  description: string;
  capPerUserPerDay: number | null;
}

interface LedgerRow {
  id: string;
  userId: string;
  delta: number;
  reasonCode: string;
  title: string | null;
  sourceType: string;
  sourceId: string | null;
  actorUserId: string | null;
  createdAt: string;
}

const tab = ref<"rules" | "adjust" | "ledger">("rules");
const loading = ref(true);
const rules = ref<PointRule[]>([]);
const savingRule = ref<string | null>(null);

const ledgerLoading = ref(false);
const ledgerList = ref<LedgerRow[]>([]);
const ledgerTotal = ref(0);
const ledgerPage = ref(1);
const filterUserId = ref("");
const filterReason = ref("");

const adjustForm = reactive({
  userId: "",
  delta: "" as string,
  note: "",
  idempotencyKey: "",
  submitting: false,
});

const toast = ref("");
const showToast = (msg: string) => {
  toast.value = msg;
  setTimeout(() => {
    toast.value = "";
  }, 2600);
};

async function loadRules() {
  loading.value = true;
  try {
    const res = await doApi.get<PointRule[]>("api/admin/points/rules");
    rules.value = Array.isArray(res) ? res : [];
  } catch {
    showToast("加载规则失败");
  } finally {
    loading.value = false;
  }
}

async function saveRule(rule: PointRule) {
  savingRule.value = rule.code;
  try {
    const cap = rule.capPerUserPerDay as unknown;
    const capOut =
      cap === "" || cap === undefined || cap === null || (typeof cap === "number" && Number.isNaN(cap))
        ? null
        : Math.max(0, Math.trunc(Number(cap)));

    await doApi.patch(`api/admin/points/rules/${encodeURIComponent(rule.code)}`, {
      points: rule.points,
      enabled: rule.enabled,
      description: rule.description,
      capPerUserPerDay: capOut,
    });
    showToast("已保存");
    await loadRules();
  } catch {
    showToast("保存失败");
  } finally {
    savingRule.value = null;
  }
}

async function loadLedger() {
  ledgerLoading.value = true;
  try {
    const q: Record<string, string | number> = { page: ledgerPage.value, pageSize: 30 };
    if (filterUserId.value.trim()) q.userId = filterUserId.value.trim();
    if (filterReason.value.trim()) q.reasonCode = filterReason.value.trim();
    const res = await doApi.get<any>("api/admin/points/ledger", q);
    ledgerList.value = res?.list || [];
    ledgerTotal.value = res?.total ?? 0;
  } catch {
    showToast("加载流水失败");
  } finally {
    ledgerLoading.value = false;
  }
}

async function submitAdjust() {
  const userId = adjustForm.userId.trim();
  const delta = Number(adjustForm.delta);
  if (!userId) {
    showToast("请填写用户 ID");
    return;
  }
  if (!Number.isFinite(delta) || delta === 0) {
    showToast("delta 须为非零数字");
    return;
  }
  let key = adjustForm.idempotencyKey.trim();
  if (!key) {
    key =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `k-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    adjustForm.idempotencyKey = key;
  }
  adjustForm.submitting = true;
  try {
    const res = await doApi.post<any>("api/admin/points/adjust", {
      userId,
      delta,
      note: adjustForm.note.trim(),
      idempotencyKey: key,
    });
    showToast(`已调整，实际变动 ${res?.delta ?? delta}，余额 ${res?.balanceAfter ?? "—"}`);
    adjustForm.delta = "";
    adjustForm.note = "";
    adjustForm.idempotencyKey = "";
    if (tab.value === "ledger") await loadLedger();
  } catch {
    showToast("调整失败（请检查用户 ID 或重复幂等键）");
  } finally {
    adjustForm.submitting = false;
  }
}

watch(tab, (t) => {
  if (t === "ledger") void loadLedger();
});

watch(ledgerPage, () => {
  if (tab.value === "ledger") void loadLedger();
});

onMounted(loadRules);
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-10">
    <h1 class="text-2xl font-bold text-foreground mb-6">积分管理</h1>

    <div class="flex gap-2 mb-6 flex-wrap">
      <button
        v-for="opt in [
          { k: 'rules', l: '规则配置' },
          { k: 'adjust', l: '人工调整' },
          { k: 'ledger', l: '流水检索' },
        ] as const"
        :key="opt.k"
        type="button"
        class="px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
        :class="tab === opt.k ? 'bg-primary-500 text-white border-primary-500' : 'border-border text-muted hover:bg-surface-muted'"
        @click="tab = opt.k"
      >
        {{ opt.l }}
      </button>
    </div>

    <!-- 规则 -->
    <section v-if="tab === 'rules'" class="space-y-3">
      <p class="text-sm text-muted mb-2">修改分值与开关后点击单行「保存」；提交类规则另有「同站每日首笔」防刷逻辑。</p>
      <div v-if="loading" class="h-40 rounded-xl bg-surface-muted animate-pulse" />
      <div
        v-for="rule in rules"
        :key="rule.code"
        class="p-4 rounded-xl border border-border bg-surface space-y-3"
      >
        <div class="flex flex-wrap items-center gap-2">
          <code class="text-xs bg-surface-muted px-2 py-0.5 rounded">{{ rule.code }}</code>
          <label class="flex items-center gap-1.5 text-sm text-muted">
            <input v-model="rule.enabled" type="checkbox" class="accent-primary-500" />
            启用
          </label>
        </div>
        <p class="text-xs text-muted">{{ rule.description }}</p>
        <div class="flex flex-wrap gap-3 items-end">
          <div>
            <label class="text-xs text-muted block mb-0.5">分值</label>
            <input
              v-model.number="rule.points"
              type="number"
              class="w-24 px-2 py-1.5 rounded-lg border border-border bg-background text-sm"
            />
          </div>
          <div>
            <label class="text-xs text-muted block mb-0.5">每日上限（可选，提交类）</label>
            <input
              v-model.number="rule.capPerUserPerDay"
              type="number"
              placeholder="留空不限制"
              class="w-32 px-2 py-1.5 rounded-lg border border-border bg-background text-sm"
            />
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="text-xs text-muted block mb-0.5">说明</label>
            <input v-model="rule.description" class="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm" />
          </div>
          <button
            type="button"
            class="px-3 py-2 rounded-lg bg-primary-500 text-white text-sm disabled:opacity-50"
            :disabled="savingRule === rule.code"
            @click="saveRule(rule)"
          >
            {{ savingRule === rule.code ? "保存中…" : "保存" }}
          </button>
        </div>
      </div>
    </section>

    <!-- 人工调整 -->
    <section v-else-if="tab === 'adjust'" class="max-w-lg space-y-4 p-5 rounded-2xl border border-border bg-surface">
      <p class="text-sm text-muted">每笔调整需唯一幂等键；重复提交相同键不会重复记账。</p>
      <div>
        <label class="text-xs text-muted block mb-1">用户 ID *</label>
        <input v-model="adjustForm.userId" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono" />
      </div>
      <div>
        <label class="text-xs text-muted block mb-1">变动值 delta *（正为加分，负为扣分）</label>
        <input v-model="adjustForm.delta" type="number" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
      </div>
      <div>
        <label class="text-xs text-muted block mb-1">备注（写入流水 meta）</label>
        <textarea v-model="adjustForm.note" rows="2" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none" />
      </div>
      <div>
        <label class="text-xs text-muted block mb-1">幂等键（可留空自动生成）</label>
        <input v-model="adjustForm.idempotencyKey" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono" />
      </div>
      <button
        type="button"
        class="w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-medium disabled:opacity-50"
        :disabled="adjustForm.submitting"
        @click="submitAdjust"
      >
        {{ adjustForm.submitting ? "提交中…" : "确认调整" }}
      </button>
    </section>

    <!-- 流水 -->
    <section v-else class="space-y-3">
      <div class="flex flex-wrap gap-2 items-end">
        <div>
          <label class="text-xs text-muted block mb-0.5">用户 ID</label>
          <input v-model="filterUserId" class="px-2 py-1.5 rounded-lg border border-border bg-background text-sm w-48 font-mono" />
        </div>
        <div>
          <label class="text-xs text-muted block mb-0.5">原因码</label>
          <input v-model="filterReason" placeholder="如 ADAPTER_REQUEST_SUBMITTED" class="px-2 py-1.5 rounded-lg border border-border bg-background text-sm w-56 font-mono" />
        </div>
        <button type="button" class="px-3 py-2 rounded-lg bg-primary-500 text-white text-sm" @click="ledgerPage = 1; loadLedger()">查询</button>
      </div>
      <div v-if="ledgerLoading" class="h-32 rounded-xl bg-surface-muted animate-pulse" />
      <div v-else class="overflow-x-auto rounded-xl border border-border">
        <table class="min-w-full text-sm">
          <thead class="bg-surface-muted/80 text-left text-xs text-muted">
            <tr>
              <th class="px-3 py-2">时间</th>
              <th class="px-3 py-2">用户</th>
              <th class="px-3 py-2">变动</th>
              <th class="px-3 py-2">原因</th>
              <th class="px-3 py-2">标题</th>
              <th class="px-3 py-2">来源</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in ledgerList" :key="row.id" class="border-t border-border">
              <td class="px-3 py-2 whitespace-nowrap text-muted">{{ new Date(row.createdAt).toLocaleString("zh-CN") }}</td>
              <td class="px-3 py-2 font-mono text-xs">{{ row.userId.slice(0, 8) }}…</td>
              <td class="px-3 py-2 font-medium" :class="row.delta >= 0 ? 'text-green-600' : 'text-red-500'">{{ row.delta >= 0 ? "+" : "" }}{{ row.delta }}</td>
              <td class="px-3 py-2 font-mono text-xs">{{ row.reasonCode }}</td>
              <td class="px-3 py-2">{{ row.title || "—" }}</td>
              <td class="px-3 py-2 text-xs text-muted">{{ row.sourceType }} {{ row.sourceId || "" }}</td>
            </tr>
            <tr v-if="ledgerList.length === 0">
              <td colspan="6" class="px-3 py-8 text-center text-muted">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-muted">共 {{ ledgerTotal }} 条</p>
      <div class="flex gap-2">
        <button type="button" class="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40" :disabled="ledgerPage <= 1" @click="ledgerPage--">上一页</button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40"
          :disabled="ledgerPage >= Math.ceil(ledgerTotal / 30) || ledgerTotal === 0"
          @click="ledgerPage++"
        >
          下一页
        </button>
      </div>
    </section>

    <Transition name="fade">
      <div
        v-if="toast"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium shadow-lg"
      >
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
