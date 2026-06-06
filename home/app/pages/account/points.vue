<script setup lang="ts">
import { doApi } from "~/utils/api";

definePageMeta({ layout: "default", middleware: "auth" });

useForcedSkinSeo("/account/points", {
  titleKey: "seo.account.title",
  descriptionKey: "seo.account.description",
  robots: "noindex, nofollow",
});

const localePath = useLocalePath();

interface LedgerRow {
  id: string;
  delta: number;
  balanceAfter: number | null;
  reasonCode: string;
  title: string | null;
  sourceType: string;
  sourceId: string | null;
  createdAt: string;
}

const loading = ref(true);
const list = ref<LedgerRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const sign = ref<"all" | "earn" | "spend">("all");
const summary = ref({
  availablePoints: 0,
  lifetimeEarned: 0,
  lifetimeSpent: 0,
});

const toast = ref("");
const showToast = (msg: string) => {
  toast.value = msg;
  setTimeout(() => {
    toast.value = "";
  }, 2200);
};

async function loadSummary() {
  try {
    const res = await doApi.get<any>("api/entry/user/points");
    summary.value = {
      availablePoints: res?.availablePoints ?? 0,
      lifetimeEarned: res?.lifetimeEarned ?? 0,
      lifetimeSpent: res?.lifetimeSpent ?? 0,
    };
  } catch {
    showToast("加载余额失败");
  }
}

async function loadLedger() {
  loading.value = true;
  try {
    const q: Record<string, string | number> = { page: page.value, pageSize };
    if (sign.value !== "all") q.sign = sign.value;
    const res = await doApi.get<any>("api/entry/user/points/ledger", q);
    list.value = res?.list || [];
    total.value = res?.total ?? 0;
  } catch {
    showToast("加载流水失败");
  } finally {
    loading.value = false;
  }
}

async function reload() {
  await loadSummary();
  await loadLedger();
}

watch([page, sign], () => {
  void loadLedger();
});

onMounted(() => {
  void reload();
});

const reasonLabel = (code: string) => {
  const m: Record<string, string> = {
    ADAPTER_REQUEST_SUBMITTED: "提交需求",
    ADAPTER_REQUEST_ACCEPTED: "需求受理",
    ADAPTER_REQUEST_COMPLETED: "需求闭环",
    ADAPTER_IMPLEMENTED: "适配实现",
    ADMIN_ADJUSTMENT: "管理员调整",
  };
  return m[code] || code;
};
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
    <div class="flex items-center justify-between gap-3 mb-8 flex-wrap">
      <div>
        <NuxtLink :to="localePath('/account')" class="text-sm text-primary-500 hover:underline mb-1 inline-block">← 返回账户</NuxtLink>
        <h1 class="text-xl sm:text-2xl font-bold text-foreground">我的积分</h1>
        <p class="text-muted text-sm mt-1">积分用于激励社区贡献，非现金；规则由运营配置，可在下方流水查看每笔来源。</p>
      </div>
    </div>

    <section class="rounded-2xl border border-border bg-surface p-5 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <p class="text-xs text-muted">当前可用</p>
        <p class="text-2xl font-bold text-foreground mt-0.5">{{ summary.availablePoints }}</p>
      </div>
      <div>
        <p class="text-xs text-muted">累计获得</p>
        <p class="text-lg font-semibold text-foreground mt-0.5">{{ summary.lifetimeEarned }}</p>
      </div>
      <div>
        <p class="text-xs text-muted">累计消耗</p>
        <p class="text-lg font-semibold text-foreground mt-0.5">{{ summary.lifetimeSpent }}</p>
      </div>
    </section>

    <div class="flex items-center gap-2 mb-4 flex-wrap">
      <span class="text-sm text-muted">筛选：</span>
      <div class="flex rounded-xl border border-border overflow-hidden text-sm">
        <button
          v-for="k in (['all', 'earn', 'spend'] as const)"
          :key="k"
          type="button"
          class="px-3 py-1.5 transition-colors"
          :class="sign === k ? 'bg-primary-500 text-white' : 'text-muted hover:bg-surface-muted'"
          @click="sign = k; page = 1"
        >
          {{ k === "all" ? "全部" : k === "earn" ? "获得" : "消耗" }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="space-y-2">
      <div v-for="i in 6" :key="i" class="h-14 rounded-xl bg-surface-muted animate-pulse" />
    </div>
    <ul v-else class="space-y-2">
      <li
        v-for="row in list"
        :key="row.id"
        class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-surface"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium text-foreground truncate">{{ row.title || reasonLabel(row.reasonCode) }}</p>
          <p class="text-xs text-muted mt-0.5">{{ new Date(row.createdAt).toLocaleString("zh-CN") }}</p>
        </div>
        <span
          class="text-sm font-semibold shrink-0"
          :class="row.delta >= 0 ? 'text-green-600' : 'text-red-500'"
        >
          {{ row.delta >= 0 ? "+" : "" }}{{ row.delta }}
        </span>
      </li>
      <li v-if="list.length === 0" class="text-center text-muted py-10 text-sm">暂无流水</li>
    </ul>

    <div v-if="total > pageSize" class="flex justify-center gap-2 mt-6">
      <button
        type="button"
        class="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40"
        :disabled="page <= 1"
        @click="page--"
      >
        上一页
      </button>
      <span class="text-sm text-muted self-center">{{ page }} / {{ Math.max(1, Math.ceil(total / pageSize)) }}</span>
      <button
        type="button"
        class="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40"
        :disabled="page >= Math.ceil(total / pageSize)"
        @click="page++"
      >
        下一页
      </button>
    </div>

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
