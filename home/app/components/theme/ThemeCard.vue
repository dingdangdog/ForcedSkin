<script setup lang="ts">
interface ThemeColors {
  background?: string;
  foreground?: string;
  surface?: string;
  surfaceMuted?: string;
  border?: string;
  muted?: string;
  primary?: Record<string, string> | string;
}

interface Theme {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  mode: string;
  colors: string | ThemeColors;
}

const props = defineProps<{
  theme: Theme;
  favorited?: boolean;
  selected?: boolean;
  showActions?: boolean;
}>();

const emit = defineEmits<{
  favorite: [theme: Theme];
  select: [theme: Theme];
}>();

const colors = computed<ThemeColors>(() => {
  if (!props.theme.colors) return {};
  if (typeof props.theme.colors === "string") {
    try { return JSON.parse(props.theme.colors); } catch { return {}; }
  }
  return props.theme.colors as ThemeColors;
});

const bg = computed(() => colors.value.background || (props.theme.mode === "dark" ? "#101410" : "#F8FFF8"));
const fg = computed(() => colors.value.foreground || (props.theme.mode === "dark" ? "#E0E0E0" : "#2C3E2C"));
const surface = computed(() => colors.value.surface || (props.theme.mode === "dark" ? "#1E221E" : "#F0FFF0"));
const border = computed(() => colors.value.border || (props.theme.mode === "dark" ? "#333633" : "#D8E8D8"));
const muted = computed(() => colors.value.muted || (props.theme.mode === "dark" ? "#A0A0A0" : "#6C7E6C"));
const primary = computed(() => {
  const p = colors.value.primary;
  if (!p) return props.theme.mode === "dark" ? "#4A9B6B" : "#4CAF50";
  if (typeof p === "string") return p;
  return p["500"] || p["600"] || "#4CAF50";
});
</script>

<template>
  <div
    class="relative rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer group"
    :class="selected ? 'border-primary-500 shadow-lg shadow-primary-500/20' : 'border-border hover:border-primary-400'"
    @click="emit('select', theme)"
  >
    <!-- 主题预览区 -->
    <div class="p-4 space-y-2" :style="{ backgroundColor: bg }">
      <!-- 模拟导航栏 -->
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg" :style="{ backgroundColor: surface, borderColor: border, border: '1px solid' }">
        <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: primary }"></div>
        <div class="flex-1 h-2 rounded" :style="{ backgroundColor: border }"></div>
        <div class="w-4 h-2 rounded" :style="{ backgroundColor: muted, opacity: 0.5 }"></div>
      </div>

      <!-- 模拟内容卡片 -->
      <div class="px-3 py-2 rounded-lg space-y-1.5" :style="{ backgroundColor: surface, borderColor: border, border: '1px solid' }">
        <div class="flex gap-2 items-center">
          <div class="w-5 h-5 rounded-full" :style="{ backgroundColor: primary }"></div>
          <div class="h-2.5 w-24 rounded" :style="{ backgroundColor: fg, opacity: 0.85 }"></div>
        </div>
        <div class="space-y-1">
          <div class="h-1.5 w-full rounded" :style="{ backgroundColor: fg, opacity: 0.3 }"></div>
          <div class="h-1.5 w-3/4 rounded" :style="{ backgroundColor: fg, opacity: 0.3 }"></div>
        </div>
        <div class="flex gap-1.5">
          <div class="px-2 py-0.5 rounded text-xs font-medium" :style="{ backgroundColor: primary, color: bg }">按钮</div>
          <div class="px-2 py-0.5 rounded text-xs" :style="{ backgroundColor: 'transparent', color: muted, border: `1px solid ${border}` }">次要</div>
        </div>
      </div>

      <!-- 配色色块行 -->
      <div class="flex gap-1 px-1">
        <div v-for="c in [bg, surface, primary, fg, muted]" :key="c" class="flex-1 h-2 rounded-full" :style="{ backgroundColor: c }"></div>
      </div>
    </div>

    <!-- 信息区 -->
    <div class="px-4 py-3 bg-surface-muted border-t border-border">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="font-semibold text-foreground text-sm truncate">{{ theme.displayName }}</p>
          <p class="text-muted text-xs truncate mt-0.5">{{ theme.description || theme.name }}</p>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <span
            class="text-xs px-1.5 py-0.5 rounded font-medium"
            :class="theme.mode === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-amber-100 text-amber-800'"
          >{{ theme.mode === 'dark' ? '暗色' : '亮色' }}</span>
          <span v-if="selected" class="text-xs px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 font-medium">已选</span>
        </div>
      </div>
    </div>

    <!-- 操作按钮（hover 展示） -->
    <div
      v-if="showActions"
      class="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <button
        class="w-7 h-7 flex items-center justify-center rounded-full shadow-md transition-colors"
        :class="favorited ? 'bg-red-500 text-white' : 'bg-surface text-muted hover:text-red-500'"
        @click.stop="emit('favorite', theme)"
        :title="favorited ? '取消收藏' : '收藏'"
      >
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
        </svg>
      </button>
    </div>

    <!-- 已选标记 -->
    <div v-if="selected" class="absolute top-2 left-2">
      <div class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shadow">
        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
    </div>
  </div>
</template>
