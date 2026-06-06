import { prefixedAuthLoginPath } from "~/utils/i18n-locales";

/**
 * 在无法调用 useLocalePath 的上下文（例如部分 $fetch 响应拦截逻辑）内，
 * 根据与 @nuxtjs/i18n 一致的 locale cookie 推导登录路径。
 * 对应 strategy: prefix_except_default（默认 en 无前缀）。
 */
export function prefixedAuthLoginFromCookie(): string {
  const c = useCookie<string | undefined | null>("i18n_locale");
  const code = typeof c.value === "string" ? c.value : "";
  return prefixedAuthLoginPath(code);
}
