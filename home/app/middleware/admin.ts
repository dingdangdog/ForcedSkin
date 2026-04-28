export default defineNuxtRouteMiddleware(async (to) => {
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
    return navigateTo(`/auth/login?callbackUrl=${encodeURIComponent(to.fullPath)}`);
  }

  // 检查 admin 角色（roles 字段在 jwt callback 中写入了 session）
  const roles: string = (data.value?.user as any)?.roles ?? "";
  const isAdmin = roles.split(",").map((r) => r.trim()).includes("admin");

  if (!isAdmin) {
    return navigateTo("/");
  }
});
