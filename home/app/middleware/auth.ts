export default defineNuxtRouteMiddleware(async (to) => {
  const localePath = useLocalePath();
  const { status } = useAuth();

  type S = "authenticated" | "unauthenticated" | "loading";
  let st = status.value as S;
  if (st === "authenticated") return;

  if (st === "loading") {
    await new Promise<void>((resolve) => {
      const stop = watch(status, (s) => {
        if (s !== "loading") { stop(); resolve(); }
      });
    });
    st = status.value as S;
  }

  if (st !== "authenticated") {
    return navigateTo({ path: localePath("/auth/login"), query: { callbackUrl: to.fullPath } });
  }
});
