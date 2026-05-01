<script setup lang="ts">
const { t } = useI18n();

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

const props = defineProps<{ theme: Theme }>();

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

const swatches = computed(() => [bg.value, surface.value, primary.value, fg.value, muted.value]);
</script>

<template>
  <div
    class="rounded-xl overflow-hidden border-2 border-border cursor-default w-full"
    data-gts-ignore
  >
    <!-- 仅配色与迷你 UI 示意，不含名称/描述（由列表右侧展示） -->
    <div class="p-2 sm:p-2.5" :style="{ backgroundColor: bg }">
      <div class="flex gap-2 sm:gap-2.5 items-stretch min-h-[4.5rem] sm:min-h-[5rem]">
        <div class="flex-1 min-w-0 flex flex-col gap-1 sm:gap-1.5 justify-center">
          <div
            class="flex items-center gap-1.5 px-2 py-1 rounded-md shrink-0"
            :style="{ backgroundColor: surface, borderColor: border, border: '1px solid' }"
          >
            <div class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: primary }" />
            <div class="flex-1 h-1.5 rounded min-w-0" :style="{ backgroundColor: border }" />
            <div class="w-3 h-1.5 rounded shrink-0" :style="{ backgroundColor: muted, opacity: 0.55 }" />
          </div>
          <div
            class="px-2 py-1.5 rounded-md space-y-1 flex-1 min-h-0 flex flex-col justify-center"
            :style="{ backgroundColor: surface, borderColor: border, border: '1px solid' }"
          >
            <div class="flex gap-1.5 items-center">
              <div class="w-3.5 h-3.5 rounded-full shrink-0" :style="{ backgroundColor: primary }" />
              <div class="h-1.5 flex-1 rounded max-w-[5rem]" :style="{ backgroundColor: fg, opacity: 0.85 }" />
            </div>
            <div class="flex gap-1 flex-wrap items-center">
              <div
                class="px-1.5 py-px rounded text-[10px] leading-tight font-medium"
                :style="{ backgroundColor: primary, color: bg }"
              >
                {{ t("card.mock_btn") }}
              </div>
              <div
                class="px-1.5 py-px rounded text-[10px] leading-tight"
                :style="{ backgroundColor: 'transparent', color: muted, border: `1px solid ${border}` }"
              >
                {{ t("card.mock_secondary") }}
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-1 justify-center shrink-0 py-0.5" aria-hidden="true">
          <div
            v-for="(c, i) in swatches"
            :key="`swatch-${i}`"
            class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-white/20 shadow-sm"
            :style="{ backgroundColor: c }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
