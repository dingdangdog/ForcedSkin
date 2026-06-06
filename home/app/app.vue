<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { LOCALE_ISO_MAP, type AppLocaleCode } from "~/utils/i18n-locales";

const { locale } = useI18n();
useHead(() => ({
  htmlAttrs: {
    lang: LOCALE_ISO_MAP[locale.value as AppLocaleCode] ?? "en",
  },
}));
</script>

