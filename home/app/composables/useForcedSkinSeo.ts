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

const HREFLANG: Record<string, string> = {
  en: "en",
  zh: "zh-CN",
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
    const ogLocale = locale.value === "zh" ? "zh_CN" : "en_US";
    const ogAlternate = locale.value === "zh" ? "en_US" : "zh_CN";

    const link: Record<string, string>[] = [{ rel: "canonical", href: canonical }];
    const codes = ["en", "zh"] as const;

    const defaultHref = `${siteUrl}${localePath(routePath, "en")}`;

    for (const code of codes) {
      const hreflang = HREFLANG[code];
      if (!hreflang) continue;
      const href = `${siteUrl}${localePath(routePath, code)}`;
      link.push({ rel: "alternate", hreflang, href });
    }

    link.push({ rel: "alternate", hreflang: "x-default", href: defaultHref });

    const meta: Record<string, string>[] = [
      { name: "description", content: description },
      { property: "og:title", content: ogTitle },
      { property: "og:description", content: ogDescription },
      { property: "og:url", content: canonical },
      { property: "og:locale", content: ogLocale },
      { property: "og:locale:alternate", content: ogAlternate },
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
