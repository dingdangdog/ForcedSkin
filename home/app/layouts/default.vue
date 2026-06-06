<script setup lang="ts">
import { Bars3Icon, XMarkIcon } from "@heroicons/vue/24/outline";

const { data, status, signOut } = useAuth();
const themeStore = useThemeStore();
const route = useRoute();
const { t } = useI18n();
const localePath = useLocalePath();

const mobileMenuOpen = ref(false);

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

function closeMobileMenu() {
  mobileMenuOpen.value = false;
}

watch(() => route.fullPath, closeMobileMenu);

watch(mobileMenuOpen, (open) => {
  if (!import.meta.client) return;
  document.body.style.overflow = open ? "hidden" : "";
});

onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = "";
});

onMounted(() => {
  if (!themeStore.themeConfigLoaded) themeStore.initTheme();
});
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3 sm:gap-6">
        <!-- Logo -->
        <NuxtLink :to="localePath('/')" class="font-bold text-base sm:text-lg text-foreground flex items-center gap-2 shrink-0 min-w-0">
          <img src="/LOGO.webp" alt="ForcedSkin" class="w-6 h-6 object-contain rounded-md shrink-0" />
          <span class="truncate">ForcedSkin</span>
        </NuxtLink>

        <!-- Desktop Nav -->
        <nav class="hidden md:flex items-center gap-1">
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

        <div class="ml-auto flex items-center gap-1 sm:gap-1.5">
          <AppLocaleSwitcher />

          <!-- 亮/暗切换 -->
          <button
            @click="themeStore.toggleTheme()"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
            :aria-label="isDark ? t('nav.theme_light') : t('nav.theme_dark')"
          >
            <svg v-if="isDark" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
            </svg>
          </button>

          <!-- Desktop: 已登录 -->
          <template v-if="isLoggedIn">
            <NuxtLink :to="localePath('/account')" class="hidden md:flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-muted transition-colors">
              <img v-if="user?.image" :src="user.image" :alt="user?.name || ''" class="w-6 h-6 rounded-full object-cover" />
              <span v-else class="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">
                {{ (user?.name || "U").charAt(0).toUpperCase() }}
              </span>
              <span class="text-sm font-medium text-foreground max-w-[120px] truncate hidden lg:block">
                {{ user?.name || user?.email || t('nav.account') }}
              </span>
            </NuxtLink>
            <NuxtLink v-if="isAdmin" :to="localePath('/admin')" class="hidden md:inline-flex px-3 py-1.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-muted transition-colors">
              {{ t('nav.admin') }}
            </NuxtLink>
            <button @click="signOut({ callbackUrl: localePath('/') })" class="hidden md:inline-flex px-3 py-1.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-muted transition-colors">
              {{ t('nav.logout') }}
            </button>
          </template>

          <!-- Desktop: 未登录 -->
          <NuxtLink v-else :to="localePath('/auth/login')" class="hidden md:inline-flex px-4 py-1.5 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors">
            {{ t('nav.login') }}
          </NuxtLink>

          <!-- Mobile menu toggle -->
          <button
            type="button"
            class="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
            :aria-label="mobileMenuOpen ? t('nav.close_menu') : t('nav.open_menu')"
            :aria-expanded="mobileMenuOpen"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <Bars3Icon v-if="!mobileMenuOpen" class="w-5 h-5" />
            <XMarkIcon v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile menu overlay -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileMenuOpen"
        class="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        @click="closeMobileMenu"
      />
    </Transition>

    <!-- Mobile menu drawer -->
    <Transition
      enter-active-class="transition-transform duration-200 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-150 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="mobileMenuOpen"
        class="md:hidden fixed inset-y-0 right-0 z-50 w-[min(100vw-3rem,20rem)] bg-background border-l border-border flex flex-col shadow-xl"
        @click.stop
      >
        <div class="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
          <span class="font-semibold text-foreground">{{ t('nav.menu') }}</span>
          <button
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
            :aria-label="t('nav.close_menu')"
            @click="closeMobileMenu"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <nav class="flex-1 overflow-y-auto px-3 py-4">
          <ul class="space-y-1">
            <li v-for="link in navLinks" :key="link.path">
              <NuxtLink
                :to="localePath(link.path)"
                class="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                :class="navActive(link.path)
                  ? 'bg-primary-500/10 text-primary-600'
                  : 'text-foreground hover:bg-surface-muted'"
                @click="closeMobileMenu"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>

          <div class="mt-6 pt-4 border-t border-border space-y-1">
            <template v-if="isLoggedIn">
              <NuxtLink
                :to="localePath('/account')"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-muted transition-colors"
                @click="closeMobileMenu"
              >
                <img v-if="user?.image" :src="user.image" :alt="user?.name || ''" class="w-8 h-8 rounded-full object-cover shrink-0" />
                <span v-else class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {{ (user?.name || "U").charAt(0).toUpperCase() }}
                </span>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-foreground truncate">{{ user?.name || t('nav.account') }}</p>
                  <p v-if="user?.email" class="text-xs text-muted truncate">{{ user.email }}</p>
                </div>
              </NuxtLink>
              <NuxtLink
                v-if="isAdmin"
                :to="localePath('/admin')"
                class="block px-3 py-2.5 rounded-xl text-sm text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                @click="closeMobileMenu"
              >
                {{ t('nav.admin') }}
              </NuxtLink>
              <button
                type="button"
                class="w-full text-left px-3 py-2.5 rounded-xl text-sm text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                @click="closeMobileMenu(); signOut({ callbackUrl: localePath('/') })"
              >
                {{ t('nav.logout') }}
              </button>
            </template>
            <NuxtLink
              v-else
              :to="localePath('/auth/login')"
              class="block px-3 py-2.5 rounded-xl text-sm font-medium bg-primary-500 text-white text-center hover:bg-primary-600 transition-colors"
              @click="closeMobileMenu"
            >
              {{ t('nav.login') }}
            </NuxtLink>
          </div>
        </nav>
      </aside>
    </Transition>

    <!-- 页面内容 -->
    <main class="flex-1 min-w-0">
      <slot />
    </main>

    <!-- 页脚 -->
    <footer class="border-t border-border py-8 px-4 sm:px-6 safe-bottom">
      <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
        <div class="flex items-center gap-1.5 text-center sm:text-left">
          <img src="/LOGO.webp" alt="ForcedSkin" class="w-4 h-4 object-contain rounded shrink-0" />
          <span class="font-semibold text-foreground">ForcedSkin</span>
          <span>{{ t('footer.copyright', { year: new Date().getFullYear() }) }}</span>
        </div>
        <nav class="flex gap-x-3 gap-y-2 flex-wrap justify-center sm:justify-end max-w-full">
          <NuxtLink :to="localePath('/themes')" class="hover:text-foreground whitespace-nowrap">{{ t('footer.themes') }}</NuxtLink>
          <NuxtLink :to="localePath('/adapters')" class="hover:text-foreground whitespace-nowrap">{{ t('footer.adapters') }}</NuxtLink>
          <NuxtLink :to="localePath('/guide/theme')" class="hover:text-foreground whitespace-nowrap">{{ t('footer.guide_theme') }}</NuxtLink>
          <NuxtLink :to="localePath('/guide/adapter')" class="hover:text-foreground whitespace-nowrap">{{ t('footer.guide_adapter') }}</NuxtLink>
          <NuxtLink :to="localePath('/about')" class="hover:text-foreground whitespace-nowrap">{{ t('footer.about') }}</NuxtLink>
          <NuxtLink :to="localePath('/privacy')" class="hover:text-foreground whitespace-nowrap">{{ t('footer.privacy') }}</NuxtLink>
          <NuxtLink :to="localePath('/terms')" class="hover:text-foreground whitespace-nowrap">{{ t('footer.terms') }}</NuxtLink>
          <a href="mailto:hello@forcedskin.com" class="hover:text-foreground whitespace-nowrap">{{ t('footer.contact') }}</a>
        </nav>
      </div>
    </footer>
  </div>
</template>
