<script setup lang="ts">
import { doApi } from "~/utils/api";

definePageMeta({ layout: "admin", middleware: ["admin"] });
useHead({ title: "控制台 — ForcedSkin 后台", meta: [{ name: "robots", content: "noindex, nofollow" }] });

const pendingThemes = ref(0);
const pendingAdapters = ref(0);
const totalThemes = ref(0);
const totalAdapters = ref(0);
const loading = ref(true);

onMounted(async () => {
  try {
    const [tAll, tPending, aAll, aPending] = await Promise.all([
      doApi.get<any>("api/admin/themes", { pageSize: 1, status: "all" }),
      doApi.get<any>("api/admin/themes", { pageSize: 1, status: "pending" }),
      doApi.get<any>("api/admin/adapters", { pageSize: 1, status: "all" }),
      doApi.get<any>("api/admin/adapters", { pageSize: 1, status: "pending" }),
    ]);
    totalThemes.value = tAll.total ?? 0;
    pendingThemes.value = tPending.total ?? 0;
    totalAdapters.value = aAll.total ?? 0;
    pendingAdapters.value = aPending.total ?? 0;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="max-w-4xl py-6">
    <h1 class="text-2xl font-bold text-foreground mb-1">控制台</h1>
    <p class="text-muted text-sm mb-8">欢迎回来，以下是当前系统概况。</p>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <!-- 主题总数 -->
      <div class="p-5 rounded-2xl border border-border bg-surface">
        <p class="text-xs text-muted mb-1">主题总数</p>
        <p class="text-3xl font-bold text-foreground">
          <span v-if="loading" class="inline-block w-10 h-8 bg-surface-muted rounded animate-pulse"></span>
          <span v-else>{{ totalThemes }}</span>
        </p>
      </div>
      <!-- 待审核主题 -->
      <NuxtLink to="/admin/themes?status=pending"
        class="p-5 rounded-2xl border bg-surface transition-colors hover:border-yellow-400"
        :class="pendingThemes > 0 ? 'border-yellow-300' : 'border-border'">
        <p class="text-xs text-muted mb-1">待审核主题</p>
        <p class="text-3xl font-bold" :class="pendingThemes > 0 ? 'text-yellow-600' : 'text-foreground'">
          <span v-if="loading" class="inline-block w-10 h-8 bg-surface-muted rounded animate-pulse"></span>
          <span v-else>{{ pendingThemes }}</span>
        </p>
      </NuxtLink>
      <!-- 适配器总数 -->
      <div class="p-5 rounded-2xl border border-border bg-surface">
        <p class="text-xs text-muted mb-1">适配器总数</p>
        <p class="text-3xl font-bold text-foreground">
          <span v-if="loading" class="inline-block w-10 h-8 bg-surface-muted rounded animate-pulse"></span>
          <span v-else>{{ totalAdapters }}</span>
        </p>
      </div>
      <!-- 待审核适配器 -->
      <NuxtLink to="/admin/adapters?status=pending"
        class="p-5 rounded-2xl border bg-surface transition-colors hover:border-yellow-400"
        :class="pendingAdapters > 0 ? 'border-yellow-300' : 'border-border'">
        <p class="text-xs text-muted mb-1">待审核适配器</p>
        <p class="text-3xl font-bold" :class="pendingAdapters > 0 ? 'text-yellow-600' : 'text-foreground'">
          <span v-if="loading" class="inline-block w-10 h-8 bg-surface-muted rounded animate-pulse"></span>
          <span v-else>{{ pendingAdapters }}</span>
        </p>
      </NuxtLink>
    </div>

    <!-- 快捷操作 -->
    <h2 class="text-base font-semibold text-foreground mb-3">快捷操作</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <NuxtLink to="/admin/themes"
        class="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface hover:border-primary-400 hover:bg-surface-muted transition-colors">
        <div class="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 text-xl shrink-0">🎨</div>
        <div>
          <p class="font-medium text-foreground text-sm">主题管理</p>
          <p class="text-xs text-muted mt-0.5">创建、审核、上线或下线主题</p>
        </div>
        <span v-if="pendingThemes > 0"
          class="ml-auto text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium shrink-0">
          {{ pendingThemes }} 待审核
        </span>
      </NuxtLink>
      <NuxtLink to="/admin/adapters"
        class="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface hover:border-primary-400 hover:bg-surface-muted transition-colors">
        <div class="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 text-xl shrink-0">🔌</div>
        <div>
          <p class="font-medium text-foreground text-sm">适配器管理</p>
          <p class="text-xs text-muted mt-0.5">审核、上线或下线站点适配器</p>
        </div>
        <span v-if="pendingAdapters > 0"
          class="ml-auto text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium shrink-0">
          {{ pendingAdapters }} 待审核
        </span>
      </NuxtLink>
      <NuxtLink to="/admin/settings"
        class="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface hover:border-primary-400 hover:bg-surface-muted transition-colors">
        <div class="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 text-xl shrink-0">⚙️</div>
        <div>
          <p class="font-medium text-foreground text-sm">系统设置</p>
          <p class="text-xs text-muted mt-0.5">管理系统配置项</p>
        </div>
      </NuxtLink>
      <a href="/" target="_blank"
        class="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface hover:border-primary-400 hover:bg-surface-muted transition-colors">
        <div class="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 text-xl shrink-0">🌐</div>
        <div>
          <p class="font-medium text-foreground text-sm">查看前台</p>
          <p class="text-xs text-muted mt-0.5">在新标签页打开网站前台</p>
        </div>
      </a>
    </div>
  </div>
</template>
