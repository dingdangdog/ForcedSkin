<script setup lang="ts">
// 统一入口重定向到 /auth/login（NuxtAuth 标准路径）
const route = useRoute();
const query = route.query.callbackUrl ? `?callbackUrl=${route.query.callbackUrl}` : "";
await navigateTo(`/auth/login${query}`, { replace: true });
</script>
<template></template>
