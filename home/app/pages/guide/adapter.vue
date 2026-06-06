<script setup lang="ts">
definePageMeta({ layout: "default" });
const localePath = useLocalePath();
const { t } = useI18n();

useForcedSkinSeo("/guide/adapter", {
  titleKey: "seo.guide_adapter.title",
  descriptionKey: "seo.guide_adapter.description",
  ogTitleKey: "seo.guide_adapter.og_title",
  ogDescriptionKey: "seo.guide_adapter.og_description",
});

const minimalExample = `{
  "schema": "forcedskin-adapter-formula/v1",
  "id": "example-site",
  "priority": 100,
  "match": {
    "hostname": [
      { "op": "suffixDomain", "value": "example.com" }
    ]
  },
  "layers": [
    {
      "kind": "surface",
      "skipOverlayLike": true,
      "selectors": [".site-navbar", ".site-header"]
    }
  ]
}`;

const fullExample = `{
  "schema": "forcedskin-adapter-formula/v1",
  "id": "bilibili",
  "priority": 100,
  "match": {
    "hostname": [
      { "op": "equals", "value": "bilibili.com" },
      { "op": "suffixDomain", "value": "bilibili.com" }
    ]
  },
  "layers": [
    {
      "kind": "surface",
      "skipOverlayLike": true,
      "selectors": ["[class*='bili-']", "[class*='bpx-']"]
    },
    {
      "kind": "accent",
      "selectors": ["[class*='active']", ".bili-dyn-list-tabs__item.active"]
    },
    {
      "kind": "canvas",
      "selectors": [".message-bg", ".message-bgc"]
    },
    {
      "kind": "richText",
      "selectors": ["bili-rich-text"],
      "cssVars": {
        "--bili-rich-text-color": "foreground",
        "--bili-rich-text-link-color": "primary500",
        "--bili-rich-text-link-color-hover": "primary700"
      },
      "color": "foreground"
    },
    {
      "kind": "svgRecolor",
      "selectors": ["svg path", "svg rect", "svg circle"]
    }
  ]
}`;

const hostnameSnippet = `[
  { "op": "equals", "value": "bilibili.com" },
  { "op": "suffixDomain", "value": "bilibili.com" }
]`;

const formulaRows = computed(() => [
  { field: "schema", typ: "string", req: true, desc: t("guide_adapter.formula.schema_desc") },
  { field: "id", typ: "string", req: true, desc: t("guide_adapter.formula.id_desc") },
  { field: "priority", typ: "number", req: false, desc: t("guide_adapter.formula.priority_desc") },
  { field: "match.hostname", typ: "Rule[]", req: true, desc: t("guide_adapter.formula.match_desc") },
  { field: "layers", typ: "Layer[]", req: true, desc: t("guide_adapter.formula.layers_desc") },
]);

const hostnameRuleRows = computed(() => [
  { op: "equals", desc: t("guide_adapter.host.equals_desc") },
  { op: "suffixDomain", desc: t("guide_adapter.host.suffix_desc") },
]);

const PALETTE_KEYS = [
  "background",
  "foreground",
  "surface",
  "surfaceMuted",
  "border",
  "muted",
  "primary500",
  "primary700",
] as const;

const paletteFields = computed(() =>
  PALETTE_KEYS.map((name) => ({
    name,
    desc: t(`guide_adapter.palette.${name}`),
  })));

type LayerKind = "surface" | "accent" | "canvas" | "richText" | "svgRecolor";
const LAYER_KINDS: LayerKind[] = ["surface", "accent", "canvas", "richText", "svgRecolor"];

