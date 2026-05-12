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
  source: string;
  rejectionReason: string | null;
  parentId: string | null;
  derivedFromRequestId: string | null;
  implementedByUserId: string | null;
  createdAt: string;
}

const adapters = ref<Adapter[]>([]);
const loading = ref(true);
const filter = ref<"all" | "pending" | "active" | "rejected">("all");
const groupByDomain = ref(true);
const showForm = ref(false);
const editingAdapter = ref<Adapter | null>(null);
const saving = ref(false);
const toast = ref("");

const mergeForm = reactive({
  show: false,
  source: null as Adapter | null,
  target: null as Adapter | null,
  processing: false,
});

const form = reactive({
  displayName: "",
  description: "",
  siteDomain: "",
  code: "",
  sortOrder: 0,
  derivedFromRequestId: "",
  implementedByUserId: "",
});

const rejectForm = reactive({
  show: false,
  adapter: null as Adapter | null,
  reason: "",
});

const showToast = (msg: string) => { toast.value = msg; setTimeout(() => { toast.value = ""; }, 2500); };

const filtered = computed(() => {
  let list = adapters.value;
  if (filter.value === "pending") list = list.filter((a) => !a.isActive && !a.rejectionReason);
  else if (filter.value === "rejected") list = list.filter((a) => a.rejectionReason);
  else if (filter.value === "active") list = list.filter((a) => a.isActive);
  return list;
});

// 按域名分组
const domainGroups = computed(() => {
  const groups = new Map<string, Adapter[]>();
  for (const a of filtered.value) {
    const domain = a.siteDomain || "未知域名";
    if (!groups.has(domain)) groups.set(domain, []);
    groups.get(domain)!.push(a);
  }
  return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
});

const sourceLabel = (s: string) => s === "extension" ? "扩展" : "网页";

/** 同域名下是否存在「其他」已上线适配器（用于合并目标） */
function hasOtherActiveOnSameDomain(adapter: Adapter): boolean {
  return adapters.value.some(
    (a) => a.id !== adapter.id && a.siteDomain === adapter.siteDomain && a.isActive,
  );
}

async function load() {
  loading.value = true;
  try {
    const res = await doApi.get<any>("api/admin/adapters", { pageSize: 500, status: "all" });
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
    derivedFromRequestId: adapter.derivedFromRequestId || "",
    implementedByUserId: adapter.implementedByUserId || "",
  });
  showForm.value = true;
}

/**
 * 将 source 的公式层合并到同域名的某一已上线适配器中。
 * source 可为待审核或已上线；目标必须已上线（与 merge.post 一致）。
 */
function openMerge(source: Adapter) {
  const sameDomain = adapters.value.filter(
    (a) => a.id !== source.id && a.siteDomain === source.siteDomain && a.isActive
  );
  if (sameDomain.length === 0) {
    showToast("没有同域名的已上线适配器可作为合并目标");
    return;
  }
  mergeForm.source = source;
  mergeForm.target = sameDomain[0];
  mergeForm.show = true;
}

async function confirmMerge() {
  if (!mergeForm.source || !mergeForm.target) return;
  mergeForm.processing = true;
  try {
    await doApi.post("api/admin/adapters/merge", {
      sourceId: mergeForm.source.id,
      targetId: mergeForm.target.id,
    });
    showToast(`已合并「${mergeForm.source.displayName}」到「${mergeForm.target.displayName}」`);
    mergeForm.show = false;
    await load();
  } catch {
    showToast("合并失败");
  } finally {
    mergeForm.processing = false;
  }
}

function openReject(adapter: Adapter) {
  rejectForm.adapter = adapter;
  rejectForm.reason = "";
  rejectForm.show = true;
}

async function confirmReject() {
  const a = rejectForm.adapter;
  if (!a || !rejectForm.reason.trim()) {
    showToast("请填写拒绝原因");
    return;
  }
  try {
    await doApi.patch(`api/admin/adapters/${a.id}`, { isActive: false, rejectionReason: rejectForm.reason.trim() });
    showToast(`已拒绝：${a.displayName}`);
    rejectForm.show = false;
    await load();
  } catch {
    showToast("操作失败");
  }
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
      derivedFromRequestId: (form.derivedFromRequestId || "").trim() || null,
      implementedByUserId: (form.implementedByUserId || "").trim() || null,
    });
    showToast("已保存");
    showForm.value = false;
    await load();
  } catch {
    showToast("保存失败（请检查公式代码是否有效）");
  } finally { saving.value = false; }
}

