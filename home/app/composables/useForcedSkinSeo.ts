import { APP_LOCALES, DEFAULT_LOCALE, LOCALE_OG_MAP, type AppLocaleCode } from "~/utils/i18n-locales";

type CollectionLd = {
  nameKey: string;
  descriptionKey: string;
};

export type UseForcedSkinSeoOptions = {
  titleKey: string;
  descriptionKey: string;
  ogTitleKey?: string;
  ogDescriptionKey?: string;
  keywordsKey?: string;
  robots?: string;
  /** Structured data for theme listing only */
  collectionPageLd?: CollectionLd;
};

/**
 * Canonical URL、hreflang、og 与结构化数据统一随当前 locale 切换。
 */
export function useForcedSkinSeo(routePath: string, options: UseForcedSkinSeoOptions) {
  const { t, locale } = useI18n();
  const localePath = useLocalePath();
  const config = useRuntimeConfig();
  const siteUrl = (config.public.siteUrl as string).replace(/\/$/, "");

  useHead(() => {
    const pathResolved = localePath(routePath);
    const canonical = `${siteUrl}${pathResolved}`;
    const title = t(options.titleKey);
    const description = t(options.descriptionKey);
    const ogTitle = options.ogTitleKey ? t(options.ogTitleKey) : title;
    const ogDescription = options.ogDescriptionKey ? t(options.ogDescriptionKey) : description;
    const currentCode = locale.value as AppLocaleCode;
    const ogLocale = LOCALE_OG_MAP[currentCode] ?? "en_US";
    const ogAlternates = APP_LOCALES
      .filter((l) => l.code !== currentCode)
      .map((l) => LOCALE_OG_MAP[l.code]);

    const link: Record<string, string>[] = [{ rel: "canonical", href: canonical }];
    const defaultHref = `${siteUrl}${localePath(routePath, DEFAULT_LOCALE)}`;

    for (const { code, iso } of APP_LOCALES) {
      const href = `${siteUrl}${localePath(routePath, code)}`;
      link.push({ rel: "alternate", hreflang: iso, href });
    }

    link.push({ rel: "alternate", hreflang: "x-default", href: defaultHref });

    const meta: Record<string, string>[] = [
      { name: "description", content: description },
      { property: "og:title", content: ogTitle },
      { property: "og:description", content: ogDescription },
      { property: "og:url", content: canonical },
      { property: "og:locale", content: ogLocale },
      ...ogAlternates.map((alt) => ({ property: "og:locale:alternate", content: alt })),
      { property: "og:image", content: "https://forcedskin.com/LOGO.png" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:image", content: "https://forcedskin.com/LOGO.png" },
    ];

    if (options.keywordsKey) meta.push({ name: "keywords", content: t(options.keywordsKey) });
    if (options.robots) meta.push({ name: "robots", content: options.robots });

    const scripts: { type: string; innerHTML: string }[] = [];
    if (options.collectionPageLd) {
      const ldName = t(options.collectionPageLd.nameKey);
      const ldDesc = t(options.collectionPageLd.descriptionKey);
      scripts.push({
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: ldName,
          description: ldDesc,
          url: canonical,
          isPartOf: { "@type": "WebSite", name: "ForcedSkin", url: siteUrl },
        }),
      });
    }

    return {
      title,
      meta,
      link,
      ...(scripts.length ? { script: scripts } : {}),
    };
  });
}
