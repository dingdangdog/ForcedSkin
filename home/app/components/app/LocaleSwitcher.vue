<script setup lang="ts">
import { ChevronDownIcon, CheckIcon } from "@heroicons/vue/24/outline";
import { APP_LOCALES, localeMeta, type AppLocaleCode } from "~/utils/i18n-locales";

const { locale, t } = useI18n();
const switchLocalePath = useSwitchLocalePath();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

const current = computed(() => localeMeta(locale.value) ?? APP_LOCALES[0]);

function switchTo(code: AppLocaleCode) {
  if (code === locale.value) {
    isOpen.value = false;
    return;
  }
  const href = switchLocalePath(code);
  if (href) navigateTo(href);
  isOpen.value = false;
}

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
}

watch(isOpen, (open) => {
  if (open) document.addEventListener("click", handleClickOutside);
  else document.removeEventListener("click", handleClickOutside);
});

onUnmounted(() => document.removeEventListener("click", handleClickOutside));
</script>

<template>
  <div ref="containerRef" class="relative">
    <button
      type="button"
      class="flex items-center gap-1 px-2 py-1 rounded-lg text-sm border border-border text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
      :aria-label="t('common.language')"
      :aria-expanded="isOpen"
      @click.stop="isOpen = !isOpen"
    >
      <span class="text-base leading-none" aria-hidden="true">{{ current.flag }}</span>
      <span class="hidden sm:inline text-xs font-medium max-w-[5rem] truncate">{{ current.name }}</span>
      <ChevronDownIcon class="w-3.5 h-3.5 shrink-0 transition-transform" :class="isOpen && 'rotate-180'" />
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 z-50 mt-1 min-w-[10rem] rounded-lg border border-border bg-surface text-foreground shadow-lg py-1"
        role="listbox"
        :aria-label="t('common.language')"
      >
        <button
          v-for="item in APP_LOCALES"
          :key="item.code"
          type="button"
          role="option"
          :aria-selected="locale === item.code"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
          :class="locale === item.code
            ? 'bg-primary-50 text-primary-600'
            : 'text-foreground hover:bg-surface-muted'"
          @click="switchTo(item.code)"
        >
          <span class="text-base leading-none" aria-hidden="true">{{ item.flag }}</span>
          <span class="flex-1 truncate">{{ item.name }}</span>
          <CheckIcon v-if="locale === item.code" class="w-4 h-4 shrink-0 text-primary-600" />
        </button>
      </div>
    </Transition>
  </div>
</template>
