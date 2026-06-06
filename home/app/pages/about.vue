<script setup lang="ts">
definePageMeta({ layout: "default" });

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/nljhbgiempaeoklghhpmhnphihlkhalm";

const localePath = useLocalePath();
const { t } = useI18n();

useForcedSkinSeo("/about", {
  titleKey: "seo.about.title",
  descriptionKey: "seo.about.description",
  ogTitleKey: "seo.about.og_title",
  ogDescriptionKey: "seo.about.og_description",
});

const websiteFeatures = [
  { icon: "🎨", titleKey: "about.website.themes.title", bodyKey: "about.website.themes.body" },
  { icon: "🔌", titleKey: "about.website.adapters.title", bodyKey: "about.website.adapters.body" },
  { icon: "👤", titleKey: "about.website.account.title", bodyKey: "about.website.account.body" },
  { icon: "📖", titleKey: "about.website.guides.title", bodyKey: "about.website.guides.body" },
] as const;

const extensionFeatures = [
  { icon: "🌐", titleKey: "about.extension.force.title", bodyKey: "about.extension.force.body" },
  { icon: "☀️", titleKey: "about.extension.modes.title", bodyKey: "about.extension.modes.body" },
  { icon: "✅", titleKey: "about.extension.whitelist.title", bodyKey: "about.extension.whitelist.body" },
  { icon: "🔄", titleKey: "about.extension.sync.title", bodyKey: "about.extension.sync.body" },
  { icon: "🛠️", titleKey: "about.extension.builder.title", bodyKey: "about.extension.builder.body" },
] as const;

const howSteps = [
  "about.how.step1",
  "about.how.step2",
  "about.how.step3",
  "about.how.step4",
] as const;
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-16">
    <!-- Header -->
    <div class="mb-12 text-center">
      <div
        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 text-primary-600 text-sm font-medium mb-5">
        <img src="/LOGO.webp" alt="" class="w-4 h-4 object-contain" />
        ForcedSkin
      </div>
      <h1 class="text-3xl md:text-4xl font-bold text-foreground mb-4">{{ t('about.title') }}</h1>
      <p class="text-muted text-base md:text-lg leading-relaxed max-w-2xl mx-auto">{{ t('about.subtitle') }}</p>
    </div>

    <!-- What is ForcedSkin -->
    <section class="mb-12">
      <div class="bg-primary-500/5 border border-primary-500/20 rounded-xl p-5 md:p-6">
        <h2 class="text-lg font-bold text-foreground mb-3">{{ t('about.what.title') }}</h2>
        <p class="text-muted leading-relaxed">{{ t('about.what.body') }}</p>
      </div>
    </section>

    <!-- Website -->
    <section class="mb-12">
      <h2 class="text-xl font-bold text-foreground mb-2">{{ t('about.website.title') }}</h2>
      <p class="text-muted text-sm mb-6 leading-relaxed">{{ t('about.website.intro') }}</p>
      <div class="grid gap-4 sm:grid-cols-2">
        <div v-for="feat in websiteFeatures" :key="feat.titleKey"
          class="rounded-xl border border-border bg-surface p-4 hover:border-primary-400/50 transition-colors">
          <div class="text-2xl mb-2">{{ feat.icon }}</div>
          <h3 class="font-semibold text-foreground mb-1.5">{{ t(feat.titleKey) }}</h3>
          <p class="text-muted text-sm leading-relaxed">{{ t(feat.bodyKey) }}</p>
        </div>
      </div>
    </section>

    <!-- Extension -->
    <section class="mb-12">
      <h2 class="text-xl font-bold text-foreground mb-2">{{ t('about.extension.title') }}</h2>
      <p class="text-muted text-sm mb-6 leading-relaxed">{{ t('about.extension.intro') }}</p>
      <div class="space-y-3">
        <div v-for="feat in extensionFeatures" :key="feat.titleKey"
          class="flex gap-4 rounded-xl border border-border bg-surface p-4">
          <div class="text-xl shrink-0 mt-0.5">{{ feat.icon }}</div>
          <div>
            <h3 class="font-semibold text-foreground mb-1">{{ t(feat.titleKey) }}</h3>
            <p class="text-muted text-sm leading-relaxed">{{ t(feat.bodyKey) }}</p>
          </div>
        </div>
      </div>
      <p class="text-muted text-xs mt-4">{{ t('about.extension.browsers') }}</p>
    </section>

    <!-- How it works -->
    <section class="mb-12">
      <h2 class="text-xl font-bold text-foreground mb-4">{{ t('about.how.title') }}</h2>
      <ol class="space-y-3">
        <li v-for="(stepKey, i) in howSteps" :key="stepKey"
          class="flex gap-4 rounded-xl bg-surface-muted p-4">
          <span
            class="shrink-0 w-7 h-7 rounded-full bg-primary-500/15 text-primary-600 text-sm font-bold flex items-center justify-center">
            {{ i + 1 }}
          </span>
          <p class="text-muted text-sm leading-relaxed pt-0.5">{{ t(stepKey) }}</p>
        </li>
      </ol>
    </section>

    <!-- Privacy note -->
    <section class="mb-12">
      <p class="text-muted text-sm leading-relaxed border-l-2 border-primary-500/40 pl-4">
        {{ t('about.privacy_note') }}
        <NuxtLink :to="localePath('/privacy')" class="text-primary-500 hover:underline ml-1">
          {{ t('footer.privacy') }}
        </NuxtLink>
      </p>
    </section>

    <!-- CTA -->
    <section class="rounded-2xl border border-border bg-primary-500/5 p-6 md:p-8 text-center">
      <h2 class="text-xl font-bold text-foreground mb-2">{{ t('about.cta.title') }}</h2>
      <p class="text-muted text-sm mb-6">{{ t('about.cta.desc') }}</p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <a :href="CHROME_STORE_URL" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 transition-colors">
          {{ t('about.cta.extension') }}
        </a>
        <NuxtLink :to="localePath('/themes')"
          class="px-6 py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-surface-muted transition-colors">
          {{ t('about.cta.themes') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/auth/login')"
          class="px-6 py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-surface-muted transition-colors">
          {{ t('about.cta.login') }}
        </NuxtLink>
      </div>
    </section>

    <!-- Footer links -->
    <div class="mt-12 pt-8 border-t border-border flex flex-wrap gap-4">
      <NuxtLink :to="localePath('/guide/theme')" class="text-primary-500 hover:underline text-sm">
        {{ t('footer.guide_theme') }} →
      </NuxtLink>
      <NuxtLink :to="localePath('/guide/adapter')" class="text-primary-500 hover:underline text-sm">
        {{ t('footer.guide_adapter') }} →
      </NuxtLink>
      <NuxtLink :to="localePath('/')" class="text-muted hover:text-foreground text-sm">
        {{ t('about.back_home') }}
      </NuxtLink>
    </div>
  </div>
</template>
