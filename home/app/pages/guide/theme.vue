<script setup lang="ts">
definePageMeta({ layout: "default" });
useHead({
  title: "主题创作指南 — ForcedSkin",
  meta: [
    { name: "description", content: "了解如何为 ForcedSkin 编写自定义主题：颜色字段规范、JSON 结构、色阶定义与提交流程。" },
    { property: "og:title", content: "主题创作指南 — ForcedSkin" },
    { property: "og:url", content: "https://forcedskin.com/guide/theme" },
  ],
  link: [{ rel: "canonical", href: "https://forcedskin.com/guide/theme" }],
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
    "950": "#0F3D12"
  },
  secondary: {
    "500": "#AAAAAA",
    "600": "#999999",
    "700": "#777777"
  },
  accent: {
    "500": "#FFEB3B",
    "600": "#FDD835",
    "700": "#FBC02D"
  }
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
    "700": "#346F4D"
  }
}, null, 2);

const fields = [
  { name: "background", required: true, desc: "页面主背景色。亮色主题通常接近白色，暗色主题通常接近深色。CSS 变量：--color-background", example: "#F8FFF8 / #101410" },
  { name: "foreground", required: true, desc: "主文字颜色，与 background 形成高对比度。CSS 变量：--color-foreground", example: "#2C3E2C / #E0E0E0" },
  { name: "surface", required: true, desc: "卡片、面板等容器背景色，略深/浅于 background。CSS 变量：--color-surface", example: "#F0FFF0 / #1E221E" },
  { name: "surfaceMuted", required: false, desc: "悬浮状态、次级容器背景，比 surface 更深/浅一档。CSS 变量：--color-surface-muted", example: "#F5FDF5 / #161816" },
  { name: "border", required: true, desc: "边框、分割线颜色，通常为半透明或低饱和的灰色调。CSS 变量：--color-border", example: "#D8E8D8 / #333633" },
  { name: "muted", required: true, desc: "次要文字、占位符等降调文本颜色。CSS 变量：--color-muted", example: "#6C7E6C / #A0A0A0" },
  { name: "primary", required: true, desc: "主色调，用于按钮、链接、强调色。可以是单个色值字符串，也可以是包含色阶（50-950）的对象，引擎会自动映射 --color-primary-{shade}。至少需要 500/600/700 三档。", example: "{ \"500\": \"#4CAF50\", \"600\": \"#43A047\", \"700\": \"#388E3C\" }" },
  { name: "secondary", required: false, desc: "次色调，用于辅助按钮、标签等。结构同 primary，可省略。CSS 变量：--color-secondary-{shade}", example: "{ \"500\": \"#AAA\", ... }" },
  { name: "accent", required: false, desc: "强调色，用于高亮、徽标等。结构同 primary，可省略。CSS 变量：--color-accent-{shade}", example: "{ \"500\": \"#FFEB3B\", ... }" },
  { name: "vars", required: false, desc: "自定义额外 CSS 变量，key 为变量名（不含 --），value 为值。这些变量会原样注入到 :root 中。", example: "{ \"custom-radius\": \"8px\" }" },
];
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-12">
    <!-- 标题区 -->
    <div class="mb-10">
      <div class="flex items-center gap-2 text-sm text-muted mb-3">
        <NuxtLink to="/themes" class="hover:text-foreground transition-colors">主题市场</NuxtLink>
        <span>/</span>
        <span class="text-foreground">创作指南</span>
      </div>
      <h1 class="text-4xl font-bold text-foreground mb-3">🎨 主题创作指南</h1>
      <p class="text-muted text-lg leading-relaxed">
        了解 ForcedSkin 主题的 JSON 结构与颜色字段规范，为任何网站设计你专属的配色方案，
        并提交给社区共享。
      </p>
    </div>

    <!-- 快速开始 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-4">快速开始</h2>
      <div class="grid sm:grid-cols-3 gap-4 mb-6">
        <div class="p-4 rounded-2xl border border-border bg-surface">
          <div class="text-2xl mb-2">①</div>
          <h3 class="font-semibold text-foreground mb-1">选择模式</h3>
          <p class="text-muted text-sm">决定你的主题是 <code class="bg-surface-muted px-1 rounded text-xs">light</code>（亮色）还是 <code class="bg-surface-muted px-1 rounded text-xs">dark</code>（暗色）。</p>
        </div>
        <div class="p-4 rounded-2xl border border-border bg-surface">
          <div class="text-2xl mb-2">②</div>
          <h3 class="font-semibold text-foreground mb-1">填写颜色</h3>
          <p class="text-muted text-sm">按照下方字段规范填写 JSON，至少需要 6 个必填字段。</p>
        </div>
        <div class="p-4 rounded-2xl border border-border bg-surface">
          <div class="text-2xl mb-2">③</div>
          <h3 class="font-semibold text-foreground mb-1">提交审核</h3>
          <p class="text-muted text-sm">在<NuxtLink to="/themes" class="text-primary-500 hover:underline">主题市场</NuxtLink>点击「提交主题」，等待管理员审核后上线。</p>
        </div>
      </div>
    </section>

    <!-- 字段规范 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-2">颜色字段规范</h2>
      <p class="text-muted text-sm mb-5">所有颜色字段均为十六进制色值（如 <code class="bg-surface-muted px-1 rounded">#RRGGBB</code>）或带透明度的 <code class="bg-surface-muted px-1 rounded">rgba()</code> 格式。</p>

      <div class="space-y-3">
        <div v-for="f in fields" :key="f.name"
          class="p-4 rounded-xl border bg-surface"
          :class="f.required ? 'border-border' : 'border-border/60'"
        >
          <div class="flex items-start gap-3">
            <div class="shrink-0 mt-0.5">
              <code class="text-sm font-mono font-bold text-foreground">{{ f.name }}</code>
              <span v-if="f.required" class="ml-2 text-xs px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-600 font-medium">必填</span>
              <span v-else class="ml-2 text-xs px-1.5 py-0.5 rounded bg-surface-muted text-muted">可选</span>
            </div>
          </div>
          <p class="text-muted text-sm mt-2 leading-relaxed">{{ f.desc }}</p>
          <p class="text-xs font-mono bg-surface-muted text-foreground/70 mt-2 px-3 py-1.5 rounded-lg">示例：{{ f.example }}</p>
        </div>
      </div>
    </section>

    <!-- 色阶说明 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">色阶（Color Scale）</h2>
      <p class="text-muted text-sm leading-relaxed mb-4">
        <code class="bg-surface-muted px-1 rounded">primary</code>、<code class="bg-surface-muted px-1 rounded">secondary</code>、<code class="bg-surface-muted px-1 rounded">accent</code>
        三个字段支持两种写法：
      </p>
      <div class="grid sm:grid-cols-2 gap-4 mb-4">
        <div class="p-4 rounded-xl border border-border bg-surface">
          <p class="text-sm font-semibold text-foreground mb-2">简写（仅核心 3 档）</p>
          <pre class="text-xs font-mono text-foreground/80 bg-surface-muted rounded-lg p-3 overflow-x-auto">{{ '{\n  "primary": {\n    "500": "#4CAF50",\n    "600": "#43A047",\n    "700": "#388E3C"\n  }\n}' }}</pre>
          <p class="text-xs text-muted mt-2">引擎会自动使用 500 作为默认色，600/700 作为悬浮/激活态。</p>
        </div>
        <div class="p-4 rounded-xl border border-border bg-surface">
          <p class="text-sm font-semibold text-foreground mb-2">完整色阶（50 ~ 950，共 11 档）</p>
          <pre class="text-xs font-mono text-foreground/80 bg-surface-muted rounded-lg p-3 overflow-x-auto">{{ '{\n  "primary": {\n    "50":  "#E8F5E9",\n    "100": "#C8E6C9",\n    ...\n    "500": "#4CAF50",\n    ...\n    "950": "#0F3D12"\n  }\n}' }}</pre>
          <p class="text-xs text-muted mt-2">推荐提供完整色阶，让各深浅场景下的颜色过渡更自然。</p>
        </div>
      </div>
      <div class="p-3 rounded-xl bg-primary-500/5 border border-primary-500/20 text-sm text-muted">
        💡 <strong class="text-foreground">提示：</strong>色阶编号遵循 Tailwind CSS 规范，50 最浅（近白），950 最深（近黑）。亮色主题通常以 500/600/700 为主用色，暗色主题可以偏向 400/500/600。
      </div>
    </section>

    <!-- 完整示例 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">完整示例</h2>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <p class="text-sm font-semibold text-foreground mb-2">🌿 亮色主题示例（light-mint）</p>
          <pre class="text-xs font-mono text-foreground/80 bg-surface-muted border border-border rounded-xl p-4 overflow-x-auto max-h-80 overflow-y-auto">{{ lightExample }}</pre>
        </div>
        <div>
          <p class="text-sm font-semibold text-foreground mb-2">🌑 暗色主题示例（dark-forest）</p>
          <pre class="text-xs font-mono text-foreground/80 bg-surface-muted border border-border rounded-xl p-4 overflow-x-auto max-h-80 overflow-y-auto">{{ darkExample }}</pre>
        </div>
      </div>
    </section>

    <!-- 自定义 vars -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">自定义变量（vars）</h2>
      <p class="text-muted text-sm leading-relaxed mb-4">
        如果上方的标准字段不足以满足你的需求，可以在 <code class="bg-surface-muted px-1 rounded">vars</code> 对象中声明任意额外的 CSS 变量。
        key 为不含 <code class="bg-surface-muted px-1 rounded">--</code> 前缀的变量名，value 为 CSS 值。
      </p>
      <pre class="text-xs font-mono text-foreground/80 bg-surface-muted border border-border rounded-xl p-4 overflow-x-auto">{{ '{\n  "background": "#101010",\n  "foreground": "#E0E0E0",\n  ...\n  "vars": {\n    "radius-card": "16px",\n    "shadow-card": "0 2px 12px rgba(0,0,0,0.4)"\n  }\n}' }}</pre>
    </section>

    <!-- 标识命名规范 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">标识命名规范（name）</h2>
      <ul class="list-disc list-inside text-muted text-sm space-y-1.5 mb-4">
        <li>只允许小写英文字母、数字和连字符（<code class="bg-surface-muted px-1 rounded text-foreground text-xs">a-z 0-9 -</code>）</li>
        <li>格式推荐：<code class="bg-surface-muted px-1 rounded text-foreground text-xs">{mode}-{style}</code>，如 <code class="bg-surface-muted px-1 rounded text-foreground text-xs">dark-ocean</code>、<code class="bg-surface-muted px-1 rounded text-foreground text-xs">light-sakura</code></li>
        <li>全局唯一，一旦创建无法更改，请仔细选择</li>
        <li>长度 ≤ 50 个字符</li>
      </ul>
    </section>

    <!-- 审核说明 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">提交与审核流程</h2>
      <div class="p-5 rounded-2xl border border-border bg-surface space-y-3 text-sm text-muted">
        <p>🔐 提交前需登录账号。</p>
        <p>⏳ 提交后进入「待审核」状态，管理员会在 1-3 个工作日内完成审核。</p>
        <p>✅ 审核通过后，主题将在主题市场对所有用户可见，并可被收藏和使用。</p>
        <p>❌ 若主题不符合规范（颜色值无效、名称冲突、内容违规等），审核将被拒绝并删除，请重新提交修正后的版本。</p>
        <p>🚫 严禁提交包含恶意代码、歧视性内容或侵权配色的主题。</p>
      </div>
    </section>

    <!-- CTA -->
    <div class="text-center py-8">
      <p class="text-muted mb-4">准备好了？去主题市场提交你的作品吧！</p>
      <NuxtLink to="/themes"
        class="inline-block px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors">
        🎨 前往提交主题
      </NuxtLink>
    </div>
  </div>
</template>