const layerRows = computed(() =>
  LAYER_KINDS.map((kind) => ({
    kind,
    use: t(`guide_adapter.layer.${kind}_use`),
    map: t(`guide_adapter.layer.${kind}_map`),
    mark: t(`guide_adapter.layer.${kind}_mark`),
  })));
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 prose-responsive">
    <div class="mb-8 sm:mb-10">
      <div class="flex flex-wrap items-center gap-2 text-sm text-muted mb-3">
        <NuxtLink :to="localePath('/adapters')" class="hover:text-foreground transition-colors">{{
          t("guide_adapter.crumb_adapters")
        }}</NuxtLink>
        <span aria-hidden="true">/</span>
        <span class="text-foreground">{{ t("guide_adapter.crumb_current") }}</span>
      </div>
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">{{ t("guide_adapter.h1") }}</h1>
      <p class="text-muted text-base sm:text-lg leading-relaxed">
        {{ t("guide_adapter.lead_1") }}
        <strong class="text-foreground">{{ t("guide_adapter.lead_2") }}</strong>
        {{ t("guide_adapter.lead_3") }}
        <code class="bg-surface-muted px-1 rounded text-xs text-foreground">{{ "forcedskin-adapter-formula/v1" }}</code>
        {{ t("guide_adapter.lead_4") }}
        <strong class="text-foreground">{{ t("guide_adapter.lead_5") }}</strong>
        {{ t("guide_adapter.lead_6") }}
      </p>
    </div>

    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">{{ t("guide_adapter.how_title") }}</h2>
      <div class="p-5 rounded-2xl border border-border bg-surface text-sm text-muted leading-relaxed space-y-2">
        <p class="flex flex-nowrap gap-2"><span class="shrink-0" aria-hidden="true">①</span><span class="min-w-0">{{ t("guide_adapter.how_s1") }}</span></p>
        <p class="flex flex-nowrap gap-2"><span class="shrink-0" aria-hidden="true">②</span><span class="min-w-0">{{ t("guide_adapter.how_s2") }}</span></p>
        <p class="flex flex-nowrap gap-2"><span class="shrink-0" aria-hidden="true">③</span><span class="min-w-0">{{ t("guide_adapter.how_s3") }}</span></p>
        <p class="flex flex-nowrap gap-2"><span class="shrink-0" aria-hidden="true">④</span><span class="min-w-0">{{ t("guide_adapter.how_s4") }}</span></p>
        <p class="flex flex-nowrap gap-2"><span class="shrink-0" aria-hidden="true">⑤</span><span class="min-w-0 break-words">
          {{ t("guide_adapter.how_s5_prefix") }}
          <code class="bg-surface-muted px-1 rounded text-xs text-foreground whitespace-nowrap">{{ t("guide_adapter.how_s5_api") }}</code>
          {{ t("guide_adapter.how_s5_suffix") }}
        </span></p>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-4">{{ t("guide_adapter.minimal_title") }}</h2>
      <pre class="text-xs font-mono text-foreground/85 bg-surface-muted border border-border rounded-xl p-4 overflow-x-auto">{{ minimalExample }}</pre>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">{{ t("guide_adapter.formula_title") }}</h2>
      <p class="text-muted text-sm mb-4">{{ t("guide_adapter.formula_intro") }}</p>
      <div class="scroll-x-touch mb-6">
        <table class="w-full min-w-[36rem] text-sm border-collapse">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-3 py-2 rounded-tl-lg border border-border text-foreground font-semibold">{{ t("guide_adapter.th_field") }}</th>
              <th class="px-3 py-2 border border-border text-foreground font-semibold">{{ t("guide_adapter.th_type") }}</th>
              <th class="px-3 py-2 border border-border text-foreground font-semibold">{{ t("guide_adapter.th_required") }}</th>
              <th class="px-3 py-2 rounded-tr-lg border border-border text-foreground font-semibold">{{ t("guide_adapter.th_desc") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in formulaRows"
              :key="row.field"
              class="border-b border-border hover:bg-surface-muted/50 transition-colors last:border-b-0"
            >
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">{{ row.field }}</td>
              <td class="px-3 py-2 border border-border text-muted font-mono text-xs">{{ row.typ }}</td>
              <td class="px-3 py-2 border border-border text-muted text-xs">{{ row.req ? t("guide_adapter.req_yes") : t("guide_adapter.req_no") }}</td>
              <td class="px-3 py-2 border border-border text-muted text-xs">{{ row.desc }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-lg font-semibold text-foreground mb-3">{{ t("guide_adapter.hostname_title") }}</h3>
      <div class="scroll-x-touch mb-6">
        <table class="w-full min-w-[36rem] text-sm border-collapse">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-3 py-2 rounded-tl-lg border border-border text-foreground font-semibold">{{ t("guide_adapter.th_op") }}</th>
              <th class="px-3 py-2 rounded-tr-lg border border-border text-foreground font-semibold">{{ t("guide_adapter.th_meaning") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in hostnameRuleRows"
              :key="row.op"
              class="border-b border-border hover:bg-surface-muted/50 transition-colors last:border-b-0"
            >
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">{{ row.op }}</td>
              <td class="px-3 py-2 border border-border text-muted text-xs">{{ row.desc }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-lg font-semibold text-foreground mb-3">{{ t("guide_adapter.palette_title") }}</h3>
      <div class="scroll-x-touch">
        <table class="w-full min-w-[24rem] text-sm border-collapse">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-3 py-2 rounded-tl-lg border border-border text-foreground font-semibold">{{ t("guide_adapter.th_field") }}</th>
              <th class="px-3 py-2 rounded-tr-lg border border-border text-foreground font-semibold">{{ t("guide_adapter.th_desc") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="f in paletteFields"
              :key="f.name"
              class="border-b border-border hover:bg-surface-muted/50 transition-colors last:border-b-0"
            >
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">{{ f.name }}</td>
              <td class="px-3 py-2 border border-border text-muted text-xs">{{ f.desc }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">{{ t("guide_adapter.layer_title") }}</h2>
      <p class="text-muted text-sm mb-4">
        {{ t("guide_adapter.layer_intro") }}
        <code class="bg-surface-muted px-1 rounded text-xs text-foreground">home/server/seeds/bilibili-adapter.formula.json</code>
        {{ t("guide_adapter.layer_intro_after") }}
      </p>
      <div class="scroll-x-touch mb-4">
        <table class="w-full min-w-[40rem] text-sm border-collapse">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-3 py-2 border border-border text-foreground font-semibold">{{ t("guide_adapter.th_kind") }}</th>
              <th class="px-3 py-2 border border-border text-foreground font-semibold">{{ t("guide_adapter.th_use") }}</th>
              <th class="px-3 py-2 border border-border text-foreground font-semibold">{{ t("guide_adapter.th_style_map") }}</th>
              <th class="px-3 py-2 border border-border text-foreground font-semibold">{{ t("guide_adapter.th_mark") }}</th>
            </tr>
          </thead>
          <tbody class="text-muted">
            <tr v-for="row in layerRows" :key="row.kind" class="border-b border-border last:border-b-0">
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">{{ row.kind }}</td>
              <td class="px-3 py-2 border border-border text-xs">{{ row.use }}</td>
              <td class="px-3 py-2 border border-border text-xs">{{ row.map }}</td>
              <td class="px-3 py-2 border border-border text-xs">{{ row.mark }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4 rounded-xl border border-border bg-surface text-xs text-muted space-y-2">
        <p>
          <strong class="text-foreground">{{ t("guide_adapter.note_avoid_title") }}</strong>
          {{ t("guide_adapter.note_avoid_body") }}
        </p>
        <p>
          <strong class="text-foreground">{{ t("guide_adapter.note_iso_title") }}</strong>
          {{ t("guide_adapter.note_iso_before") }}
          <code class="bg-surface-muted px-1 rounded text-foreground">data-gts-ignore</code>
          {{ t("guide_adapter.note_iso_after") }}
        </p>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">{{ t("guide_adapter.sample_title") }}</h2>
      <pre class="text-xs font-mono text-foreground/85 bg-surface-muted border border-border rounded-xl p-4 overflow-x-auto max-h-96 overflow-y-auto">{{ fullExample }}</pre>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">{{ t("guide_adapter.bp_title") }}</h2>
      <div class="space-y-3">
        <div class="flex gap-3 p-4 rounded-xl border border-border bg-surface">
          <span class="text-lg shrink-0" aria-hidden="true">✅</span>
          <div>
            <p class="text-sm font-semibold text-foreground">{{ t("guide_adapter.bp_ok_json_title") }}</p>
            <p class="text-xs text-muted mt-0.5">{{ t("guide_adapter.bp_ok_json_body") }}</p>
          </div>
        </div>
        <div class="flex gap-3 p-4 rounded-xl border border-border bg-surface">
          <span class="text-lg shrink-0" aria-hidden="true">✅</span>
          <div>
            <p class="text-sm font-semibold text-foreground">{{ t("guide_adapter.bp_skip_title") }}</p>
            <p class="text-xs text-muted mt-0.5">{{ t("guide_adapter.bp_skip_body") }}</p>
          </div>
        </div>
        <div class="flex gap-3 p-4 rounded-xl border border-border bg-surface">
          <span class="text-lg shrink-0" aria-hidden="true">🚫</span>
          <div>
            <p class="text-sm font-semibold text-foreground">{{ t("guide_adapter.bp_nojs_title") }}</p>
            <p class="text-xs text-muted mt-0.5">{{ t("guide_adapter.bp_nojs_body") }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">{{ t("guide_adapter.submit_title") }}</h2>
      <div class="p-5 rounded-2xl border border-border bg-surface space-y-3 text-sm text-muted">
        <p>{{ t("guide_adapter.submit_1") }}</p>
        <p>{{ t("guide_adapter.submit_2") }}</p>
        <p>{{ t("guide_adapter.submit_3") }}</p>
        <p>{{ t("guide_adapter.submit_4") }}</p>
        <p>{{ t("guide_adapter.submit_5") }}</p>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">{{ t("guide_adapter.domain_title") }}</h2>
      <p class="text-muted text-sm mb-3">{{ t("guide_adapter.domain_intro") }}</p>
      <pre class="text-xs font-mono text-foreground/85 bg-surface-muted border border-border rounded-xl p-4">{{ hostnameSnippet }}</pre>
    </section>

    <div class="text-center py-8">
      <p class="text-muted mb-4">{{ t("guide_adapter.cta_intro") }}</p>
      <NuxtLink
        :to="localePath('/adapters')"
        class="inline-block px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors"
      >
        {{ t("guide_adapter.cta_btn") }}
      </NuxtLink>
    </div>
  </div>
</template>
