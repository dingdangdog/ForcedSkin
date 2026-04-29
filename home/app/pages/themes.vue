<script setup lang="ts">
import { doApi } from "~/utils/api";

definePageMeta({ layout: "default" });

const { t } = useI18n();

useHead({
  title: "主题商城 — ForcedSkin",
  meta: [
    { name: "description", content: "浏览 ForcedSkin 主题商城，发现适合你的亮色和暗色配色方案，一键应用到任意网站。" },
    { property: "og:title", content: "主题商城 — ForcedSkin" },
    { property: "og:description", content: "发现精美配色主题，收藏并同步到 ForcedSkin 浏览器扩展，为任意网站换上你喜欢的颜色。" },
    { property: "og:url", content: "https://forcedskin.com/themes" },
  ],
  link: [{ rel: "canonical", href: "https://forcedskin.com/themes" }],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "ForcedSkin 主题商城",
        "description": "浏览 ForcedSkin 的亮色和暗色主题配色方案",
        "url": "https://forcedskin.com/themes",
        "isPartOf": { "@type": "WebSite", "name": "ForcedSkin", "url": "https://forcedskin.com" },
      }),
    },
  ],
});

interface Theme { id: string; name: string; displayName: string; description: string; mode: string; colors: string; isDefault: boolean; }

const { status } = useAuth();
const themes = ref<Theme[]>([]);
const loading = ref(true);
const filterMode = ref<"all" | "light" | "dark">("all");
const favorites = ref<Set<string>>(new Set());
const selectedLight = ref<string>("");
const selectedDark = ref<string>("");
const saving = ref(false);
const toast = ref("");

const showSubmit = ref(false);
const submitting = ref(false);
const submitForm = reactive({ displayName: "", description: "", mode: "light", colors: "" });
const submitErrors = ref<Record<string, string>>({});

const DEFAULT_SUBMIT_COLORS = {
  light: JSON.stringify({ background: "#F8FFF8", foreground: "#2C3E2C", surface: "#F0FFF0", surfaceMuted: "#F5FDF5", border: "#D8E8D8", muted: "#6C7E6C", primary: { "500": "#4CAF50", "600": "#43A047", "700": "#388E3C" } }, null, 2),
  dark: JSON.stringify({ background: "#101410", foreground: "#E0E0E0", surface: "#1E221E", surfaceMuted: "#161816", border: "#333633", muted: "#A0A0A0", primary: { "500": "#4A9B6B", "600": "#3F855C", "700": "#346F4D" } }, null, 2),
};

const isLoggedIn = computed(() => status.value === "authenticated");

const filtered = computed(() =>
  filterMode.value === "all" ? themes.value : themes.value.filter((t) => t.mode === filterMode.value)
);

const showToast = (msg: string) => {
  toast.value = msg;
  setTimeout(() => { toast.value = ""; }, 2500);
};

async function load() {
  loading.value = true;
  try {
    const res = await doApi.get<any>("api/themes", { pageSize: 100 });
    themes.value = res.list || [];

    if (isLoggedIn.value) {
      const [favRes, userInfo] = await Promise.all([
        doApi.get<any[]>("api/entry/user/themes"),
        doApi.get<any>("api/entry/user/info"),
      ]);
      favorites.value = new Set((favRes || []).map((t: any) => t.id));
      selectedLight.value = userInfo?.lightTheme || "";
      selectedDark.value = userInfo?.darkTheme || "";
    }
  } finally {
    loading.value = false;
  }
}

async function toggleFavorite(theme: Theme) {
  if (!isLoggedIn.value) { showToast(t("themes.need_login")); return; }
  try {
    const res = await doApi.post<any>("api/entry/user/themes/favorite", { themeId: theme.id });
    if (res.favorited) { favorites.value.add(theme.id); showToast(t("themes.favorited", { name: theme.displayName })); }
    else { favorites.value.delete(theme.id); showToast(t("themes.unfavorited")); }
  } catch {}
}

async function selectTheme(theme: Theme) {
  if (!isLoggedIn.value) { showToast(t("themes.need_login_select")); return; }
  try {
    saving.value = true;
    const payload = theme.mode === "light" ? { lightTheme: theme.name } : { darkTheme: theme.name };
    await doApi.patch<any>("api/entry/user/themes/select", payload);
    if (theme.mode === "light") selectedLight.value = theme.name;
    else selectedDark.value = theme.name;
    showToast(t("themes.set_as", { name: theme.displayName, mode: theme.mode === "light" ? t("themes.mode_light") : t("themes.mode_dark") }));
  } catch {} finally { saving.value = false; }
}

function openSubmit() {
  Object.assign(submitForm, { displayName: "", description: "", mode: "light", colors: DEFAULT_SUBMIT_COLORS.light });
  submitErrors.value = {};
  showSubmit.value = true;
}

function validateSubmit() {
  submitErrors.value = {};
  if (!submitForm.displayName) submitErrors.value.displayName = t("themes.field_display_required");
  if (!submitForm.colors) submitErrors.value.colors = t("themes.field_colors_required");
  else {
    try { JSON.parse(submitForm.colors); } catch { submitErrors.value.colors = "必须是合法的 JSON"; }
  }
  return Object.keys(submitErrors.value).length === 0;
}

