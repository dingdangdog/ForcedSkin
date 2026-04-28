<script setup lang="ts">
import { doApi } from "~/utils/api";

definePageMeta({ layout: "default" });

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
  if (!isLoggedIn.value) { showToast("请先登录"); return; }
  try {
    const res = await doApi.post<any>("api/entry/user/themes/favorite", { themeId: theme.id });
    if (res.favorited) { favorites.value.add(theme.id); showToast(`已收藏 ${theme.displayName}`); }
    else { favorites.value.delete(theme.id); showToast(`已取消收藏`); }
  } catch {}
}

async function selectTheme(theme: Theme) {
  if (!isLoggedIn.value) { showToast("请先登录后选择主题"); return; }
  try {
    saving.value = true;
    const payload = theme.mode === "light"
      ? { lightTheme: theme.name }
      : { darkTheme: theme.name };
    await doApi.patch<any>("api/entry/user/themes/select", payload);
    if (theme.mode === "light") selectedLight.value = theme.name;
    else selectedDark.value = theme.name;
    showToast(`已将 ${theme.displayName} 设为${theme.mode === "light" ? "亮色" : "暗色"}主题`);
  } catch {} finally { saving.value = false; }
}

onMounted(load);
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground">主题</h1>
      <p class="text-muted mt-1">选择你喜欢的配色，登录后可同步到扩展</p>
    </div>

    <!-- 筛选 -->
    <div class="flex items-center gap-3 mb-6">
      <button
        v-for="opt in [{ k: 'all', l: '全部' }, { k: 'light', l: '亮色' }, { k: 'dark', l: '暗色' }]"
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

    <!-- toast -->
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
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }
</style>
