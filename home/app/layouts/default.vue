<script setup lang="ts">
const { data, status, signOut } = useAuth();
const themeStore = useThemeStore();
const route = useRoute();
const { t } = useI18n();
const localePath = useLocalePath();

const isLoggedIn = computed(() => status.value === "authenticated");
const user = computed(() => data.value?.user as { name?: string; email?: string; image?: string; roles?: string } | undefined);
const isAdmin = computed(() => {
  const roles = (user.value as any)?.roles ?? "";
  return roles.split(",").map((r: string) => r.trim()).includes("admin");
});
const isDark = computed(() => themeStore.isDark);

const navLinks = computed(() => [
  { path: "/", label: t("nav.home") },
  { path: "/themes", label: t("nav.themes") },
  { path: "/adapters", label: t("nav.adapters") },
]);

function navActive(path: string) {
  const cur = route.path.replace(/\/$/, "") || "/";
  const target = localePath(path).replace(/\/$/, "") || "/";
  if (path === "/") {
    return cur === target;
  }
  return cur === target || cur.startsWith(`${target}/`);
}

onMounted(() => {
  if (!themeStore.themeConfigLoaded) themeStore.initTheme();
});
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div class="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <!-- Logo -->
        <NuxtLink :to="localePath('/')" class="font-bold text-lg text-foreground flex items-center gap-2 shrink-0">
          <img src="/LOGO.webp" alt="ForcedSkin" class="w-6 h-6 object-contain rounded-md" />
          ForcedSkin
        </NuxtLink>

        <!-- Nav -->
        <nav class="flex items-center gap-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.path"
            :to="localePath(link.path)"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            :class="navActive(link.path)
              ? 'bg-primary-500/10 text-primary-600'
              : 'text-muted hover:text-foreground hover:bg-surface-muted'"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <div class="ml-auto flex items-center gap-1.5">
          <AppLocaleSwitcher />

          <!-- 亮/暗切换 -->
          <button
            @click="themeStore.toggleTheme()"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
          >
            <svg v-if="isDark" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
            </svg>
          </button>

          <!-- 已登录 -->
          <template v-if="isLoggedIn">
            <NuxtLink :to="localePath('/account')" class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-muted transition-colors">
              <img v-if="user?.image" :src="user.image" :alt="user?.name || ''" class="w-6 h-6 rounded-full object-cover" />
              <span v-else class="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">
                {{ (user?.name || "U").charAt(0).toUpperCase() }}
              </span>
              <span class="text-sm font-medium text-foreground max-w-[80px] truncate hidden sm:block">
                {{ user?.name || user?.email || t('nav.account') }}
              </span>
            </NuxtLink>
            <NuxtLink v-if="isAdmin" :to="localePath('/admin')" class="px-3 py-1.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-muted transition-colors">
              {{ t('nav.admin') }}
            </NuxtLink>
            <button @click="signOut({ callbackUrl: localePath('/') })" class="px-3 py-1.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-muted transition-colors">
              {{ t('nav.logout') }}
            </button>
          </template>

          <!-- 未登录 -->
          <template v-else>
            <NuxtLink :to="localePath('/auth/login')" class="px-4 py-1.5 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors">
              {{ t('nav.login') }}
            </NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <!-- 页面内容 -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- 页脚 -->
    <footer class="border-t border-border py-8 px-4">
      <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
        <div class="flex items-center gap-1.5">
          <img src="/LOGO.webp" alt="ForcedSkin" class="w-4 h-4 object-contain rounded" />
          <span class="font-semibold text-foreground">ForcedSkin</span>
          <span>{{ t('footer.copyright', { year: new Date().getFullYear() }) }}</span>
        </div>
        <nav class="flex gap-3 flex-wrap justify-center">
          <NuxtLink :to="localePath('/themes')" class="hover:text-foreground">{{ t('footer.themes') }}</NuxtLink>
          <NuxtLink :to="localePath('/adapters')" class="hover:text-foreground">{{ t('footer.adapters') }}</NuxtLink>
          <NuxtLink :to="localePath('/guide/theme')" class="hover:text-foreground">{{ t('footer.guide_theme') }}</NuxtLink>
          <NuxtLink :to="localePath('/guide/adapter')" class="hover:text-foreground">{{ t('footer.guide_adapter') }}</NuxtLink>
          <NuxtLink :to="localePath('/privacy')" class="hover:text-foreground">{{ t('footer.privacy') }}</NuxtLink>
          <NuxtLink :to="localePath('/terms')" class="hover:text-foreground">{{ t('footer.terms') }}</NuxtLink>
          <a href="mailto:hello@forcedskin.com" class="hover:text-foreground">{{ t('footer.contact') }}</a>
        </nav>
      </div>
    </footer>
  </div>
</template>
