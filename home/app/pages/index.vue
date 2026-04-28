<script setup lang="ts">
import { doApi } from "~/utils/api";

definePageMeta({ layout: "default" });

useHead({
  title: "ForcedSkin — 强制换肤，为任意网站应用你的主题配色",
  meta: [
    { name: "description", content: "ForcedSkin 是一款浏览器扩展 + 主题商城平台，为任意网站强制应用自定义主题配色，支持亮色 / 暗色自由切换，登录后跨设备同步。" },
    { property: "og:title", content: "ForcedSkin — 强制换肤" },
    { property: "og:description", content: "为任意网站应用你喜欢的主题配色。浏览器扩展 + 主题商城，支持亮色 / 暗色自由切换，登录后跨设备同步。" },
    { property: "og:url", content: "https://forcedskin.com/" },
    { name: "twitter:title", content: "ForcedSkin — 强制换肤" },
    { name: "twitter:description", content: "为任意网站应用你喜欢的主题配色。" },
  ],
  link: [{ rel: "canonical", href: "https://forcedskin.com/" }],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "ForcedSkin",
        "url": "https://forcedskin.com",
        "description": "ForcedSkin 是一款浏览器扩展 + 主题商城平台，为任意网站强制应用自定义主题配色。",
        "inLanguage": "zh-CN",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://forcedskin.com/themes?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      }),
    },
  ],
});

interface Theme {
  id: string;
  name: string;
  displayName: string;
  description: string;
  mode: string;
  colors: string;
  isDefault: boolean;
}

const themes = ref<Theme[]>([]);
const loading = ref(true);
const previewMode = ref<"light" | "dark">("light");

const filteredThemes = computed(() =>
  themes.value.filter((t) => t.mode === previewMode.value)
);

onMounted(async () => {
  try {
    const res = await doApi.get<any>("api/themes", { pageSize: 50 });
    themes.value = res.list || [];
  } catch {
    /* ignore */
  } finally {
    loading.value = false;
  }
});

