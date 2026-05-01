<script setup lang="ts">
import { doApi } from "~/utils/api";

definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "适配器管理 — ForcedSkin 后台", titleTemplate: false, meta: [{ name: "robots", content: "noindex, nofollow" }] });

interface Adapter { id: string; name: string; displayName: string; description: string; siteDomain: string; code: string; isActive: boolean; sortOrder: number; createdAt: string; }

const adapters = ref<Adapter[]>([]);
const loading = ref(true);
const filter = ref<"all" | "pending" | "active">("all");
const reviewing = ref<Adapter | null>(null);
const toast = ref("");

const showToast = (msg: string) => { toast.value = msg; setTimeout(() => { toast.value = ""; }, 2500); };

const filtered = computed(() => {
  if (filter.value === "pending") return adapters.value.filter((a) => !a.isActive);
  if (filter.value === "active") return adapters.value.filter((a) => a.isActive);
  return adapters.value;
});

async function load() {
  loading.value = true;
  try {
    const res = await doApi.get<any>("api/admin/adapters", { pageSize: 100, status: "all" });
    adapters.value = res.list || [];
  } finally { loading.value = false; }
}

async function approve(adapter: Adapter) {
  try {
    await doApi.patch(`api/admin/adapters/${adapter.id}`, { isActive: true });
    adapter.isActive = true;
    showToast(`已上线：${adapter.displayName}`);
  } catch {}
}

async function disable(adapter: Adapter) {
  try {
    await doApi.patch(`api/admin/adapters/${adapter.id}`, { isActive: false });
    adapter.isActive = false;
    showToast(`已下线：${adapter.displayName}`);
  } catch {}
}

async function remove(adapter: Adapter) {
  if (!confirm(`确认删除适配器「${adapter.displayName}」？`)) return;
  try {
    await doApi.delete(`api/admin/adapters/${adapter.id}`);
    showToast("已删除");
    await load();
  } catch {}
}

onMounted(load);
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-foreground">适配器管理</h1>
      <div class="flex rounded-xl border border-border overflow-hidden text-sm">
        <button v-for="opt in [{ k: 'all', l: '全部' }, { k: 'pending', l: '待审核' }, { k: 'active', l: '已上线' }]" :key="opt.k"
          @click="filter = opt.k as any"
          class="px-4 py-1.5 transition-colors"
          :class="filter === opt.k ? 'bg-primary-500 text-white' : 'text-muted hover:bg-surface-muted'"
        >{{ opt.l }}</button>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-20 rounded-xl bg-surface-muted animate-pulse"></div>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="adapter in filtered"
        :key="adapter.id"
        class="p-4 rounded-xl border border-border bg-surface hover:bg-surface-muted transition-colors"
      >
        <div class="flex items-start gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium text-foreground">{{ adapter.displayName }}</span>
              <span class="text-xs text-muted bg-surface-muted px-1.5 py-0.5 rounded">{{ adapter.name }}</span>
              <span class="text-xs px-1.5 py-0.5 rounded font-medium"
                :class="adapter.isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
                {{ adapter.isActive ? '已上线' : '待审核' }}
              </span>
            </div>
            <p class="text-muted text-xs mt-0.5">{{ adapter.siteDomain }}</p>
            <p v-if="adapter.description" class="text-muted text-xs mt-1 truncate">{{ adapter.description }}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button @click="reviewing = adapter" class="px-3 py-1 rounded-lg text-xs border border-border text-muted hover:text-foreground transition-colors">查看代码</button>
            <button v-if="!adapter.isActive" @click="approve(adapter)" class="px-3 py-1 rounded-lg text-xs bg-green-500 text-white hover:bg-green-600 transition-colors">上线</button>
            <button v-else @click="disable(adapter)" class="px-3 py-1 rounded-lg text-xs border border-yellow-400 text-yellow-600 hover:bg-yellow-50 transition-colors">下线</button>
            <button @click="remove(adapter)" class="px-3 py-1 rounded-lg text-xs border border-red-200 text-red-500 hover:bg-red-50 transition-colors">删除</button>
          </div>
        </div>
      </div>
      <div v-if="filtered.length === 0" class="text-center py-12 text-muted">暂无数据</div>
    </div>

    <!-- 代码查看弹窗 -->
    <div v-if="reviewing" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="reviewing = null">
      <div class="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 class="font-bold text-foreground">{{ reviewing.displayName }} — 适配代码</h2>
          <button @click="reviewing = null" class="text-muted hover:text-foreground">✕</button>
        </div>
        <div class="flex-1 overflow-auto p-5">
          <pre class="text-xs font-mono text-foreground whitespace-pre-wrap">{{ reviewing.code }}</pre>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium shadow-lg">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
