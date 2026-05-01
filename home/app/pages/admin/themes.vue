<script setup lang="ts">
import { doApi } from "~/utils/api";
import { copyTextToClipboard } from "~/utils/clipboard";

definePageMeta({ layout: "admin", middleware: "admin" });
useAdminPageHead("主题管理 — ForcedSkin 后台");

const localePath = useLocalePath();

interface Theme {
  id: string;
  name: string;
  displayName: string;
  description: string;
  mode: string;
  colors: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  submitterId: string | null;
  createdAt: string;
  favoriteCount?: number;
}

const themes = ref<Theme[]>([]);
const loading = ref(true);
const filter = ref<"all" | "pending" | "active">("all");
const showForm = ref(false);
const editing = ref<Theme | null>(null);
const saving = ref(false);
const toast = ref("");

const form = reactive({
  name: "", displayName: "", description: "",
  mode: "light", colors: "", isDefault: false, sortOrder: 0,
});

const DEFAULT_COLORS = {
  light: JSON.stringify({ background:"#F8FFF8", foreground:"#2C3E2C", surface:"#F0FFF0", surfaceMuted:"#F5FDF5", border:"#D8E8D8", muted:"#6C7E6C", primary:{ "500":"#4CAF50","600":"#43A047","700":"#388E3C" } }, null, 2),
  dark: JSON.stringify({ background:"#101410", foreground:"#E0E0E0", surface:"#1E221E", surfaceMuted:"#161816", border:"#333633", muted:"#A0A0A0", primary:{ "500":"#4A9B6B","600":"#3F855C","700":"#346F4D" } }, null, 2),
};

const pendingCount = computed(() => themes.value.filter((t) => !t.isActive && t.submitterId).length);

const filtered = computed(() => {
  if (filter.value === "pending") return themes.value.filter((t) => !t.isActive && t.submitterId);
  if (filter.value === "active") return themes.value.filter((t) => t.isActive);
  return themes.value;
});

const showToast = (msg: string) => { toast.value = msg; setTimeout(() => { toast.value = ""; }, 2500); };

async function load() {
  loading.value = true;
  try {
    const res = await doApi.get<any>("api/admin/themes", { pageSize: 100, status: "all" });
    themes.value = res.list || [];
  } finally { loading.value = false; }
}

function openCreate() {
  editing.value = null;
  Object.assign(form, { name: "", displayName: "", description: "", mode: "light", colors: DEFAULT_COLORS.light, isDefault: false, sortOrder: 0 });
  showForm.value = true;
}

function openEdit(theme: Theme) {
  editing.value = theme;
  const colorsStr = typeof theme.colors === "string" ? theme.colors : JSON.stringify(theme.colors, null, 2);
  Object.assign(form, { name: theme.name, displayName: theme.displayName, description: theme.description, mode: theme.mode, colors: colorsStr, isDefault: theme.isDefault, sortOrder: theme.sortOrder });
  showForm.value = true;
}

async function save() {
  if (!form.displayName || !form.colors) return showToast("请填写完整信息");
  saving.value = true;
  try {
    if (editing.value) {
      await doApi.patch(`api/admin/themes/${editing.value.id}`, { displayName: form.displayName, description: form.description, colors: form.colors, isDefault: form.isDefault, sortOrder: form.sortOrder });
      showToast("已更新");
    } else {
      await doApi.post("api/admin/themes", { ...form });
      showToast("已创建");
    }
    showForm.value = false;
    await load();
  } catch { showToast("保存失败"); } finally { saving.value = false; }
}

async function approve(theme: Theme) {
  try {
    await doApi.patch(`api/admin/themes/${theme.id}`, { isActive: true });
    theme.isActive = true;
    showToast(`已上线：${theme.displayName}`);
  } catch { showToast("操作失败"); }
}

async function toggleActive(theme: Theme) {
  try {
    await doApi.patch(`api/admin/themes/${theme.id}`, { isActive: !theme.isActive });
    theme.isActive = !theme.isActive;
    showToast(theme.isActive ? "已上线" : "已下线");
  } catch {}
}

async function reject(theme: Theme) {
  if (!confirm(`确认拒绝并删除主题「${theme.displayName}」？此操作不可恢复。`)) return;
  try {
    await doApi.delete(`api/admin/themes/${theme.id}`);
    showToast("已拒绝并删除");
    await load();
  } catch { showToast("操作失败"); }
}

async function remove(theme: Theme) {
  if (!confirm(`确认删除主题「${theme.displayName}」？`)) return;
  try {
    await doApi.delete(`api/admin/themes/${theme.id}`);
    showToast("已删除");
    await load();
  } catch {}
}

const formPreviewTheme = computed(() => ({
  id: "admin-form-preview",
  name: editing.value?.name || "preview",
  displayName: form.displayName.trim() || "（预览）",
  description: form.description,
  mode: form.mode,
  colors: form.colors,
}));

watch(() => form.mode, (m) => { if (!editing.value) form.colors = DEFAULT_COLORS[m as "light" | "dark"]; });

async function copyThemeColorsJson() {
  const ok = await copyTextToClipboard(form.colors);
  showToast(ok ? "已复制色彩 JSON" : "复制失败");
}

