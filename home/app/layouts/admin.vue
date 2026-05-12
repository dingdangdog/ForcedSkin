<template>
  <div class="h-screen flex overflow-hidden bg-background text-foreground">
    <aside class="hidden md:flex md:w-64 bg-surface border-r border-border flex-shrink-0">
      <nav class="flex-1 p-5 flex flex-col h-full overflow-y-auto">
        <div class="mb-4 flex justify-center items-center space-x-2">
          <NuxtLink :to="localePath('/admin')"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
            管
          </NuxtLink>
          <h2 class="text-2xl font-bold text-foreground">管理后台</h2>
        </div>
        <div class="mb-4">
          <NuxtLink :to="localePath('/')" target="_blank"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:bg-surface-muted transition-colors">
            <HomeIcon class="w-5 h-5" />
            <span>返回前台</span>
            <ArrowTopRightOnSquareIcon class="w-4 h-4 ml-auto" />
          </NuxtLink>
        </div>
        <div class="flex-1 space-y-1">
          <p class="px-3 mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">
            导航
          </p>
          <ul class="space-y-1">
            <li v-for="item in menuItems" :key="item.path">
              <NuxtLink :to="localePath(item.path)"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors" :class="[
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-muted hover:bg-surface-muted',
                ]">
                <component :is="item.icon" class="w-5 h-5" />
                <span>{{ item.label }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
        <div class="mt-auto pt-4 border-t border-border space-y-2">
          <button type="button"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:bg-surface-muted transition-colors"
            :aria-label="isDark ? '切换为浅色模式' : '切换为深色模式'" @click="toggleTheme">
            <SunIcon v-if="isDark" class="w-5 h-5" />
            <MoonIcon v-else class="w-5 h-5" />
            <span>{{ isDark ? "浅色模式" : "深色模式" }}</span>
          </button>
          <button type="button"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            @click="showLogoutDialog = true">
            <ArrowRightOnRectangleIcon class="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </div>
      </nav>
    </aside>
    <main class="flex-1 flex flex-col overflow-hidden">
      <header class="md:hidden bg-surface border-b border-border px-3 py-2 flex-shrink-0">
        <div class="flex items-center justify-between">
          <h2 class="text-base md:text-lg font-semibold text-foreground">管理后台</h2>
          <button type="button" class="p-1.5 rounded-md text-muted hover:bg-surface-muted transition-colors"
            aria-label="打开菜单" @click="mobileMenuOpen = !mobileMenuOpen">
            <Bars3Icon class="w-5 h-5" />
          </button>
        </div>
      </header>

      <Transition name="fade">
        <div v-if="mobileMenuOpen" class="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
          @click="mobileMenuOpen = false"></div>
      </Transition>

      <Transition name="slide">
        <aside v-if="mobileMenuOpen"
          class="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col overflow-hidden"
          @click.stop>
          <div class="flex items-center justify-between px-3 py-2 border-b border-border">
            <div class="flex items-center gap-2">
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
                管
              </span>
              <h2 class="text-base font-bold text-foreground">管理后台</h2>
            </div>
            <button type="button" class="p-1.5 rounded-lg text-muted hover:bg-surface-muted transition-colors"
              aria-label="关闭菜单" @click="mobileMenuOpen = false">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <nav class="flex-1 overflow-y-auto px-3 py-2">
            <div class="mb-3">
              <NuxtLink :to="localePath('/')" target="_blank"
                class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium text-muted hover:bg-surface-muted transition-colors">
                <HomeIcon class="w-4 h-4" />
                <span>返回前台</span>
                <ArrowTopRightOnSquareIcon class="w-3.5 h-3.5 ml-auto" />
              </NuxtLink>
            </div>
            <p class="px-2 mb-1 text-xs font-medium uppercase tracking-wider text-muted">
              导航
            </p>
            <ul class="space-y-0.5">
              <li v-for="item in menuItems" :key="`mobile-${item.path}`">
                <NuxtLink :to="localePath(item.path)"
                  class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors" :class="[
                    isActive(item.path)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-muted hover:bg-surface-muted',
                  ]" @click="mobileMenuOpen = false">
                  <component :is="item.icon" class="w-4 h-4" />
                  <span>{{ item.label }}</span>
                </NuxtLink>
              </li>
            </ul>
          </nav>

          <div class="px-3 py-2 border-t border-border space-y-2">
            <button type="button"
              class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium text-muted hover:bg-surface-muted transition-colors"
              :aria-label="isDark ? '切换为浅色模式' : '切换为深色模式'" @click="toggleTheme">
              <SunIcon v-if="isDark" class="w-4 h-4" />
              <MoonIcon v-else class="w-4 h-4" />
              <span>{{ isDark ? "浅色模式" : "深色模式" }}</span>
            </button>
            <button type="button"
              class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              @click="showLogoutDialog = true">
              <ArrowRightOnRectangleIcon class="w-4 h-4" />
              <span>退出登录</span>
            </button>
          </div>
        </aside>
      </Transition>
      <div class="flex-1 overflow-y-auto p-2 md:p-4 bg-background">
        <slot></slot>
      </div>
    </main>

    <div v-if="showLogoutDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="showLogoutDialog = false">
      <div class="bg-surface text-foreground rounded-lg shadow-xl p-6 w-full max-w-md border border-border" @click.stop>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-foreground">退出登录</h3>
          <button type="button" class="text-muted hover:text-foreground transition-colors"
            @click="showLogoutDialog = false">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
        <div class="space-y-4">
          <p class="text-sm text-muted">确定要退出当前账号吗？</p>
          <div class="flex justify-end gap-2">
            <button type="button"
              class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium"
              @click="showLogoutDialog = false">
              取消
            </button>
            <button type="button"
              class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
              :disabled="logoutLoading" @click="handleLogout">
              <ArrowPathIcon v-if="logoutLoading" class="w-4 h-4 animate-spin" />
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import {
  Squares2X2Icon,
  Cog8ToothIcon,
  ArrowPathIcon,
  HomeIcon,
  ArrowTopRightOnSquareIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  SwatchIcon,
  PuzzlePieceIcon,
  UsersIcon,
  InboxIcon,
  GiftIcon,
} from "@heroicons/vue/24/outline";

const route = useRoute();
const localePath = useLocalePath();
const mobileMenuOpen = ref(false);
const themeStore = useThemeStore();
const isDark = computed(() => themeStore.isDark);
const userStore = useUserStore();

const showLogoutDialog = ref(false);
const logoutLoading = ref(false);

interface MenuItem {
  label: string;
  path: string;
  icon: Component;
}

const menuItems: MenuItem[] = [
  { label: "控制台", path: "/admin", icon: Squares2X2Icon },
  { label: "用户管理", path: "/admin/users", icon: UsersIcon },
  { label: "主题管理", path: "/admin/themes", icon: SwatchIcon },
  { label: "适配器管理", path: "/admin/adapters", icon: PuzzlePieceIcon },
  { label: "适配需求", path: "/admin/adapter-requests", icon: InboxIcon },
  { label: "积分管理", path: "/admin/points", icon: GiftIcon },
  { label: "设置", path: "/admin/settings", icon: Cog8ToothIcon },
];

const normalizePathStripLocale = (p: string) => {
  const s = (p.replace(/\/$/, "") || "/") as string;
  return (s.startsWith("/zh") ? s.replace(/^\/zh(?=\/|$)/, "") || "/" : s) as string;
};

const isActive = (logicalPath: string) => {
  const target = normalizePathStripLocale(localePath(logicalPath));
  const cur = normalizePathStripLocale(route.path);
  if (target === "/admin") {
    return cur === "/admin";
  }
  return cur === target || cur.startsWith(`${target}/`);
};

const toggleTheme = () => {
  themeStore.toggleTheme();
};

const handleLogout = async () => {
  logoutLoading.value = true;
  showLogoutDialog.value = false;
  try {
    await $fetch("/api/logout", { method: "POST", credentials: "include" });
  } catch (error) {
    console.error("登出请求失败:", error);
  }
  userStore.clearUser();
  if (import.meta.client) {
    document.cookie = "Authorization=; Max-Age=0; path=/";
  }
  try {
    await navigateTo(localePath("/"), { replace: true });
  } catch (error) {
    console.error("登出跳转失败:", error);
  } finally {
    logoutLoading.value = false;
  }
};
</script>

<style scoped></style>
