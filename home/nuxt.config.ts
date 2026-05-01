// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@sidebase/nuxt-auth', '@nuxtjs/i18n'],

  i18n: {
    langDir: 'locales/',
    locales: [
      { code: 'en', iso: 'en-US', file: 'en.json', name: 'English' },
      { code: 'zh', iso: 'zh-CN', file: 'zh.json', name: '中文' },
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'en',
    },
  },

  // 全局 CSS — 含主题 CSS 变量默认值，确保首屏正确渲染
  css: ['~/assets/css/main.css'],

  // NuxtAuth 配置
  auth: {
    baseURL: process.env.NUXT_AUTH_ORIGIN || "https://www.aitlog.com/api/auth",
    // Disable global authentication middleware
    globalAppMiddleware: false,
    originEnvKey: "NUXT_AUTH_ORIGIN",
    provider: {
      type: "authjs",
      trustHost: false,
      addDefaultCallbackUrl: false,
    },
    sessionRefresh: {
      enablePeriodically: false, // Enable periodic session refresh
      enableOnWindowFocus: false,
    },
  },

  // 全局运行时配置
  runtimeConfig: {
    // NuxtAuth 密钥（同时用于我们自己的 JWT）
    authSecret: process.env.AUTH_SECRET || 'change-me-in-production',
    env: process.env.NODE_ENV || 'development',
    dataPath: process.env.DATA_PATH || './data',
    // GitHub OAuth App
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecrets: process.env.GITHUB_CLIENT_SECRET || '',
    },
    // Google OAuth App
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecrets: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    authOrigin: "", // 见 NUXT_AUTH_ORIGIN，权限框架使用
    public: {
      siteUrl: 'https://forcedskin.com',
      siteName: 'ForcedSkin',
    },
  },

  // 全局 head SEO
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      titleTemplate: '%s — ForcedSkin',
      meta: [
        { name: 'description', content: 'ForcedSkin — apply your chosen light or dark theme to any website. Extension plus theme marketplace, cross-device sync when signed in.' },
        { name: 'keywords', content: 'ForcedSkin,forced skin,browser theme,web skin,dark mode,Chrome extension, forced skin zh' },
        { name: 'author', content: 'ForcedSkin' },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'ForcedSkin' },
        { property: 'og:image', content: 'https://forcedskin.com/LOGO.png' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:site', content: '@forcedskin' },
        { name: 'twitter:image', content: 'https://forcedskin.com/LOGO.png' },
        { name: 'theme-color', content: '#4CAF50' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/webp', href: '/LOGO.webp', sizes: 'any' },
        { rel: 'apple-touch-icon', href: '/LOGO.webp' },
      ],
    },
  },

  nitro: {
    routeRules: {
      '/api/pub/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        },
      },
      '/account/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
      '/admin/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
      '/auth/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
      '/zh/account/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
      '/zh/admin/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
      '/zh/auth/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    },
  },
})