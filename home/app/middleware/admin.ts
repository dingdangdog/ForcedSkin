export default defineNuxtRouteMiddleware(async (to) => {
  const localePath = useLocalePath();
  const { status, data } = useAuth();

  // 等待 session 加载
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

  const roles: string = (data.value?.user as any)?.roles ?? "";
  const isAdmin = roles.split(",").map((r) => r.trim()).includes("admin");

  if (!isAdmin) {
    return navigateTo(localePath("/"));
  }
});
