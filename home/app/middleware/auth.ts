export default defineNuxtRouteMiddleware(async (to) => {
  const localePath = useLocalePath();
  const { status } = useAuth();

  if (status.value === "authenticated") return;

  // 等待 session 加载完成
  if (status.value === "loading") {
    await new Promise((resolve) => {
      const stop = watch(status, (s) => {
        if (s !== "loading") { stop(); resolve(null); }
      });
    });
  }

  if (status.value !== "authenticated") {
    return navigateTo({ path: localePath("/auth/login"), query: { callbackUrl: to.fullPath } });
  }
});
