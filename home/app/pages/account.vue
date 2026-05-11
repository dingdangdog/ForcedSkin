<script setup lang="ts">
import { doApi } from "~/utils/api";

definePageMeta({ layout: "default", middleware: "auth" });

useForcedSkinSeo("/account", {
  titleKey: "seo.account.title",
  descriptionKey: "seo.account.description",
  robots: "noindex, nofollow",
});

const { data: authData, signOut } = useAuth();
const authUser = computed(() => authData.value?.user as { name?: string; email?: string; image?: string } | undefined);
const { t } = useI18n();
const localePath = useLocalePath();

interface Theme { id: string; name: string; displayName: string; description: string; mode: string; colors: string; }

interface Submission extends Theme { isActive: boolean; }



interface AdapterSubmission {

  id: string;

  name: string;

  displayName: string;

  description: string;

  siteDomain: string;

  code: string;

  isActive: boolean;

  rejectionReason: string | null;

  source: string;

  createdAt: string;

}



const themeStore = useThemeStore();

const favorites = ref<Theme[]>([]);

const submissions = ref<Submission[]>([]);

const adapterSubmissions = ref<AdapterSubmission[]>([]);

const catalogThemes = ref<Theme[]>([]);

const selectedLight = ref("");

const selectedDark = ref("");

const deletingAdapter = ref<string | null>(null);
const loading = ref(true);
const saving = ref(false);
const toast = ref("");

const showToast = (msg: string) => {
  toast.value = msg;
  setTimeout(() => { toast.value = ""; }, 2500);
};

const lightFavorites = computed(() => favorites.value.filter((th) => th.mode === "light"));
const darkFavorites = computed(() => favorites.value.filter((th) => th.mode === "dark"));

function themeLookupBySlug(slug: string): Theme | Submission | undefined {
  if (!slug) return undefined;
  return submissions.value.find((x) => x.name === slug)
    || favorites.value.find((x) => x.name === slug)
    || catalogThemes.value.find((x) => x.name === slug);
}

const selectedLightMeta = computed(() => themeLookupBySlug(selectedLight.value));
const selectedDarkMeta = computed(() => themeLookupBySlug(selectedDark.value));

async function load() {

  loading.value = true;

  try {

    const [favRes, userInfo, catalogRes, subRes, adapterRes] = await Promise.all([

      doApi.get<Theme[]>("api/entry/user/themes"),

      doApi.get<any>("api/entry/user/info"),

      doApi.get<{ list?: Theme[] }>("api/themes", { pageSize: 100 }).catch(() => ({ list: [] })),

      doApi.get<Submission[]>("api/entry/user/themes/submissions").catch(() => []),

      doApi.get<AdapterSubmission[]>("api/entry/user/adapters").catch(() => []),

    ]);

    favorites.value = favRes || [];

    submissions.value = subRes || [];

    adapterSubmissions.value = adapterRes || [];

    catalogThemes.value = catalogRes?.list || [];

    selectedLight.value = userInfo?.lightTheme || "";

    selectedDark.value = userInfo?.darkTheme || "";

  } finally {

    loading.value = false;

  }

}

async function removeFavorite(theme: Theme) {
  try {
    await doApi.post("api/entry/user/themes/favorite", { themeId: theme.id });
    favorites.value = favorites.value.filter((f) => f.id !== theme.id);
    showToast(t("themes.unfavorited"));
  } catch { }
}

async function selectTheme(theme: Theme) {
  themeStore.previewThemeOnSite(theme);
  saving.value = true;
  try {
    const payload = theme.mode === "light" ? { lightTheme: theme.name } : { darkTheme: theme.name };
    await doApi.patch("api/entry/user/themes/select", payload);
    if (theme.mode === "light") selectedLight.value = theme.name;
    else selectedDark.value = theme.name;
    showToast(t("themes.set_as", { name: theme.displayName, mode: theme.mode === "light" ? t("themes.mode_light") : t("themes.mode_dark") }));
  } catch { } finally { saving.value = false; }
}

