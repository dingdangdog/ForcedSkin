<script setup lang="ts">
definePageMeta({ layout: false });

useHead({
  title: "登录 — ForcedSkin",
  meta: [
    { name: "description", content: "使用 GitHub 或 Google 账号登录 ForcedSkin，管理你的主题收藏并同步到浏览器扩展。" },
    { name: "robots", content: "noindex, nofollow" },
  ],
});

const { signIn, status, data } = useAuth();
const route = useRoute();

// ⚠️ TODO: 测试工具变量 — 测试通过后删除以下代码块（到 END TODO 注释处）
const runtimeConfig = useRuntimeConfig();
const isDev = computed(() => runtimeConfig.public?.siteUrl?.includes("localhost") || false);
const testLoading = ref<string | null>(null);
const testError = ref("");
async function doTestLogin(userId: string) {
  testLoading.value = userId;
  testError.value = "";
  try {
    await $fetch("/api/dev/test-login", { method: "POST", body: { userId } });
    // 刷新 session 后跳转
    await refreshNuxtData();
    await navigateTo((route.query.callbackUrl as string) || "/");
  } catch (e: any) {
    testError.value = e?.data?.message || "测试登录失败";
  } finally {
    testLoading.value = null;
  }
}
// ⚠️ END TODO

// 读取错误信息（NuxtAuth 通过 ?error= 传递）
const authError = computed(() => {
  const e = route.query.error as string | undefined;
  if (!e) return null;
  const map: Record<string, string> = {
    OAuthSignin: "OAuth 登录失败，请重试",
    OAuthCallback: "OAuth 回调出错，请重试",
    OAuthCreateAccount: "账号创建失败，请重试",
    OAuthAccountNotLinked: "该邮箱已通过其他方式登录，请使用原方式",
    Callback: "登录回调出错",
    Default: "登录失败，请重试",
  };
  return map[e] ?? map.Default;
});

const loading = ref<"github" | "google" | null>(null);

async function signInWith(provider: "github" | "google") {
  loading.value = provider;
  try {
    await signIn(provider, {
      callbackUrl: (route.query.callbackUrl as string) || "/",
    });
  } catch {
    loading.value = null;
  }
}

// 已登录则直接跳转
watch(
  () => status.value,
  (s) => {
    if (s === "authenticated") {
      navigateTo((route.query.callbackUrl as string) || "/");
    }
  },
  { immediate: true }
);

const themeStore = useThemeStore();
</script>

