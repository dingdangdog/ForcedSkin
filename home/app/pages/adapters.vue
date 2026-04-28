<script setup lang="ts">
import { doApi } from "~/utils/api";

definePageMeta({ layout: "default" });

useHead({
  title: "网站适配器 — ForcedSkin",
  meta: [
    { name: "description", content: "ForcedSkin 网站适配器商城：针对 B站、知乎、GitHub 等常见网站的精细换肤适配器，让主题效果更精准。" },
    { property: "og:title", content: "网站适配器 — ForcedSkin" },
    { property: "og:description", content: "浏览社区提交的网站换肤适配器，让 ForcedSkin 对常见网站有更精准的主题支持。" },
    { property: "og:url", content: "https://forcedskin.com/adapters" },
  ],
  link: [{ rel: "canonical", href: "https://forcedskin.com/adapters" }],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "ForcedSkin 网站适配器",
        "description": "针对常见网站的精细换肤适配器",
        "url": "https://forcedskin.com/adapters",
        "isPartOf": { "@type": "WebSite", "name": "ForcedSkin", "url": "https://forcedskin.com" },
      }),
    },
  ],
});

interface Adapter {
  id: string;
  name: string;
  displayName: string;
  description: string;
  siteDomain: string;
}

const { status } = useAuth();
const adapters = ref<Adapter[]>([]);
const loading = ref(true);
const showSubmit = ref(false);
const submitting = ref(false);
const toast = ref("");

const form = reactive({ name: "", displayName: "", description: "", siteDomain: "", code: "" });
const formErrors = ref<Record<string, string>>({});

const isLoggedIn = computed(() => status.value === "authenticated");

const showToast = (msg: string) => { toast.value = msg; setTimeout(() => { toast.value = ""; }, 2500); };

async function load() {
  loading.value = true;
  try {
    const res = await doApi.get<any>("api/adapters", { pageSize: 100 });
    adapters.value = res.list || [];
  } finally { loading.value = false; }
}

function validateForm() {
  formErrors.value = {};
  if (!form.name) formErrors.value.name = "必填";
  else if (!/^[a-z0-9-]+$/.test(form.name)) formErrors.value.name = "只允许小写字母、数字、连字符";
  if (!form.displayName) formErrors.value.displayName = "必填";
  if (!form.siteDomain) formErrors.value.siteDomain = "必填";
  if (!form.code) formErrors.value.code = "必填";
  return Object.keys(formErrors.value).length === 0;
}

async function submitAdapter() {
  if (!validateForm()) return;
  submitting.value = true;
  try {
    await doApi.post("api/entry/adapters", { ...form });
    showToast("提交成功，等待管理员审核");
    showSubmit.value = false;
    Object.assign(form, { name: "", displayName: "", description: "", siteDomain: "", code: "" });
  } catch { showToast("提交失败，请稍后重试"); } finally { submitting.value = false; }
}

onMounted(load);
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-10">
    <div class="flex items-end justify-between mb-8 gap-4 flex-wrap">
      <div>
        <h1 class="text-3xl font-bold text-foreground">网站适配器</h1>
        <p class="text-muted mt-1 text-sm">针对特定网站的精细换肤适配，社区提交，官方审核</p>
      </div>
      <button
        v-if="isLoggedIn"
        @click="showSubmit = true"
        class="px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
      >
        + 提交适配器
      </button>
      <NuxtLink
        v-else
        to="/login"
        class="px-4 py-2 rounded-xl border border-border text-muted text-sm hover:text-foreground hover:bg-surface-muted transition-colors"
      >
        登录后提交
      </NuxtLink>
    </div>

    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div v-for="i in 6" :key="i" class="h-28 rounded-2xl bg-surface-muted animate-pulse"></div>
    </div>

    <div v-else-if="adapters.length === 0" class="text-center py-20 text-muted">
      <p class="text-4xl mb-3">🔌</p>
      <p class="text-lg font-medium text-foreground mb-1">暂无适配器</p>
      <p class="text-sm">成为第一个提交适配器的人！</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div
        v-for="adapter in adapters"
        :key="adapter.id"
        class="bg-surface border border-border rounded-2xl p-5 hover:border-primary-400 transition-colors"
      >
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 font-bold text-base shrink-0">
            {{ adapter.displayName.charAt(0) }}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-foreground">{{ adapter.displayName }}</h3>
            <p class="text-xs text-muted font-mono mt-0.5">{{ adapter.siteDomain }}</p>
            <p v-if="adapter.description" class="text-muted text-xs mt-1.5 line-clamp-2">{{ adapter.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 提交弹窗 -->
    <div v-if="showSubmit" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="showSubmit = false">
      <div class="bg-background border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 class="font-bold text-foreground text-lg mb-4">提交网站适配器</h2>
        <p class="text-muted text-xs mb-5">适配器将经过管理员安全审核后上线，请确保代码安全合规。</p>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted mb-1 block">标识 name * <span class="font-normal">（英文）</span></label>
              <input v-model="form.name" placeholder="bilibili" class="w-full px-3 py-2 rounded-lg border text-sm bg-surface text-foreground outline-none" :class="formErrors.name ? 'border-red-400' : 'border-border focus:border-primary-400'" />
              <p v-if="formErrors.name" class="text-red-500 text-xs mt-0.5">{{ formErrors.name }}</p>
            </div>
            <div>
              <label class="text-xs text-muted mb-1 block">显示名称 *</label>
              <input v-model="form.displayName" placeholder="哔哩哔哩" class="w-full px-3 py-2 rounded-lg border text-sm bg-surface text-foreground outline-none" :class="formErrors.displayName ? 'border-red-400' : 'border-border focus:border-primary-400'" />
              <p v-if="formErrors.displayName" class="text-red-500 text-xs mt-0.5">{{ formErrors.displayName }}</p>
            </div>
          </div>
          <div>
            <label class="text-xs text-muted mb-1 block">适配域名 * <span class="font-normal">（多个用逗号分隔）</span></label>
            <input v-model="form.siteDomain" placeholder="bilibili.com, b23.tv" class="w-full px-3 py-2 rounded-lg border text-sm bg-surface text-foreground outline-none" :class="formErrors.siteDomain ? 'border-red-400' : 'border-border focus:border-primary-400'" />
            <p v-if="formErrors.siteDomain" class="text-red-500 text-xs mt-0.5">{{ formErrors.siteDomain }}</p>
          </div>
          <div>
            <label class="text-xs text-muted mb-1 block">描述</label>
            <input v-model="form.description" placeholder="简述适配器的功能和效果" class="w-full px-3 py-2 rounded-lg border border-border focus:border-primary-400 text-sm bg-surface text-foreground outline-none" />
          </div>
          <div>
            <label class="text-xs text-muted mb-1 block">适配器代码 * <span class="font-normal">（纯 JavaScript）</span></label>
            <textarea v-model="form.code" rows="8" placeholder="// 在此输入适配器 JS 代码..." class="w-full px-3 py-2 rounded-lg border text-xs font-mono text-foreground bg-surface outline-none resize-y" :class="formErrors.code ? 'border-red-400' : 'border-border focus:border-primary-400'" />
            <p v-if="formErrors.code" class="text-red-500 text-xs mt-0.5">{{ formErrors.code }}</p>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="submitAdapter" :disabled="submitting" class="flex-1 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 disabled:opacity-60 transition-colors">
            {{ submitting ? '提交中…' : '提交审核' }}
          </button>
          <button @click="showSubmit = false" class="px-4 py-2.5 rounded-xl border border-border text-muted text-sm hover:text-foreground transition-colors">取消</button>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium shadow-lg">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }
</style>