async function approve(adapter: Adapter) {
  try {
    await doApi.patch(`api/admin/adapters/${adapter.id}`, { isActive: true });
    showToast(`已上线：${adapter.displayName}`);
    await load();
  } catch {}
}

async function disable(adapter: Adapter) {
  try {
    await doApi.patch(`api/admin/adapters/${adapter.id}`, { isActive: false });
    showToast(`已下线：${adapter.displayName}`);
    await load();
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
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <h1 class="text-2xl font-bold text-foreground">适配器管理</h1>
      <div class="flex items-center gap-3 flex-wrap">
        <label class="flex items-center gap-1.5 text-xs text-muted cursor-pointer select-none">
          <input type="checkbox" v-model="groupByDomain" class="accent-primary-500" />
          按域名分组
        </label>
        <div class="flex rounded-xl border border-border overflow-hidden text-sm flex-wrap">
          <button v-for="opt in [{ k: 'all', l: '全部' }, { k: 'pending', l: '待审核' }, { k: 'active', l: '已上线' }, { k: 'rejected', l: '已拒绝' }]" :key="opt.k"
            @click="filter = opt.k as any"
            class="px-4 py-1.5 transition-colors"
            :class="filter === opt.k ? 'bg-primary-500 text-white' : 'text-muted hover:bg-surface-muted'"
          >{{ opt.l }} ({{ opt.k === 'all' ? adapters.length : filtered.length }})</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-24 rounded-xl bg-surface-muted animate-pulse"></div>
    </div>

    <!-- 按域名分组显示 -->
    <template v-else-if="groupByDomain">
      <div v-for="[domain, items] in domainGroups" :key="domain" class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <h3 class="font-semibold text-foreground text-sm">{{ domain }}</h3>
          <span class="text-xs text-muted bg-surface-muted px-2 py-0.5 rounded">{{ items.length }} 个</span>
          <span v-if="items.filter(a => a.isActive).length > 1" class="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            多个已上线，建议合并
          </span>
        </div>
        <div class="space-y-2">
          <div v-for="adapter in items" :key="adapter.id"
            class="p-3 rounded-xl border border-border bg-surface hover:bg-surface-muted transition-colors">
            <div class="flex items-start gap-3 flex-wrap">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-semibold text-foreground text-sm">{{ adapter.displayName }}</span>
                  <span class="text-xs text-muted bg-surface-muted px-1.5 py-0.5 rounded font-mono">{{ adapter.name }}</span>
                  <span class="text-xs px-1.5 py-0.5 rounded font-medium"
                    :class="adapter.isActive ? 'bg-green-100 text-green-700' : adapter.rejectionReason ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'">
                    {{ adapter.isActive ? '已上线' : adapter.rejectionReason ? '已拒绝' : '待审核' }}
                  </span>
                  <span v-if="adapter.source === 'extension'" class="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">扩展</span>
                  <span v-if="adapter.parentId" class="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">已合并</span>
                </div>
                <p v-if="adapter.description" class="text-muted text-xs mt-0.5 truncate">{{ adapter.description }}</p>
                <p v-if="adapter.rejectionReason" class="text-red-500 text-xs mt-1">{{ adapter.rejectionReason }}</p>
              </div>
              <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                <button @click="openEdit(adapter)" class="px-2 py-1 rounded text-xs border border-border text-muted hover:text-foreground transition-colors">编辑</button>
                <template v-if="!adapter.isActive && !adapter.rejectionReason">
                  <button @click="approve(adapter)" class="px-2 py-1 rounded text-xs bg-green-500 text-white hover:bg-green-600">上线</button>
                  <button @click="openReject(adapter)" class="px-2 py-1 rounded text-xs border border-red-200 text-red-500 hover:bg-red-50">拒绝</button>
                  <button v-if="hasOtherActiveOnSameDomain(adapter)" @click="openMerge(adapter)"
                    class="px-2 py-1 rounded text-xs border border-purple-200 text-purple-600 hover:bg-purple-50">并入已上线…</button>
                </template>
                <template v-if="adapter.isActive && !adapter.parentId && hasOtherActiveOnSameDomain(adapter)">
                  <button @click="openMerge(adapter)" class="px-2 py-1 rounded text-xs border border-purple-200 text-purple-600 hover:bg-purple-50">合并到...</button>
                </template>
                <template v-if="adapter.isActive">
                  <button @click="disable(adapter)" class="px-2 py-1 rounded text-xs border border-yellow-300 text-yellow-600 hover:bg-yellow-50">下线</button>
                </template>
                <button @click="remove(adapter)" class="px-2 py-1 rounded text-xs border border-red-200 text-red-500 hover:bg-red-50">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="domainGroups.length === 0" class="text-center py-12 text-muted">暂无数据</div>
    </template>

    <!-- 平铺列表（不按域名分组） -->
    <div v-else class="space-y-2">
      <div v-for="adapter in filtered" :key="adapter.id"
        class="p-3 rounded-xl border border-border bg-surface hover:bg-surface-muted transition-colors">
        <div class="flex items-start gap-3 flex-wrap">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold text-foreground text-sm">{{ adapter.displayName }}</span>
              <span class="text-xs text-muted bg-surface-muted px-1.5 py-0.5 rounded font-mono">{{ adapter.name }}</span>
              <span class="text-xs px-1.5 py-0.5 rounded font-medium"
                :class="adapter.isActive ? 'bg-green-100 text-green-700' : adapter.rejectionReason ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'">
                {{ adapter.isActive ? '已上线' : adapter.rejectionReason ? '已拒绝' : '待审核' }}
              </span>
              <span v-if="adapter.source === 'extension'" class="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">扩展</span>
            </div>
            <p class="text-muted text-xs mt-0.5 font-mono">{{ adapter.siteDomain }}</p>
            <p v-if="adapter.description" class="text-muted text-xs mt-1 truncate">{{ adapter.description }}</p>
            <p v-if="adapter.rejectionReason" class="text-red-500 text-xs mt-1">{{ adapter.rejectionReason }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-1.5 shrink-0">
            <button @click="openEdit(adapter)" class="px-2 py-1 rounded text-xs border border-border text-muted hover:text-foreground transition-colors">编辑</button>
            <template v-if="!adapter.isActive && !adapter.rejectionReason">
              <button @click="approve(adapter)" class="px-2 py-1 rounded text-xs bg-green-500 text-white hover:bg-green-600">上线</button>
              <button @click="openReject(adapter)" class="px-2 py-1 rounded text-xs border border-red-200 text-red-500 hover:bg-red-50">拒绝</button>
              <button v-if="hasOtherActiveOnSameDomain(adapter)" @click="openMerge(adapter)"
                class="px-2 py-1 rounded text-xs border border-purple-200 text-purple-600 hover:bg-purple-50">并入已上线…</button>
            </template>
            <template v-if="adapter.isActive && !adapter.parentId && hasOtherActiveOnSameDomain(adapter)">
              <button @click="openMerge(adapter)" class="px-2 py-1 rounded text-xs border border-purple-200 text-purple-600 hover:bg-purple-50">合并到...</button>
            </template>
            <template v-if="adapter.isActive">
              <button @click="disable(adapter)" class="px-2 py-1 rounded text-xs border border-yellow-300 text-yellow-600 hover:bg-yellow-50">下线</button>
            </template>
            <button @click="remove(adapter)" class="px-2 py-1 rounded text-xs border border-red-200 text-red-500 hover:bg-red-50">删除</button>
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
          <button type="button" class="p-1.5 text-muted hover:text-foreground shrink-0" @click="showForm = false">✕</button>
        </div>
        <div class="space-y-4">
          <div class="flex items-center gap-3 text-xs text-muted">
            <span>标识：<code class="text-foreground">{{ editingAdapter.name }}</code></span>
            <span>来源：{{ sourceLabel(editingAdapter.source) }}</span>
            <span>提交时间：{{ new Date(editingAdapter.createdAt).toLocaleString("zh-CN") }}</span>
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
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted mb-1 block">来源适配需求 ID（可选）</label>
              <input v-model="form.derivedFromRequestId" placeholder="AdapterRequest.id" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-xs font-mono focus:outline-none"/>
            </div>
            <div>
              <label class="text-xs text-muted mb-1 block">实现者用户 ID（可选）</label>
              <input v-model="form.implementedByUserId" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-xs font-mono focus:outline-none"/>
            </div>
          </div>
          <div>
            <div class="flex items-start justify-between gap-2 mb-1">
              <label class="text-xs text-muted block flex-1 min-w-0">适配公式代码 * <NuxtLink :to="localePath('/guide/adapter')" target="_blank" class="ml-1 text-primary-500 hover:underline">查看规范 →</NuxtLink></label>
              <button type="button" class="shrink-0 px-2.5 py-1 rounded-lg text-xs border border-border text-muted hover:text-foreground hover:bg-surface-muted transition-colors" @click="copyAdapterCode">复制代码</button>
            </div>
            <textarea v-model="form.code" rows="14" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-xs font-mono focus:outline-none focus:border-primary-400 resize-y"/>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="save" :disabled="saving" class="flex-1 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-60 transition-colors">{{ saving ? '保存中...' : '保存' }}</button>
          <button @click="showForm = false" class="px-4 py-2.5 rounded-xl border border-border text-muted hover:text-foreground transition-colors">取消</button>
        </div>
      </div>
    </div>

    <!-- 拒绝弹窗 -->
    <div v-if="rejectForm.show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="rejectForm.show = false">
      <div class="bg-background border border-border rounded-2xl w-full max-w-md p-6">
        <h2 class="font-bold text-foreground text-lg mb-1">拒绝适配器</h2>
        <p class="text-muted text-sm mb-4">拒绝：{{ rejectForm.adapter?.displayName }}（{{ rejectForm.adapter?.siteDomain }}）</p>
        <label class="text-xs text-muted mb-1 block">拒绝原因 *</label>
        <textarea v-model="rejectForm.reason" rows="3" placeholder="请说明拒绝原因，方便提交者改进"
          class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:border-primary-400 resize-none"/>
        <div class="flex gap-3 mt-4">
          <button @click="confirmReject" :disabled="!rejectForm.reason.trim()" class="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-60 transition-colors">确认拒绝</button>
          <button @click="rejectForm.show = false" class="px-4 py-2.5 rounded-xl border border-border text-muted hover:text-foreground transition-colors">取消</button>
        </div>
      </div>
    </div>

    <!-- 合并弹窗 -->
    <div v-if="mergeForm.show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="mergeForm.show = false">
      <div class="bg-background border border-border rounded-2xl w-full max-w-lg p-6">
        <h2 class="font-bold text-foreground text-lg mb-1">合并适配器</h2>
        <p class="text-muted text-sm mb-4">将源适配器的公式层合并到目标已上线适配器中；源记录将标记为已合并（待审核稿也可直接并入已上线）。</p>

        <div class="space-y-3 mb-4">
          <div class="p-3 rounded-xl border border-red-200 bg-red-50">
            <p class="text-xs text-red-600 font-medium mb-0.5">源适配器（合并后标记为已处理）</p>
            <p class="text-sm font-semibold text-foreground">{{ mergeForm.source?.displayName }}</p>
            <p class="text-xs text-muted font-mono">{{ mergeForm.source?.siteDomain }}</p>
          </div>
          <div class="text-center text-lg text-muted">↓ 合并到 ↓</div>
          <div class="p-3 rounded-xl border border-green-200 bg-green-50">
            <p class="text-xs text-green-600 font-medium mb-0.5">目标适配器（保留）</p>
            <select v-if="mergeForm.source" v-model="mergeForm.target"
              class="w-full mt-1 px-2 py-1.5 rounded-lg border border-border bg-white text-foreground text-sm outline-none">
              <option v-for="a in adapters.filter(x => x.id !== mergeForm.source?.id && x.siteDomain === mergeForm.source?.siteDomain && x.isActive)" :key="a.id" :value="a">
                {{ a.displayName }}（{{ a.name }}）
              </option>
            </select>
          </div>
        </div>

        <p class="text-xs text-muted mb-4">合并策略：相同 layer 类型的 selectors 合并去重，不同 layer 类型追加到末尾</p>
        <div class="flex gap-3">
          <button @click="confirmMerge" :disabled="!mergeForm.target || mergeForm.processing"
            class="flex-1 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-60 transition-colors">
            {{ mergeForm.processing ? '合并中...' : '确认合并' }}
          </button>
          <button @click="mergeForm.show = false" class="px-4 py-2.5 rounded-xl border border-border text-muted hover:text-foreground transition-colors">取消</button>
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