onMounted(load);
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold text-foreground">主题管理</h1>
        <span v-if="pendingCount > 0" class="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
          {{ pendingCount }} 待审核
        </span>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex rounded-xl border border-border overflow-hidden text-sm">
          <button v-for="opt in [{ k: 'all', l: '全部' }, { k: 'pending', l: '待审核' }, { k: 'active', l: '已上线' }]" :key="opt.k"
            @click="filter = opt.k as any"
            class="px-4 py-1.5 transition-colors"
            :class="filter === opt.k ? 'bg-primary-500 text-white' : 'text-muted hover:bg-surface-muted'"
          >{{ opt.l }}</button>
        </div>
        <button @click="openCreate" class="px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600">
          + 新建主题
        </button>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-16 rounded-xl bg-surface-muted animate-pulse"></div>
    </div>

    <div v-else class="space-y-3">
      <div v-for="theme in filtered" :key="theme.id"
        class="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl border border-border bg-surface hover:bg-surface-muted transition-colors"
        :class="{ 'border-yellow-300': !theme.isActive && theme.submitterId }"
      >
        <div class="w-full sm:w-[17.5rem] max-w-full shrink-0 mx-auto sm:mx-0">
          <AdminThemeCard :theme="theme" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-medium text-foreground">{{ theme.displayName }}</span>
            <span class="text-xs px-1.5 py-0.5 rounded bg-surface-muted text-muted">{{ theme.name }}</span>
            <span class="text-xs px-1.5 py-0.5 rounded" :class="theme.mode === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-amber-100 text-amber-800'">{{ theme.mode }}</span>
            <span class="text-xs px-1.5 py-0.5 rounded bg-surface-muted text-muted tabular-nums">收藏 {{ theme.favoriteCount ?? 0 }}</span>
            <span v-if="theme.isDefault" class="text-xs px-1.5 py-0.5 rounded bg-primary-100 text-primary-700">默认</span>
            <span v-if="theme.submitterId && !theme.isActive" class="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">社区投稿 · 待审核</span>
            <span v-else-if="theme.submitterId && theme.isActive" class="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">社区投稿 · 已上线</span>
          </div>
          <p class="text-muted text-xs mt-0.5 truncate">{{ theme.description }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 shrink-0 sm:self-center max-sm:w-full max-sm:justify-end">
          <!-- 社区投稿待审核：显示上线/拒绝 -->
          <template v-if="theme.submitterId && !theme.isActive">
            <button @click="openEdit(theme)" class="px-3 py-1 rounded-lg text-xs border border-border text-muted hover:text-foreground hover:bg-surface-muted transition-colors">查看/编辑</button>
            <button @click="approve(theme)" class="px-3 py-1 rounded-lg text-xs bg-green-500 text-white hover:bg-green-600 transition-colors">上线</button>
            <button @click="reject(theme)" class="px-3 py-1 rounded-lg text-xs border border-red-200 text-red-500 hover:bg-red-50 transition-colors">拒绝</button>
          </template>
          <!-- 普通主题：切换上线/编辑/删除 -->
          <template v-else>
            <button @click="toggleActive(theme)"
              class="px-3 py-1 rounded-lg text-xs font-medium border transition-colors"
              :class="theme.isActive ? 'border-green-500 text-green-600 hover:bg-green-50' : 'border-border text-muted hover:border-primary-400'"
            >{{ theme.isActive ? '已上线' : '已下线' }}</button>
            <button @click="openEdit(theme)" class="px-3 py-1 rounded-lg text-xs border border-border text-muted hover:text-foreground hover:bg-surface-muted transition-colors">编辑</button>
            <button @click="remove(theme)" class="px-3 py-1 rounded-lg text-xs border border-red-200 text-red-500 hover:bg-red-50 transition-colors">删除</button>
          </template>
        </div>
      </div>
      <div v-if="filtered.length === 0" class="text-center py-12 text-muted">暂无数据</div>
    </div>

    <!-- 表单弹窗 -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="showForm = false">
      <div class="bg-background border border-border rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6">
        <h2 class="font-bold text-foreground text-lg mb-4">{{ editing ? '编辑主题' : '新建主题' }}</h2>
        <div class="lg:grid lg:grid-cols-[1fr_min(18rem,40%)] lg:gap-6 lg:items-start space-y-4 lg:space-y-0">
          <div class="space-y-4">
          <div v-if="!editing" class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted mb-1 block">标识 name *</label>
              <input v-model="form.name" placeholder="dark-ocean" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:border-primary-400"/>
            </div>
            <div>
              <label class="text-xs text-muted mb-1 block">模式 *</label>
              <select v-model="form.mode" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none">
                <option value="light">light 亮色</option>
                <option value="dark">dark 暗色</option>
              </select>
            </div>
          </div>
          <div>
            <label class="text-xs text-muted mb-1 block">显示名称 *</label>
            <input v-model="form.displayName" placeholder="深海暗色" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:border-primary-400"/>
          </div>
          <div>
            <label class="text-xs text-muted mb-1 block">描述</label>
            <input v-model="form.description" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:border-primary-400"/>
          </div>
          <div>
            <div class="flex items-start justify-between gap-2 mb-1">
              <label class="text-xs text-muted block flex-1 min-w-0">
                色彩配置 JSON *
                <NuxtLink :to="localePath('/guide/theme')" target="_blank" class="ml-1 text-primary-500 hover:underline">查看字段规范 →</NuxtLink>
              </label>
              <button
                type="button"
                class="shrink-0 px-2.5 py-1 rounded-lg text-xs border border-border text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                @click="copyThemeColorsJson"
              >
                复制 JSON
              </button>
            </div>
            <textarea v-model="form.colors" rows="10" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-xs font-mono focus:outline-none focus:border-primary-400 resize-y"/>
          </div>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" v-model="form.isDefault" class="rounded"/> 设为默认
            </label>
            <div class="flex items-center gap-2">
              <label class="text-xs text-muted">排序</label>
              <input type="number" v-model="form.sortOrder" class="w-16 px-2 py-1 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none"/>
            </div>
          </div>
          </div>
          <div class="lg:sticky lg:top-0 space-y-2">
            <p class="text-xs text-muted font-medium">前台效果预览</p>
            <ThemeCard :theme="formPreviewTheme" as-preview />
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