async function logout() {
  await signOut({ callbackUrl: localePath("/") });
}

async function deleteAdapterSubmission(adapter: AdapterSubmission) {
  if (!confirm(`确认删除适配器「${adapter.displayName}」的提交？`)) return;
  deletingAdapter.value = adapter.id;
  try {
    await doApi.delete(`api/entry/user/adapters/${adapter.id}`);
    adapterSubmissions.value = adapterSubmissions.value.filter((a) => a.id !== adapter.id);
    showToast("已删除");
  } catch {
    showToast("删除失败");
  } finally {
    deletingAdapter.value = null;
  }
}

onMounted(load);
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <!-- 用户信息 -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-3">
        <img v-if="authUser?.image" :src="authUser.image"
          class="w-12 h-12 rounded-full object-cover border border-border" />
        <span v-else
          class="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-lg">
          {{ (authUser?.name || "U").charAt(0).toUpperCase() }}
        </span>
        <div>
          <h1 class="text-xl font-bold text-foreground">{{ authUser?.name || t('account.title') }}</h1>
          <p class="text-muted text-sm mt-0.5">{{ authUser?.email }}</p>
        </div>
      </div>
      <button @click="logout"
        class="px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground hover:bg-surface-muted text-sm transition-colors">
        {{ t('account.logout') }}
      </button>
    </div>

    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="h-48 rounded-2xl bg-surface-muted animate-pulse"></div>
    </div>

    <template v-else>
      <!-- 我提交的主题 -->
      <section v-if="submissions.length" class="mb-10 rounded-2xl border-2 border-primary-400/50 bg-primary-500/[0.04] p-5">
        <h2 class="font-semibold text-foreground text-lg mb-1">{{ t('account.my_submissions') }}</h2>
        <p class="text-muted text-sm mb-4 leading-relaxed">{{ t('account.submissions_intro') }}</p>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="th in submissions" :key="th.id" class="relative">
            <p
              class="absolute top-14 left-2 z-10 text-[11px] font-medium px-2 py-0.5 rounded-md shadow max-w-[calc(100%-1rem)]"
              :class="th.isActive
                ? 'bg-green-600/95 text-white'
                : 'bg-amber-500/95 text-white'"
            >
              {{ th.isActive ? t('account.submission_live') : t('account.submission_review') }}
            </p>
            <ThemeCard
              :theme="th"
              :as-preview="!th.isActive"
              :selected="Boolean(th.isActive && ((th.mode === 'light' && selectedLight === th.name) || (th.mode === 'dark' && selectedDark === th.name)))"
              @select="selectTheme"
            />
          </div>
        </div>
      </section>

      <!-- 网站适配器提交 -->
      <section v-if="adapterSubmissions.length" class="mb-10 p-5 rounded-2xl border border-border bg-surface">
        <div class="flex items-center justify-between mb-1">
          <h2 class="font-semibold text-foreground text-lg">🔌 我提交的适配器</h2>
          <NuxtLink :to="localePath('/adapters')" class="text-primary-500 text-sm hover:underline">
            {{ t('common.view_more') }}
          </NuxtLink>
        </div>
        <p class="text-muted text-sm mb-4">在官网或扩展中提交的适配器，审核通过后会自动同步到所有用户的扩展</p>
        <div class="space-y-2">
          <div v-for="adapter in adapterSubmissions" :key="adapter.id"
            class="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-muted/30 hover:bg-surface-muted transition-colors">
            <div class="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center text-sm shrink-0">
              {{ adapter.displayName.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-medium text-foreground text-sm">{{ adapter.displayName }}</span>
                <span class="text-xs font-mono text-muted">{{ adapter.siteDomain }}</span>
                <span class="text-xs px-1.5 py-0.5 rounded font-medium"
                  :class="adapter.isActive ? 'bg-green-100 text-green-700' : adapter.rejectionReason ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'">
                  {{ adapter.isActive ? '已上线' : adapter.rejectionReason ? '已拒绝' : '待审核' }}
                </span>
                <span v-if="adapter.source === 'extension'" class="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">扩展提交</span>
                <span v-else class="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">官网提交</span>
              </div>
              <p v-if="adapter.rejectionReason" class="text-red-500 text-xs mt-0.5">拒绝原因：{{ adapter.rejectionReason }}</p>
            </div>
            <button v-if="!adapter.isActive" @click="deleteAdapterSubmission(adapter)" :disabled="deletingAdapter === adapter.id"
              class="px-2.5 py-1 rounded-lg text-xs border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors shrink-0">
              {{ deletingAdapter === adapter.id ? '删除中...' : '删除' }}
            </button>
          </div>
        </div>
      </section>

      <!-- 当前账号选用的亮 / 暗主题（同步扩展）-->
      <section class="mb-8 p-5 rounded-2xl border border-border bg-surface-muted/40">
        <h2 class="font-semibold text-foreground mb-1">{{ t('account.synced_heading') }}</h2>
        <p class="text-muted text-sm mb-4 leading-relaxed">{{ t('account.synced_intro') }}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
            <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-base shrink-0">☀️</div>
            <div class="min-w-0">
              <p class="text-xs text-muted">{{ t('account.light_theme') }}</p>
              <p class="text-sm font-medium text-foreground mt-0.5">
                {{ selectedLightMeta?.displayName || (!selectedLight ? t('account.default') : selectedLight) }}
              </p>
              <p v-if="selectedLight" class="text-[11px] text-muted mt-1 font-mono truncate" :title="selectedLight">
                {{ t('account.slug_hint', { slug: selectedLight }) }}
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
            <div class="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-base shrink-0">🌙</div>
            <div class="min-w-0">
              <p class="text-xs text-muted">{{ t('account.dark_theme') }}</p>
              <p class="text-sm font-medium text-foreground mt-0.5">
                {{ selectedDarkMeta?.displayName || (!selectedDark ? t('account.default') : selectedDark) }}
              </p>
              <p v-if="selectedDark" class="text-[11px] text-muted mt-1 font-mono truncate" :title="selectedDark">
                {{ t('account.slug_hint', { slug: selectedDark }) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 亮色收藏 -->
      <section class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-foreground">☀️ {{ t('account.favorite_section_light') }}</h2>
          <NuxtLink :to="localePath({ path: '/themes', query: { mode: 'light' } })" class="text-primary-500 text-sm hover:underline">{{ t('common.view_more') }}</NuxtLink>
        </div>
        <div v-if="lightFavorites.length === 0"
          class="text-center py-8 text-muted text-sm border border-border rounded-2xl border-dashed">
          {{ t('account.no_favorites') }} —
          <NuxtLink :to="localePath('/themes')" class="text-primary-500 hover:underline">{{ t('themes.title') }}</NuxtLink>
        </div>
        <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ThemeCard v-for="theme in lightFavorites" :key="theme.id" :theme="theme" :favorited="true"
            :selected="selectedLight === theme.name" :show-actions="true" @favorite="removeFavorite"
            @select="selectTheme" />
        </div>
      </section>

      <!-- 暗色收藏 -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-foreground">🌙 {{ t('account.favorite_section_dark') }}</h2>
          <NuxtLink :to="localePath({ path: '/themes', query: { mode: 'dark' } })" class="text-primary-500 text-sm hover:underline">{{ t('common.view_more') }}</NuxtLink>
        </div>
        <div v-if="darkFavorites.length === 0"
          class="text-center py-8 text-muted text-sm border border-border rounded-2xl border-dashed">
          {{ t('account.no_favorites') }} —
          <NuxtLink :to="localePath('/themes')" class="text-primary-500 hover:underline">{{ t('themes.title') }}</NuxtLink>
        </div>
        <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ThemeCard v-for="theme in darkFavorites" :key="theme.id" :theme="theme" :favorited="true"
            :selected="selectedDark === theme.name" :show-actions="true" @favorite="removeFavorite"
            @select="selectTheme" />
        </div>
      </section>
    </template>

    <Transition name="fade">
      <div v-if="toast"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium shadow-lg">
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
