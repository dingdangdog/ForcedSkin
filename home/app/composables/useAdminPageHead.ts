/**
 * 后台页禁用全局 titleTemplate（nuxt.config app.head.titleTemplate），避免标题重复；
 * Unhead 类型未收录 `titleTemplate: false`，在此统一断言。
 */
export function useAdminPageHead(title: string) {
  useHead({
    title,
    titleTemplate: false,
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  } as unknown as Parameters<typeof useHead>[0]);
}
