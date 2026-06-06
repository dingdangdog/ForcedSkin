<script setup lang="ts">
definePageMeta({ layout: "default" });
const localePath = useLocalePath();
const { t } = useI18n();

useForcedSkinSeo("/guide/theme", {
  titleKey: "seo.guide_theme.title",
  descriptionKey: "seo.guide_theme.description",
  ogTitleKey: "seo.guide_theme.og_title",
  ogDescriptionKey: "seo.guide_theme.og_description",
});

const lightExample = JSON.stringify({
  background: "#F8FFF8",
  foreground: "#2C3E2C",
  surface: "#F0FFF0",
  surfaceMuted: "#F5FDF5",
  border: "#D8E8D8",
  muted: "#6C7E6C",
  primary: {
    "50": "#E8F5E9",
    "100": "#C8E6C9",
    "200": "#A5D6A7",
    "300": "#81C784",
    "400": "#66BB6A",
    "500": "#4CAF50",
    "600": "#43A047",
    "700": "#388E3C",
    "800": "#2E7D32",
    "900": "#1B5E20",
    "950": "#0F3D12",
  },
  secondary: {
    "500": "#AAAAAA",
    "600": "#999999",
    "700": "#777777",
  },
  accent: {
    "500": "#FFEB3B",
    "600": "#FDD835",
    "700": "#FBC02D",
  },
}, null, 2);

const darkExample = JSON.stringify({
  background: "#101410",
  foreground: "#E0E0E0",
  surface: "#1E221E",
  surfaceMuted: "#161816",
  border: "#333633",
  muted: "#A0A0A0",
  primary: {
    "500": "#4A9B6B",
    "600": "#3F855C",
    "700": "#346F4D",
  },
}, null, 2);

type FieldKey = "background" | "foreground" | "surface" | "surfaceMuted" | "border" | "muted" | "primary" | "secondary" | "accent" | "vars";

const fieldDefs: { key: FieldKey; required: boolean }[] = [
  { key: "background", required: true },
  { key: "foreground", required: true },
  { key: "surface", required: true },
  { key: "surfaceMuted", required: false },
  { key: "border", required: true },
  { key: "muted", required: true },
  { key: "primary", required: true },
  { key: "secondary", required: false },
  { key: "accent", required: false },
  { key: "vars", required: false },
];

const fieldExamples: Record<FieldKey, string> = {
  background: "#F8FFF8 / #101410",
  foreground: "#2C3E2C / #E0E0E0",
  surface: "#F0FFF0 / #1E221E",
  surfaceMuted: "#F5FDF5 / #161816",
  border: "#D8E8D8 / #333633",
  muted: "#6C7E6C / #A0A0A0",
  primary: "{ \"500\": \"#4CAF50\", \"600\": \"#43A047\", \"700\": \"#388E3C\" }",
  secondary: "{ \"500\": \"#AAA\", ... }",
  accent: "{ \"500\": \"#FFEB3B\", ... }",
  vars: "{ \"custom-radius\": \"8px\" }",
};

const fields = computed(() =>
  fieldDefs.map(({ key, required }) => ({
    name: key,
    required,
    desc: t(`guide_theme.fields.${key}.desc`),
    example: fieldExamples[key],
  })));

const compactSample = "{\n  \"primary\": {\n    \"500\": \"#4CAF50\",\n    \"600\": \"#43A047\",\n    \"700\": \"#388E3C\"\n  }\n}";

const fullScaleSample = "{\n  \"primary\": {\n    \"50\":  \"#E8F5E9\",\n    \"100\": \"#C8E6C9\",\n    ...\n    \"500\": \"#4CAF50\",\n    ...\n    \"950\": \"#0F3D12\"\n  }\n}";