const features = [
  { icon: "🎨", title: "主题商城", desc: "浏览由社区和官方维护的精选配色方案，收藏你喜欢的，随时切换。" },
  { icon: "🌐", title: "全局强制换肤", desc: "基于 CSS + JS 双重注入，一键覆盖任意网站的背景色与文字颜色。" },
  { icon: "🔌", title: "网站适配器", desc: "针对 B站、知乎等常见网站提供精细适配，社区提交，管理员审核后上线。" },
  { icon: "☁️", title: "跨设备同步", desc: "登录账号后，你的主题选择自动同步到所有安装了 ForcedSkin 扩展的浏览器。" },
  { icon: "🌙", title: "亮 / 暗双模式", desc: "亮色和暗色各选一套主题，跟随时间、系统偏好或手动一键切换。" },
  { icon: "🔒", title: "白名单管理", desc: "对不想换肤的网站一键加入白名单，精准控制生效范围。" },
];
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative py-24 px-4 text-center overflow-hidden border-b border-border">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 pointer-events-none"></div>
      <div class="relative max-w-3xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 text-sm font-medium mb-6">
          <span class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
          浏览器主题扩展 · 强制换肤平台
        </div>
        <h1 class="text-4xl md:text-6xl font-extrabold text-foreground mb-5 leading-tight tracking-tight">
          让每个网站都有<br />
          <span class="text-primary-500">你喜欢的颜色</span>
        </h1>
        <p class="text-muted text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
          <strong class="text-foreground">ForcedSkin</strong> 强制为任意网站应用你选定的主题配色，
          无需网站支持，亮色 / 暗色自由切换，登录后跨设备同步。
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="#themes"
            class="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary-500 text-white font-semibold text-base hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/25"
          >
            🎨 浏览主题
          </a>
          <NuxtLink
            to="/login"
            class="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-border text-foreground font-semibold text-base hover:bg-surface-muted transition-colors"
          >
            免费注册
          </NuxtLink>
        </div>
        <p class="text-muted text-xs mt-5">支持 Chrome · Edge · Arc 等 Chromium 内核浏览器</p>
      </div>
    </section>

    <!-- 功能亮点 -->
    <section class="py-20 px-4 bg-surface-muted/30 border-b border-border">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-foreground mb-2">为什么选择 ForcedSkin？</h2>
          <p class="text-muted">强制换肤，不依赖网站支持，真正做到全局生效</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="feat in features"
            :key="feat.title"
            class="bg-surface rounded-2xl p-6 border border-border hover:border-primary-400 transition-colors group"
          >
            <div class="text-3xl mb-3">{{ feat.icon }}</div>
            <h3 class="font-semibold text-foreground mb-1.5 group-hover:text-primary-600 transition-colors">{{ feat.title }}</h3>
            <p class="text-muted text-sm leading-relaxed">{{ feat.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 主题画廊 -->
    <section id="themes" class="py-20 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 class="text-2xl md:text-3xl font-bold text-foreground">主题画廊</h2>
            <p class="text-muted text-sm mt-1">预览并选择适合你的配色方案，登录后一键应用</p>
          </div>
          <div class="flex rounded-xl border border-border overflow-hidden self-start sm:self-auto">
            <button
              v-for="m in [{ key: 'light', label: '☀️ 亮色' }, { key: 'dark', label: '🌙 暗色' }]"
              :key="m.key"
              @click="previewMode = m.key as any"
              class="px-4 py-2 text-sm font-medium transition-colors"
              :class="previewMode === m.key ? 'bg-primary-500 text-white' : 'text-muted hover:text-foreground hover:bg-surface-muted'"
            >
              {{ m.label }}
            </button>
          </div>
        </div>

        <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div v-for="i in 8" :key="i" class="rounded-2xl bg-surface-muted animate-pulse h-52"></div>
        </div>

        <div v-else-if="filteredThemes.length === 0" class="text-center py-16 text-muted">
          暂无{{ previewMode === 'light' ? '亮色' : '暗色' }}主题
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <ThemeThemeCard
            v-for="theme in filteredThemes"
            :key="theme.id"
            :theme="theme"
            :show-actions="false"
          />
        </div>

        <div class="text-center mt-10">
          <NuxtLink
            to="/themes"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-surface-muted transition-colors"
          >
            查看全部主题
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- CTA 底部 -->
    <section class="py-20 px-4 bg-primary-500/5 border-t border-border">
      <div class="max-w-2xl mx-auto text-center">
        <h2 class="text-2xl md:text-3xl font-bold text-foreground mb-4">立即开始使用 ForcedSkin</h2>
        <p class="text-muted mb-8">免费注册，收藏你喜欢的主题，安装扩展后登录即可同步</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <NuxtLink to="/login" class="px-8 py-3.5 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors">
            免费注册 / 登录
          </NuxtLink>
          <NuxtLink to="/themes" class="px-8 py-3.5 rounded-xl border border-border text-foreground font-semibold hover:bg-surface-muted transition-colors">
            浏览主题商城
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="border-t border-border py-10 px-4">
      <div class="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted">
        <div class="flex items-center gap-2">
          <span class="w-5 h-5 rounded bg-primary-500 flex items-center justify-center text-white text-xs font-black">F</span>
          <span class="font-semibold text-foreground">ForcedSkin</span>
          <span>© {{ new Date().getFullYear() }}</span>
        </div>
        <nav class="flex flex-wrap gap-4 justify-center">
          <NuxtLink to="/themes" class="hover:text-foreground transition-colors">主题商城</NuxtLink>
          <NuxtLink to="/adapters" class="hover:text-foreground transition-colors">适配器</NuxtLink>
          <NuxtLink to="/privacy" class="hover:text-foreground transition-colors">隐私政策</NuxtLink>
          <NuxtLink to="/terms" class="hover:text-foreground transition-colors">用户协议</NuxtLink>
        </nav>
      </div>
    </footer>
  </div>
</template>