async function submitTheme() {
  if (!validateSubmit()) return;
  submitting.value = true;
  try {
    await doApi.post("api/entry/themes", { ...submitForm });
    showToast(t("themes.submit_ok"));
    showSubmit.value = false;
  } catch { showToast(t("themes.submit_fail")); } finally { submitting.value = false; }
}

watch(() => submitForm.mode, (m) => {
  submitForm.colors = DEFAULT_SUBMIT_COLORS[m as "light" | "dark"];
});

onMounted(load);
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <div class="flex items-end justify-between mb-8 gap-4 flex-wrap">
      <div>
        <h1 class="text-3xl font-bold text-foreground">{{ t('themes.title') }}</h1>
        <p class="text-muted mt-1">{{ t('themes.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink to="/guide/theme" class="px-4 py-2 rounded-xl border border-border text-muted text-sm hover:text-foreground hover:bg-surface-muted transition-colors">
          📖 {{ t('themes.guide_link') }}
        </NuxtLink>
        <button v-if="isLoggedIn" @click="openSubmit"
          class="px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors">
          + {{ t('themes.submit_btn') }}
        </button>
        <NuxtLink v-else to="/auth/login"
          class="px-4 py-2 rounded-xl border border-border text-muted text-sm hover:text-foreground hover:bg-surface-muted transition-colors">
          {{ t('themes.login_to_submit') }}
        </NuxtLink>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="flex items-center gap-3 mb-6">
      <button
        v-for="opt in [{ k: 'all', l: t('themes.all') }, { k: 'light', l: t('themes.light') }, { k: 'dark', l: t('themes.dark') }]"
        :key="opt.k"
        @click="filterMode = opt.k as any"
        class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors border"
        :class="filterMode === opt.k
          ? 'bg-primary-500 text-white border-primary-500'
          : 'text-muted border-border hover:border-primary-400 hover:text-foreground'"
      >
        {{ opt.l }}
      </button>
    </div>

    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div v-for="i in 12" :key="i" class="rounded-2xl bg-surface-muted animate-pulse h-52"></div>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <ThemeCard
        v-for="theme in filtered"
        :key="theme.id"
        :theme="theme"
        :favorited="favorites.has(theme.id)"
        :selected="theme.mode === 'light' ? selectedLight === theme.name : selectedDark === theme.name"
        :show-actions="true"
        @favorite="toggleFavorite"
        @select="selectTheme"
      />
    </div>

    <!-- 提交主题弹窗 -->
    <div v-if="showSubmit" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="showSubmit = false">
      <div class="bg-background border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h2 class="font-bold text-foreground text-lg">{{ t('themes.modal_title') }}</h2>
            <p class="text-xs text-muted mt-0.5">{{ t('themes.modal_subtitle') }}</p>
          </div>
          <NuxtLink to="/guide/theme" target="_blank" class="text-xs text-primary-500 hover:underline shrink-0 mt-1">
            📖 {{ t('themes.guide_link') }}
          </NuxtLink>
        </div>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted mb-1 block">{{ t('themes.field_mode') }} *</label>
              <select v-model="submitForm.mode" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm outline-none">
                <option value="light">light 亮色</option>
                <option value="dark">dark 暗色</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-muted mb-1 block">{{ t('themes.field_display') }} *</label>
              <input v-model="submitForm.displayName" :placeholder="t('themes.field_display_ph')"
                class="w-full px-3 py-2 rounded-lg border text-sm bg-surface text-foreground outline-none"
                :class="submitErrors.displayName ? 'border-red-400' : 'border-border focus:border-primary-400'" />
              <p v-if="submitErrors.displayName" class="text-red-500 text-xs mt-0.5">{{ submitErrors.displayName }}</p>
            </div>
          </div>
          <div>
            <label class="text-xs text-muted mb-1 block">{{ t('themes.field_desc') }}</label>
            <input v-model="submitForm.description" class="w-full px-3 py-2 rounded-lg border border-border focus:border-primary-400 text-sm bg-surface text-foreground outline-none" />
          </div>
          <div>
            <label class="text-xs text-muted mb-1 block">
              {{ t('themes.field_colors') }} *
              <NuxtLink to="/guide/theme" target="_blank" class="ml-1 text-primary-500 hover:underline">{{ t('themes.guide_link') }}</NuxtLink>
            </label>
            <textarea v-model="submitForm.colors" rows="10"
              class="w-full px-3 py-2 rounded-lg border text-xs font-mono text-foreground bg-surface outline-none resize-y"
              :class="submitErrors.colors ? 'border-red-400' : 'border-border focus:border-primary-400'" />
            <p v-if="submitErrors.colors" class="text-red-500 text-xs mt-0.5">{{ submitErrors.colors }}</p>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="submitTheme" :disabled="submitting"
            class="flex-1 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 disabled:opacity-60 transition-colors">
            {{ submitting ? t('themes.submitting') : t('themes.submit') }}
          </button>
          <button @click="showSubmit = false"
            class="px-4 py-2.5 rounded-xl border border-border text-muted text-sm hover:text-foreground transition-colors">
            {{ t('themes.cancel') }}
          </button>
        </div>
      </div>
    </div>

    <!-- toast -->
    <Transition name="fade">
      <div v-if="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium shadow-lg">
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }
</style>
