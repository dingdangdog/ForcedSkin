<script setup lang="ts">
import { doApi } from "~/utils/api";

definePageMeta({ layout: "admin", middleware: "admin" });
useAdminPageHead("适配需求管理 — ForcedSkin 后台");

interface AdapterRequest {
  id: string;
  submitterId: string;
  siteDomain: string;
  selectedElements: string;
  feedback: string;
  status: "pending" | "processing" | "completed" | "rejected";
  source: "extension" | "website";
  adminNote: string | null;
  adapterId: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

const loading = ref(true);
const requests = ref<AdapterRequest[]>([]);
const status = ref<"all" | "pending" | "processing" | "completed" | "rejected">("all");
const toast = ref("");
const savingId = ref<string | null>(null);
const draftNote = reactive<Record<string, string>>({});

const showToast = (msg: string) => {
  toast.value = msg;
  setTimeout(() => {
    if (toast.value === msg) toast.value = "";
  }, 2200);
};

const filtered = computed(() => {
  if (status.value === "all") return requests.value;
  return requests.value.filter((r) => r.status === status.value);
});

const sourceLabel = (s: string) => (s === "extension" ? "扩展" : "官网");
const statusLabel = (s: string) => {
  if (s === "pending") return "待处理";
  if (s === "processing") return "处理中";
  if (s === "completed") return "已完成";
  return "已拒绝";
};

function parseElements(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => (typeof x?.selector === "string" ? x.selector.trim() : ""))
      .filter(Boolean)
      .slice(0, 8);
  } catch {
    return [];
  }
}

async function load() {
  loading.value = true;
  try {
    const res = await doApi.get<any>("api/admin/adapter-requests", { pageSize: 500, status: "all" });
    requests.value = res.list || [];
    requests.value.forEach((r) => {
      draftNote[r.id] = r.adminNote || "";
    });
  } finally {
    loading.value = false;
  }
}

async function updateStatus(item: AdapterRequest, next: AdapterRequest["status"]) {
  savingId.value = item.id;
  try {
    await doApi.patch(`api/admin/adapter-requests/${item.id}`, {
      status: next,
      adminNote: draftNote[item.id] || "",
    });
    showToast("已更新");
    await load();
  } catch {
    showToast("更新失败");
  } finally {
    savingId.value = null;
  }
}

onMounted(load);
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <h1 class="text-2xl font-bold text-foreground">适配需求管理</h1>
      <div class="flex rounded-xl border border-border overflow-hidden text-sm">
        <button
          v-for="k in ['all', 'pending', 'processing', 'completed', 'rejected']"
          :key="k"
          class="px-3 py-1.5 transition-colors"
          :class="status === k ? 'bg-primary-500 text-white' : 'text-muted hover:bg-surface-muted'"
          @click="status = k as any"
        >
          {{ k === 'all' ? '全部' : statusLabel(k) }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-24 rounded-xl bg-surface-muted animate-pulse"></div>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in filtered"
        :key="item.id"
        class="p-4 rounded-xl border border-border bg-surface"
      >
        <div class="flex items-center gap-2 flex-wrap mb-2">
          <span class="text-sm font-semibold text-foreground">{{ item.siteDomain }}</span>
          <span class="text-xs px-1.5 py-0.5 rounded bg-surface-muted text-muted">{{ sourceLabel(item.source) }}</span>
          <span class="text-xs px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700">{{ statusLabel(item.status) }}</span>
          <span class="text-xs text-muted ml-auto">{{ new Date(item.createdAt).toLocaleString("zh-CN") }}</span>
        </div>

        <p class="text-sm text-foreground leading-relaxed">{{ item.feedback }}</p>

        <div class="mt-2 text-xs text-muted">
          <span class="font-medium">选中元素：</span>
          <span>{{ parseElements(item.selectedElements).join(" | ") || "（无）" }}</span>
        </div>

        <div class="mt-3 flex items-center gap-2 flex-wrap">
          <input
            v-model="draftNote[item.id]"
            class="flex-1 min-w-[220px] px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm"
            placeholder="管理员备注（可写 AI 处理建议）"
          />
          <button class="px-2.5 py-1 rounded text-xs border border-border" :disabled="savingId === item.id" @click="updateStatus(item, 'processing')">处理中</button>
          <button class="px-2.5 py-1 rounded text-xs bg-green-500 text-white" :disabled="savingId === item.id" @click="updateStatus(item, 'completed')">完成</button>
          <button class="px-2.5 py-1 rounded text-xs border border-red-200 text-red-600" :disabled="savingId === item.id" @click="updateStatus(item, 'rejected')">拒绝</button>
        </div>
      </div>

      <div v-if="filtered.length === 0" class="text-center text-muted py-14">暂无适配需求</div>
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
.fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>