<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-200"
    :class="themeStore.isDark ? 'bg-[#101410] text-[#E0E0E0]' : 'bg-[#F8FFF8] text-[#2C3E2C]'"
  >
    <!-- 暗色切换 -->
    <button
      @click="themeStore.toggleTheme()"
      class="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl border transition-colors"
      :class="themeStore.isDark
        ? 'bg-[#1E221E] border-[#333633] text-[#A0A0A0] hover:text-[#E0E0E0]'
        : 'bg-[#F0FFF0] border-[#D8E8D8] text-[#6C7E6C] hover:text-[#2C3E2C]'"
    >
      <svg v-if="themeStore.isDark" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
      </svg>
      <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
      </svg>
    </button>

    <!-- Logo -->
    <NuxtLink to="/" class="flex items-center gap-2.5 mb-10">
      <img src="/LOGO.webp" alt="ForcedSkin" class="w-10 h-10 object-contain rounded-2xl shadow-lg shadow-[#4CAF50]/20" />
      <span class="font-bold text-2xl">ForcedSkin</span>
    </NuxtLink>

    <!-- 卡片 -->
    <div
      class="w-full max-w-sm rounded-2xl border shadow-xl overflow-hidden"
      :class="themeStore.isDark ? 'bg-[#1E221E] border-[#333633]' : 'bg-[#F0FFF0] border-[#D8E8D8]'"
    >
      <!-- 头部 -->
      <div class="px-6 pt-7 pb-5 text-center border-b" :class="themeStore.isDark ? 'border-[#333633]' : 'border-[#D8E8D8]'">
        <h1 class="text-xl font-bold mb-1">欢迎回来</h1>
        <p class="text-sm" :class="themeStore.isDark ? 'text-[#A0A0A0]' : 'text-[#6C7E6C]'">
          使用以下账号登录 ForcedSkin
        </p>
      </div>

      <!-- 错误提示 -->
      <div
        v-if="authError"
        class="mx-6 mt-5 px-4 py-3 rounded-xl text-sm border"
        :class="themeStore.isDark
          ? 'bg-red-900/30 border-red-800 text-red-300'
          : 'bg-red-50 border-red-200 text-red-700'"
      >
        <span class="mr-1.5">⚠️</span>{{ authError }}
      </div>

      <!-- OAuth 按钮区 -->
      <div class="px-6 py-6 space-y-3">

        <!-- GitHub -->
        <button
          @click="signInWith('github')"
          :disabled="loading !== null"
          class="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 disabled:opacity-70"
          :class="themeStore.isDark
            ? 'bg-white text-gray-900 hover:bg-gray-100 shadow'
            : 'bg-gray-900 text-white hover:bg-gray-800 shadow'"
        >
          <span v-if="loading === 'github'" class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          <svg v-else class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <span>{{ loading === 'github' ? '跳转中…' : '使用 GitHub 登录' }}</span>
        </button>

        <!-- Google -->
        <button
          @click="signInWith('google')"
          :disabled="loading !== null"
          class="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm border transition-all duration-150 disabled:opacity-70"
          :class="themeStore.isDark
            ? 'bg-[#161816] border-[#333633] text-[#E0E0E0] hover:bg-[#1E221E] shadow'
            : 'bg-white border-[#D8E8D8] text-[#2C3E2C] hover:bg-[#F8FFF8] shadow'"
        >
          <span v-if="loading === 'google'" class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          <svg v-else class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{{ loading === 'google' ? '跳转中…' : '使用 Google 登录' }}</span>
        </button>

      </div>

      <!-- 底部说明 -->
      <div
        class="px-6 pb-6 text-center text-xs border-t pt-5"
        :class="themeStore.isDark ? 'border-[#333633] text-[#A0A0A0]' : 'border-[#D8E8D8] text-[#6C7E6C]'"
      >
        登录即表示你同意我们的
        <NuxtLink to="/terms" class="text-[#4CAF50] hover:underline">用户协议</NuxtLink>
        和
        <NuxtLink to="/privacy" class="text-[#4CAF50] hover:underline">隐私政策</NuxtLink>
      </div>
    </div>

    <!-- 回到首页 -->
    <NuxtLink
      to="/"
      class="mt-6 text-sm transition-colors"
      :class="themeStore.isDark ? 'text-[#A0A0A0] hover:text-[#E0E0E0]' : 'text-[#6C7E6C] hover:text-[#2C3E2C]'"
    >
      ← 返回 ForcedSkin 首页
    </NuxtLink>

    <!-- ⚠️ TODO: 测试一键登录区块 — 测试通过后删除此整个 div -->
    <div
      class="w-full max-w-sm mt-6 rounded-2xl border-2 border-dashed border-yellow-400/60 overflow-hidden"
      :class="themeStore.isDark ? 'bg-yellow-900/10' : 'bg-yellow-50'"
    >
      <div class="px-4 py-3 bg-yellow-400/20 flex items-center gap-2 border-b border-yellow-400/30">
        <span class="text-yellow-600 font-bold text-xs">⚠️ 仅开发环境可见 · 测试通过后删除</span>
      </div>
      <div class="px-4 py-4 space-y-2">
        <p class="text-xs text-yellow-700 dark:text-yellow-400 mb-3">测试账号一键登录（不走 OAuth）</p>

        <button
          @click="doTestLogin('test-user-001')"
          :disabled="testLoading !== null"
          class="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-yellow-400 text-yellow-900 hover:bg-yellow-300 disabled:opacity-60 transition-colors"
        >
          <span v-if="testLoading === 'test-user-001'" class="w-4 h-4 border-2 border-yellow-800 border-t-transparent rounded-full animate-spin" />
          <span v-else>👤</span>
          以「测试用户」登录
        </button>

        <button
          @click="doTestLogin('test-admin-001')"
          :disabled="testLoading !== null"
          class="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-orange-400 text-orange-900 hover:bg-orange-300 disabled:opacity-60 transition-colors"
        >
          <span v-if="testLoading === 'test-admin-001'" class="w-4 h-4 border-2 border-orange-800 border-t-transparent rounded-full animate-spin" />
          <span v-else>🛡️</span>
          以「测试管理员」登录
        </button>

        <p v-if="testError" class="text-xs text-red-600 mt-1">{{ testError }}</p>
      </div>
    </div>
    <!-- ⚠️ END TODO -->

  </div>
</template>
