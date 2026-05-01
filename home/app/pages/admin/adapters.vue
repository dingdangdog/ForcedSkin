<script setup lang="ts">
import { doApi } from "~/utils/api";
import { copyTextToClipboard } from "~/utils/clipboard";

definePageMeta({ layout: "admin", middleware: "admin" });
useAdminPageHead("适配器管理 — ForcedSkin 后台");

const localePath = useLocalePath();

interface Adapter {
  id: string;
  name: string;
  displayName: string;
  description: string;
  siteDomain: string;
  code: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const adapters = ref<Adapter[]>([]);
const loading = ref(true);
const filter = ref<"all" | "pending" | "active">("all");
const showForm = ref(false);
const editingAdapter = ref<Adapter | null>(null);
const saving = ref(false);
const toast = ref("");

const form = reactive({
  displayName: "",
  description: "",
  siteDomain: "",
  code: "",
  sortOrder: 0,
});

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

function openEdit(adapter: Adapter) {
  editingAdapter.value = adapter;
  Object.assign(form, {
    displayName: adapter.displayName,
    description: adapter.description || "",
    siteDomain: adapter.siteDomain,
    code: adapter.code,
    sortOrder: adapter.sortOrder,
  });
  showForm.value = true;
}

async function save() {
  const a = editingAdapter.value;
  if (!a) return;
  const displayName = form.displayName.trim();
  const siteDomain = form.siteDomain.trim();
  const code = form.code.trim();
  if (!displayName || !siteDomain || !code) {
    showToast("请填写显示名称、域名与适配代码");
    return;
  }
  saving.value = true;
  try {
    await doApi.patch(`api/admin/adapters/${a.id}`, {
      displayName,
      description: form.description,
      siteDomain,
      code: form.code,
      sortOrder: Number(form.sortOrder) || 0,
    });
    showToast("已保存");
    showForm.value = false;
    await load();
  } catch {
    showToast("保存失败（请检查公式代码是否有效）");
  } finally {
    saving.value = false;
  }
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

async function copyAdapterCode() {
  const ok = await copyTextToClipboard(form.code);
  showToast(ok ? "已复制代码" : "复制失败");
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
          <div class="flex flex-wrap items-center gap-2 shrink-0 max-sm:w-full max-sm:justify-end">
            <button @click="openEdit(adapter)" class="px-3 py-1 rounded-lg text-xs border border-border text-muted hover:text-foreground hover:bg-surface-muted transition-colors">编辑</button>
            <button v-if="!adapter.isActive" @click="approve(adapter)" class="px-3 py-1 rounded-lg text-xs bg-green-500 text-white hover:bg-green-600 transition-colors">上线</button>
            <button v-else @click="disable(adapter)" class="px-3 py-1 rounded-lg text-xs border border-yellow-400 text-yellow-600 hover:bg-yellow-50 transition-colors">下线</button>
            <button @click="remove(adapter)" class="px-3 py-1 rounded-lg text-xs border border-red-200 text-red-500 hover:bg-red-50 transition-colors">删除</button>
          </div>
        </div>
      </div>
      <div v-if="filtered.length === 0" class="text-center py-12 text-muted">暂无数据</div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showForm && editingAdapter" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="showForm = false">
      <div class="bg-background border border-border rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6">
        <div class="flex items-start justify-between gap-3 mb-4">
          <h2 class="font-bold text-foreground text-lg min-w-0">编辑适配器：{{ editingAdapter.displayName }}</h2>
          <button type="button" class="p-1.5 text-muted hover:text-foreground shrink-0" aria-label="关闭" @click="showForm = false">✕</button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="text-xs text-muted mb-1 block">标识 name（只读）</label>
            <input :value="editingAdapter.name" readonly class="w-full px-3 py-2 rounded-lg border border-border bg-surface-muted text-muted text-sm cursor-not-allowed"/>
          </div>
          <div>
            <label class="text-xs text-muted mb-1 block">显示名称 *</label>
            <input v-model="form.displayName" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:border-primary-400"/>
          </div>
          <div>
            <label class="text-xs text-muted mb-1 block">支持域名 * <span class="text-muted font-normal">（逗号分隔）</span></label>
            <input v-model="form.siteDomain" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:border-primary-400"/>
          </div>
          <div>
            <label class="text-xs text-muted mb-1 block">描述</label>
            <input v-model="form.description" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:border-primary-400"/>
          </div>
          <div class="flex items-center gap-3">
            <label class="text-xs text-muted shrink-0">排序</label>
            <input type="number" v-model="form.sortOrder" class="w-20 px-2 py-1.5 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none"/>
          </div>
          <div>
            <div class="flex items-start justify-between gap-2 mb-1">
              <label class="text-xs text-muted block flex-1 min-w-0">
                适配公式代码 *
                <NuxtLink :to="localePath('/guide/adapter')" target="_blank" class="ml-1 text-primary-500 hover:underline">查看规范 →</NuxtLink>
              </label>
              <button
                type="button"
                class="shrink-0 px-2.5 py-1 rounded-lg text-xs border border-border text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                @click="copyAdapterCode"
              >
                复制代码
              </button>
            </div>
            <textarea v-model="form.code" rows="14" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-xs font-mono focus:outline-none focus:border-primary-400 resize-y"/>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="save" :disabled="saving" class="flex-1 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-60 transition-colors">
            {{ saving ? '保存中...' : '保存' }}
          </button>
          <button @click="showForm = false" class="px-4 py-2.5 rounded-xl border border-border text-muted hover:text-foreground transition-colors">取消</button>
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
