<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { locale } = useI18n();
useHead(() => ({
  htmlAttrs: {
    lang: locale.value === "zh" ? "zh-CN" : "en",
  },
}));
</script>

