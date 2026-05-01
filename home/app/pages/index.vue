<script setup lang="ts">
import { doApi } from "~/utils/api";

definePageMeta({ layout: "default" });

const { t } = useI18n();
const localePath = useLocalePath();

useForcedSkinSeo("/", {
  titleKey: "seo.home.title",
  descriptionKey: "seo.home.description",
  ogTitleKey: "seo.home.og_title",
  ogDescriptionKey: "seo.home.og_description",
  keywordsKey: "seo.keywords",
});

interface Theme {
  id: string;
  name: string;
  displayName: string;
  description: string;
  mode: string;
  colors: any;
  isDefault: boolean;
  sortOrder: number;
}

interface Adapter {
  id: string;
  name: string;
  displayName: string;
  description: string;
  siteDomain: string;
  sortOrder: number;
}

// 热门主题：亮色2个 + 暗色2个
const lightThemes = ref<Theme[]>([]);
const darkThemes = ref<Theme[]>([]);
const adapters = ref<Adapter[]>([]);
const loading = ref(true);

// 获取适配器的主域名（用于展示图标）
function getMainDomain(siteDomain: string): string {
  const domains = siteDomain.split(",").map(d => d.trim()).filter(Boolean);
  return domains[0] || "";
}

function getFaviconUrl(siteDomain: string): string {
  const domain = getMainDomain(siteDomain);
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

onMounted(async () => {
  try {
    const [themesRes, adaptersRes] = await Promise.all([
      doApi.get<any>("api/themes", { pageSize: 50 }),
      doApi.get<any>("api/adapters", { pageSize: 100 }),
    ]);
    const list: Theme[] = themesRes.list || [];
    lightThemes.value = list.filter(t => t.mode === "light").slice(0, 2);
    darkThemes.value = list.filter(t => t.mode === "dark").slice(0, 2);
    adapters.value = adaptersRes.list || [];
  } catch { /* ignore */ }
  finally { loading.value = false; }
});
</script>

<template>
  <div>
    <!-- ══════ Hero ══════════════════════════════════════════════ -->
    <section class="relative py-24 px-4 text-center overflow-hidden border-b border-border">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-primary-700/5 pointer-events-none" />
      <div class="relative max-w-3xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 text-primary-600 text-sm font-medium mb-6">
          <img src="/LOGO.webp" alt="" class="w-4 h-4 object-contain" />
          {{ t('home.badge') }}
        </div>
        <h1 class="text-4xl md:text-6xl font-extrabold text-foreground mb-5 leading-tight tracking-tight">
          <span class="text-primary-500">{{ t('home.h1_1') }}</span><br />
          {{ t('home.h1_2') }}
        </h1>
        <p class="text-muted text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
          {{ t('home.desc', { brand: 'ForcedSkin' }) }}
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <NuxtLink :to="localePath('/themes')"
            class="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary-500 text-white font-semibold text-base hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20">
            {{ t('home.cta_themes') }}
          </NuxtLink>
          <NuxtLink :to="localePath('/auth/login')"
            class="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-border text-foreground font-semibold text-base hover:bg-surface-muted transition-colors">
            {{ t('home.cta_login') }}
          </NuxtLink>
        </div>
        <p class="text-muted text-xs mt-5">{{ t('home.browser_note') }}</p>
      </div>
    </section>

    <!-- ══════ 热门主题 ══════════════════════════════════════════ -->
    <section class="py-20 px-4 border-b border-border">
      <div class="max-w-5xl mx-auto">
        <!-- 标题行 -->
        <div class="flex items-end justify-between mb-10">
          <div>
            <h2 class="text-2xl md:text-3xl font-bold text-foreground">{{ t('home.popular.title') }}</h2>
            <p class="text-muted text-sm mt-1">{{ t('home.popular.subtitle') }}</p>
          </div>
          <NuxtLink :to="localePath('/themes')"
            class="hidden sm:inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-500 font-medium transition-colors">
            {{ t('home.popular.view_all') }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>

        <!-- 加载骨架 -->
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="i in 4" :key="i" class="rounded-2xl bg-surface-muted animate-pulse h-52" />
        </div>

        <!-- 主题卡片 — 复用 ThemeCard 组件，与主题页保持一致 -->
        <div v-else-if="lightThemes.length > 0 || darkThemes.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink
            v-for="theme in [...lightThemes, ...darkThemes]"
            :key="theme.id"
            :to="localePath('/themes')"
            class="block"
          >
            <ThemeCard :theme="theme" :show-actions="false" />
          </NuxtLink>
        </div>

        <!-- 空状态 -->
        <div v-else class="text-center py-12 text-muted">{{ t('home.popular.empty') }}</div>

        <!-- 查看更多（移动端） -->
        <div class="mt-8 text-center sm:hidden">
          <NuxtLink :to="localePath('/themes')"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-surface-muted transition-colors">
            {{ t('home.popular.view_all') }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ══════ 已适配网站 ════════════════════════════════════════ -->
    <section class="py-20 px-4 bg-surface-muted/30 border-b border-border">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-10">
          <h2 class="text-2xl md:text-3xl font-bold text-foreground">{{ t('home.adapted.title') }}</h2>
          <p class="text-muted text-sm mt-2">{{ t('home.adapted.subtitle') }}</p>
        </div>

        <!-- 加载中 -->
        <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <div v-for="i in 10" :key="i" class="rounded-xl bg-surface animate-pulse h-20" />
        </div>

        <!-- 适配器卡片 -->
        <div v-else-if="adapters.length > 0"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <div v-for="adapter in adapters" :key="adapter.id"
            class="group rounded-xl border border-border bg-surface px-3 py-4 flex flex-col items-center gap-2 hover:border-primary-400 hover:bg-surface-muted transition-all duration-150 cursor-default">
            <!-- favicon -->
            <div class="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center overflow-hidden">
              <img
                v-if="getMainDomain(adapter.siteDomain)"
                :src="getFaviconUrl(adapter.siteDomain)"
                :alt="adapter.displayName"
                class="w-6 h-6 object-contain"
                loading="lazy"
                @error="($event.target as HTMLImageElement).style.display='none'"
              />
              <span v-else class="text-xs font-bold text-muted">
                {{ adapter.displayName.charAt(0) }}
              </span>
            </div>
            <!-- 名称 -->
            <div class="text-center">
              <div class="text-sm font-semibold text-foreground leading-tight">{{ adapter.displayName }}</div>
              <div class="text-xs text-muted mt-0.5 truncate max-w-full">
                {{ getMainDomain(adapter.siteDomain) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="text-center py-16">
          <div class="text-4xl mb-3">🔌</div>
          <p class="text-muted text-sm">{{ t('home.adapted.empty_title') }}</p>
          <NuxtLink :to="localePath('/adapters')"
            class="mt-4 inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-500 font-medium transition-colors">
            {{ t('home.adapted.go_submit') }}
          </NuxtLink>
        </div>

        <!-- 提交入口 -->
        <div class="mt-8 text-center">
          <p class="text-muted text-sm mb-3">{{ t('home.adapted.no_site') }}</p>
          <NuxtLink :to="localePath('/adapters')"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-surface-muted transition-colors">
            {{ t('home.adapted.submit_btn') }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ══════ CTA ═══════════════════════════════════════════════ -->
    <section class="py-20 px-4 bg-primary-500/5 border-t border-border">
      <div class="max-w-2xl mx-auto text-center">
        <h2 class="text-2xl md:text-3xl font-bold text-foreground mb-4">{{ t('home.cta.title') }}</h2>
        <p class="text-muted mb-8">{{ t('home.cta.desc') }}</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <NuxtLink :to="localePath('/auth/login')"
            class="px-8 py-3.5 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors">
            {{ t('home.cta.btn_login') }}
          </NuxtLink>
          <NuxtLink :to="localePath('/themes')"
            class="px-8 py-3.5 rounded-xl border border-border text-foreground font-semibold hover:bg-surface-muted transition-colors">
            {{ t('home.cta.btn_themes') }}
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