const varsSample = "{\n  \"background\": \"#101010\",\n  \"foreground\": \"#E0E0E0\",\n  ...\n  \"vars\": {\n    \"radius-card\": \"16px\",\n    \"shadow-card\": \"0 2px 12px rgba(0,0,0,0.4)\"\n  }\n}";
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 prose-responsive">
    <div class="mb-8 sm:mb-10">
      <div class="flex flex-wrap items-center gap-2 text-sm text-muted mb-3">
        <NuxtLink :to="localePath('/themes')" class="hover:text-foreground transition-colors">
          {{ t("guide_theme.crumb_themes") }}
        </NuxtLink>
        <span aria-hidden="true">/</span>
        <span class="text-foreground">{{ t("guide_theme.crumb_current") }}</span>
      </div>
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">{{ t("guide_theme.h1") }}</h1>
      <p class="text-muted text-base sm:text-lg leading-relaxed">{{ t("guide_theme.intro") }}</p>
    </div>

    <section class="mb-8 sm:mb-10">
      <h2 class="text-xl sm:text-2xl font-bold text-foreground mb-4">{{ t("guide_theme.quick_title") }}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="p-4 rounded-2xl border border-border bg-surface">
          <h3 class="font-semibold text-foreground mb-1 flex flex-nowrap items-baseline gap-2">
            <span class="text-2xl leading-none shrink-0 font-normal tabular-nums" aria-hidden="true">①</span>
            <span class="truncate">{{ t("guide_theme.quick_1_title") }}</span>
          </h3>
          <p class="text-muted text-sm mt-2">
            {{ t("guide_theme.quick_1_intro") }}
            <code class="bg-surface-muted px-1 rounded text-xs mx-0.5">light</code>
            {{ t("guide_theme.quick_1_mid") }}
            <code class="bg-surface-muted px-1 rounded text-xs mx-0.5">dark</code>
            {{ t("guide_theme.quick_1_out") }}
          </p>
        </div>
        <div class="p-4 rounded-2xl border border-border bg-surface">
          <h3 class="font-semibold text-foreground mb-1 flex flex-nowrap items-baseline gap-2">
            <span class="text-2xl leading-none shrink-0 font-normal tabular-nums" aria-hidden="true">②</span>
            <span class="truncate">{{ t("guide_theme.quick_2_title") }}</span>
          </h3>
          <p class="text-muted text-sm mt-2">{{ t("guide_theme.quick_2_body") }}</p>
        </div>
        <div class="p-4 rounded-2xl border border-border bg-surface">
          <h3 class="font-semibold text-foreground mb-1 flex flex-nowrap items-baseline gap-2">
            <span class="text-2xl leading-none shrink-0 font-normal tabular-nums" aria-hidden="true">③</span>
            <span class="truncate">{{ t("guide_theme.quick_3_title") }}</span>
          </h3>
          <p class="text-muted text-sm mt-2">
            {{ t("guide_theme.quick_3_before") }}
            <NuxtLink :to="localePath('/themes')" class="text-primary-500 hover:underline">{{ t("themes.title") }}</NuxtLink>
            {{ t("guide_theme.quick_3_after") }}
          </p>
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-xl sm:text-2xl font-bold text-foreground mb-2">{{ t("guide_theme.fields_heading") }}</h2>
      <p class="text-muted text-sm mb-5">
        {{ t("guide_theme.fields_intro") }}
      </p>

      <div class="space-y-3">
        <div
          v-for="f in fields"
          :key="f.name"
          class="p-4 rounded-xl border bg-surface"
          :class="f.required ? 'border-border' : 'border-border/60'"
        >
          <div class="flex items-start gap-3">
            <div class="shrink-0 mt-0.5">
              <code class="text-sm font-mono font-bold text-foreground">{{ f.name }}</code>
              <span
                v-if="f.required"
                class="ml-2 text-xs px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-600 font-medium"
              >{{ t("guide_theme.badge_required") }}</span>
              <span
                v-else
                class="ml-2 text-xs px-1.5 py-0.5 rounded bg-surface-muted text-muted"
              >{{ t("guide_theme.badge_optional") }}</span>
            </div>
          </div>
          <p class="text-muted text-sm mt-2 leading-relaxed">{{ f.desc }}</p>
          <p class="text-xs font-mono bg-surface-muted text-foreground/70 mt-2 px-3 py-1.5 rounded-lg">
            {{ t("guide_theme.example_prefix") }} {{ f.example }}
          </p>
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">{{ t("guide_theme.scale_heading") }}</h2>
      <p class="text-muted text-sm leading-relaxed mb-4">
        {{ t("guide_theme.scale_intro_sentence") }}
      </p>
      <div class="grid sm:grid-cols-2 gap-4 mb-4">
        <div class="p-4 rounded-xl border border-border bg-surface">
          <p class="text-sm font-semibold text-foreground mb-2">{{ t("guide_theme.scale_compact_title") }}</p>
          <pre class="text-xs font-mono text-foreground/80 bg-surface-muted rounded-lg p-3 overflow-x-auto">{{ compactSample }}</pre>
          <p class="text-xs text-muted mt-2">{{ t("guide_theme.scale_compact_note") }}</p>
        </div>
        <div class="p-4 rounded-xl border border-border bg-surface">
          <p class="text-sm font-semibold text-foreground mb-2">{{ t("guide_theme.scale_full_title") }}</p>
          <pre class="text-xs font-mono text-foreground/80 bg-surface-muted rounded-lg p-3 overflow-x-auto">{{ fullScaleSample }}</pre>
          <p class="text-xs text-muted mt-2">{{ t("guide_theme.scale_full_note") }}</p>
        </div>
      </div>
      <div class="p-3 rounded-xl bg-primary-500/5 border border-primary-500/20 text-sm text-muted">
        <span aria-hidden="true">💡 </span>
        <strong class="text-foreground">{{ t("guide_theme.scale_tip_label") }}</strong>
        {{ t("guide_theme.scale_tip_body") }}
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">{{ t("guide_theme.samples_heading") }}</h2>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <p class="text-sm font-semibold text-foreground mb-2">{{ t("guide_theme.sample_light_cap") }}</p>
          <pre class="text-xs font-mono text-foreground/80 bg-surface-muted border border-border rounded-xl p-4 overflow-x-auto max-h-80 overflow-y-auto">{{ lightExample }}</pre>
        </div>
        <div>
          <p class="text-sm font-semibold text-foreground mb-2">{{ t("guide_theme.sample_dark_cap") }}</p>
          <pre class="text-xs font-mono text-foreground/80 bg-surface-muted border border-border rounded-xl p-4 overflow-x-auto max-h-80 overflow-y-auto">{{ darkExample }}</pre>
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">{{ t("guide_theme.vars_heading") }}</h2>
      <p class="text-muted text-sm leading-relaxed mb-4">
        {{ t("guide_theme.vars_body_before") }}
        <code class="bg-surface-muted px-1 rounded text-xs">vars</code>
        {{ t("guide_theme.vars_body_mid") }}
        <code class="bg-surface-muted px-1 rounded text-xs">--</code>
        {{ t("guide_theme.vars_body_after") }}
      </p>
      <pre class="text-xs font-mono text-foreground/80 bg-surface-muted border border-border rounded-xl p-4 overflow-x-auto">{{ varsSample }}</pre>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">{{ t("guide_theme.naming_heading") }}</h2>
      <ul class="list-disc list-inside text-muted text-sm space-y-1.5 mb-4">
        <li>
          {{ t("guide_theme.name_rule_1") }}
          <code class="bg-surface-muted px-1 rounded text-foreground text-xs">a-z 0-9 -</code>
          {{ t("guide_theme.name_rule_1_tail") }}
        </li>
        <li>{{ t("guide_theme.name_rule_fmt") }}</li>
        <li>{{ t("guide_theme.name_rule_3") }}</li>
        <li>{{ t("guide_theme.name_rule_4") }}</li>
      </ul>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">{{ t("guide_theme.review_heading") }}</h2>
      <div class="p-5 rounded-2xl border border-border bg-surface space-y-3 text-sm text-muted">
        <p>{{ t("guide_theme.review_1") }}</p>
        <p>{{ t("guide_theme.review_2") }}</p>
        <p>{{ t("guide_theme.review_3") }}</p>
        <p>{{ t("guide_theme.review_4") }}</p>
        <p>{{ t("guide_theme.review_5") }}</p>
      </div>
    </section>

    <div class="text-center py-8">
      <p class="text-muted mb-4">{{ t("guide_theme.cta_intro") }}</p>
      <NuxtLink
        :to="localePath('/themes')"
        class="inline-block px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors"
      >
        {{ t("guide_theme.cta_btn") }}
      </NuxtLink>
    </div>
  </div>
</template>
