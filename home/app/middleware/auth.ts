export default defineNuxtRouteMiddleware(async (to) => {
  const { status, signIn } = useAuth();

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
    return navigateTo(`/auth/login?callbackUrl=${encodeURIComponent(to.fullPath)}`);
  }
});
