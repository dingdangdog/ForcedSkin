// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@sidebase/nuxt-auth',
  ],

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
      htmlAttrs: { lang: 'zh-CN' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      titleTemplate: '%s — ForcedSkin',
      meta: [
        { name: 'description', content: '强制换肤 - 为任意网站应用你喜欢的主题配色。浏览器扩展 + 主题商城，支持亮色 / 暗色自由切换，登录后跨设备同步。' },
        { name: 'keywords', content: 'ForcedSkin,强制换肤,浏览器主题,网页换肤,暗色模式,亮色主题,browser theme,dark mode extension,web skin' },
        { name: 'author', content: 'ForcedSkin' },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'ForcedSkin' },
        { property: 'og:locale', content: 'zh_CN' },
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
        { rel: 'canonical', href: 'https://forcedskin.com' },
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
    },
  },
})
