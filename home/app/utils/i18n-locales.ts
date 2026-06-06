/** 与 nuxt.config i18n.locales 保持同步的 locale 元数据 */
export const DEFAULT_LOCALE = "en" as const;

export type AppLocaleCode = "en" | "en-GB" | "zh" | "ja" | "es" | "de";

export interface LocaleMeta {
  code: AppLocaleCode;
  iso: string;
  flag: string;
  name: string;
}

export const APP_LOCALES: readonly LocaleMeta[] = [
  { code: "en", iso: "en-US", flag: "🇺🇸", name: "English" },
  { code: "en-GB", iso: "en-GB", flag: "🇬🇧", name: "English (UK)" },
  { code: "zh", iso: "zh-CN", flag: "🇨🇳", name: "中文" },
  { code: "ja", iso: "ja-JP", flag: "🇯🇵", name: "日本語" },
  { code: "es", iso: "es-ES", flag: "🇪🇸", name: "Español" },
  { code: "de", iso: "de-DE", flag: "🇩🇪", name: "Deutsch" },
] as const;

export const NON_DEFAULT_LOCALE_CODES = APP_LOCALES
  .filter((l) => l.code !== DEFAULT_LOCALE)
  .map((l) => l.code);

/** hreflang / html lang 映射 */
export const LOCALE_ISO_MAP: Record<AppLocaleCode, string> = Object.fromEntries(
  APP_LOCALES.map((l) => [l.code, l.iso]),
) as Record<AppLocaleCode, string>;

/** Open Graph locale（下划线格式） */
export const LOCALE_OG_MAP: Record<AppLocaleCode, string> = {
  en: "en_US",
  "en-GB": "en_GB",
  zh: "zh_CN",
  ja: "ja_JP",
  es: "es_ES",
  de: "de_DE",
};

export function localeMeta(code: string): LocaleMeta | undefined {
  return APP_LOCALES.find((l) => l.code === code);
}

/** 去掉路径上的 locale 前缀（用于 admin 路由高亮等） */
export function stripLocalePrefix(path: string): string {
  let s = path.replace(/\/$/, "") || "/";
  for (const code of NON_DEFAULT_LOCALE_CODES) {
    const prefix = `/${code}`;
    if (s === prefix || s.startsWith(`${prefix}/`)) {
      return s.slice(prefix.length) || "/";
    }
  }
  return s;
}

/** prefix_except_default 策略下的登录路径 */
export function prefixedAuthLoginPath(localeCode: string): string {
  if (!localeCode || localeCode === DEFAULT_LOCALE) return "/auth/login";
  return `/${localeCode}/auth/login`;
}
