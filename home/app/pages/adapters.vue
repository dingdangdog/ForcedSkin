<script setup lang="ts">
import { doApi } from "~/utils/api";

definePageMeta({ layout: "default" });

const { t } = useI18n();

useHead({
  title: "Site Adapters — ForcedSkin",
  meta: [
    { name: "description", content: "Community-maintained fine-tuned adapters for popular websites, making ForcedSkin theme results more natural." },
    { property: "og:title", content: "Site Adapters — ForcedSkin" },
    { property: "og:description", content: "Browse community-submitted site adapters for more precise theme support on your favorite websites." },
    { property: "og:url", content: "https://forcedskin.com/adapters" },
  ],
  link: [{ rel: "canonical", href: "https://forcedskin.com/adapters" }],
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

const form = reactive({ displayName: "", description: "", siteDomain: "", code: "" });
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
  if (!form.displayName) formErrors.value.displayName = t("adapters.field_display");
  if (!form.siteDomain) formErrors.value.siteDomain = t("adapters.field_domain");
  if (!form.code) formErrors.value.code = t("adapters.field_code");
  return Object.keys(formErrors.value).length === 0;
}

async function submitAdapter() {
  if (!validateForm()) return;
  submitting.value = true;
  try {
    await doApi.post("api/entry/adapters", { ...form });
    showToast(t("adapters.submit_ok"));
    showSubmit.value = false;
    Object.assign(form, { displayName: "", description: "", siteDomain: "", code: "" });
  } catch { showToast(t("adapters.submit_fail")); } finally { submitting.value = false; }
}

onMounted(load);
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-10">
    <div class="flex items-end justify-between mb-8 gap-4 flex-wrap">
      <div>
        <h1 class="text-3xl font-bold text-foreground">{{ t('adapters.title') }}</h1>
        <p class="text-muted mt-1 text-sm">{{ t('adapters.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink to="/guide/adapter" class="px-4 py-2 rounded-xl border border-border text-muted text-sm hover:text-foreground hover:bg-surface-muted transition-colors">
          📖 {{ t('adapters.guide_link') }}
        </NuxtLink>
        <button v-if="isLoggedIn" @click="showSubmit = true"
          class="px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors">
          + {{ t('adapters.submit_btn') }}
        </button>
        <NuxtLink v-else to="/auth/login"
          class="px-4 py-2 rounded-xl border border-border text-muted text-sm hover:text-foreground hover:bg-surface-muted transition-colors">
          {{ t('adapters.login_to_submit') }}
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div v-for="i in 6" :key="i" class="h-28 rounded-2xl bg-surface-muted animate-pulse"></div>
    </div>

    <div v-else-if="adapters.length === 0" class="text-center py-20 text-muted">
      <p class="text-4xl mb-3">🔌</p>
      <p class="text-lg font-medium text-foreground mb-1">{{ t('adapters.no_adapters') }}</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div v-for="adapter in adapters" :key="adapter.id"
        class="bg-surface border border-border rounded-2xl p-5 hover:border-primary-400 transition-colors">
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 font-bold text-base shrink-0">
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
    <div v-if="showSubmit" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="showSubmit = false">
      <div class="bg-background border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
      <div class="flex items-start justify-between mb-4">
          <h2 class="font-bold text-foreground text-lg">{{ t('adapters.modal_title') }}</h2>
          <NuxtLink to="/guide/adapter" target="_blank" class="text-xs text-primary-500 hover:underline shrink-0 mt-1">
            📖 {{ t('adapters.guide_link') }}
          </NuxtLink>
        </div>
        <div class="space-y-4">
          <div>
              <label class="text-xs text-muted mb-1 block">{{ t('adapters.field_display') }} *</label>
              <input v-model="form.displayName" :placeholder="t('adapters.field_display_ph')"
                class="w-full px-3 py-2 rounded-lg border text-sm bg-surface text-foreground outline-none"
                :class="formErrors.displayName ? 'border-red-400' : 'border-border focus:border-primary-400'" />
              <p v-if="formErrors.displayName" class="text-red-500 text-xs mt-0.5">{{ formErrors.displayName }}</p>
            </div>
          <div>
            <label class="text-xs text-muted mb-1 block">{{ t('adapters.field_domain') }} *</label>
            <input v-model="form.siteDomain" :placeholder="t('adapters.field_domain_ph')"
              class="w-full px-3 py-2 rounded-lg border text-sm bg-surface text-foreground outline-none"
              :class="formErrors.siteDomain ? 'border-red-400' : 'border-border focus:border-primary-400'" />
            <p v-if="formErrors.siteDomain" class="text-red-500 text-xs mt-0.5">{{ formErrors.siteDomain }}</p>
          </div>
          <div>
            <label class="text-xs text-muted mb-1 block">{{ t('adapters.field_desc') }}</label>
            <input v-model="form.description"
              class="w-full px-3 py-2 rounded-lg border border-border focus:border-primary-400 text-sm bg-surface text-foreground outline-none" />
          </div>
          <div>
            <label class="text-xs text-muted mb-1 block">{{ t('adapters.field_code') }} *</label>
            <textarea v-model="form.code" rows="8" placeholder="// JS adapter code..."
              class="w-full px-3 py-2 rounded-lg border text-xs font-mono text-foreground bg-surface outline-none resize-y"
              :class="formErrors.code ? 'border-red-400' : 'border-border focus:border-primary-400'" />
            <p v-if="formErrors.code" class="text-red-500 text-xs mt-0.5">{{ formErrors.code }}</p>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="submitAdapter" :disabled="submitting"
            class="flex-1 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 disabled:opacity-60 transition-colors">
            {{ submitting ? t('adapters.submitting') : t('adapters.submit') }}
          </button>
          <button @click="showSubmit = false"
            class="px-4 py-2.5 rounded-xl border border-border text-muted text-sm hover:text-foreground transition-colors">
            {{ t('adapters.cancel') }}
          </button>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="toast"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium shadow-lg">
        {{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
