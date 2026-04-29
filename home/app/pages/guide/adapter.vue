<script setup lang="ts">
definePageMeta({ layout: "default" });
useHead({
  title: "适配器开发指南 — ForcedSkin",
  meta: [
    { name: "description", content: "了解如何为 ForcedSkin 编写网站适配器：API 规范、Selector 精细覆盖、engineApi 接口文档与提交流程。" },
    { property: "og:title", content: "适配器开发指南 — ForcedSkin" },
    { property: "og:url", content: "https://forcedskin.com/guide/adapter" },
  ],
  link: [{ rel: "canonical", href: "https://forcedskin.com/guide/adapter" }],
});

const minimalExample = `(() => {
  const engineApi = window.__GTS_ENGINE__;
  if (!engineApi) return;

  const myAdapter = {
    id: "example-site",
    priority: 100,
    match: (hostname) => hostname === "example.com" || hostname.endsWith(".example.com"),
    apply: ({ queryAllDeep, palette, markApplied }) => {
      // 精细覆盖特定组件的背景色
      const navEls = queryAllDeep(".site-navbar, .site-header");
      navEls.forEach((el) => {
        el.style.setProperty("background-color", palette.surface, "important");
        markApplied(el, "bg");
      });
    },
  };

  engineApi.registerAdapter(myAdapter);
})();`;

const fullExample = `(() => {
  const engineApi = window.__GTS_ENGINE__;
  if (!engineApi) return;

  const adapter = {
    id: "bilibili",
    priority: 100,

    // match：返回 true 表示此页面需要该适配器
    match: (hostname) =>
      hostname === "bilibili.com" || hostname.endsWith(".bilibili.com"),

    // apply：在引擎应用主题颜色后调用，用于精细覆盖
    apply: ({ queryAllDeep, palette, markApplied, onDomChange }) => {
      function applyOverrides() {
        // 覆盖导航栏背景
        queryAllDeep(".bili-header__bar").forEach((el) => {
          el.style.setProperty("background-color", palette.surface, "important");
          markApplied(el, "bg-nav");
        });

        // 覆盖视频播放器背景（跳过，避免破坏播放器）
        // queryAllDeep(".bpx-player-container") → 通常不需要覆盖

        // 覆盖评论区背景
        queryAllDeep(".reply-list").forEach((el) => {
          el.style.setProperty("background-color", palette.surface, "important");
          el.style.setProperty("color", palette.foreground, "important");
          markApplied(el, "bg-reply");
        });
      }

      applyOverrides();

      // 监听 DOM 变化（SPA 路由切换后重新覆盖）
      onDomChange(() => { applyOverrides(); });
    },
  };

  engineApi.registerAdapter(adapter);
})();`;

const paletteFields = [
  { name: "background", desc: "页面主背景色" },
  { name: "foreground", desc: "主文字颜色" },
  { name: "surface", desc: "卡片/面板背景" },
  { name: "surfaceMuted", desc: "次级容器/悬浮背景" },
  { name: "border", desc: "边框颜色" },
  { name: "muted", desc: "次要文字颜色" },
  { name: "primary", desc: "主色调（500 档色值）" },
  { name: "primaryScale", desc: "完整主色阶对象 { 50, 100, … 950 }" },
];

const apiMethods = [
  { name: "queryAllDeep(selector)", desc: "类似 document.querySelectorAll，但会递归穿透所有 Shadow DOM，返回 Element[]。" },
  { name: "markApplied(el, mark)", desc: "标记元素已被适配器处理，防止引擎重复覆盖（el 必须是 HTMLElement，mark 为自定义字符串标记）。" },
  { name: "onDomChange(callback)", desc: "注册 DOM 变化监听器，在 MutationObserver 触发或 SPA 路由切换时执行 callback，用于重新应用覆盖。" },
  { name: "palette", desc: "当前主题的颜色对象，包含所有 ThemeColors 字段（见上方 palette 字段表）。" },
];
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-12">
    <!-- 标题区 -->
    <div class="mb-10">
      <div class="flex items-center gap-2 text-sm text-muted mb-3">
        <NuxtLink to="/adapters" class="hover:text-foreground transition-colors">适配器</NuxtLink>
        <span>/</span>
        <span class="text-foreground">开发指南</span>
      </div>
      <h1 class="text-4xl font-bold text-foreground mb-3">🔌 适配器开发指南</h1>
      <p class="text-muted text-lg leading-relaxed">
        ForcedSkin 适配器是一段封装好的 JavaScript，用于对特定网站进行精细化覆盖——
        在引擎完成全局主题注入后，针对该网站的特殊组件做精准修正，让换肤效果更自然。
      </p>
    </div>

    <!-- 工作原理 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">工作原理</h2>
      <div class="p-5 rounded-2xl border border-border bg-surface text-sm text-muted leading-relaxed space-y-2">
        <p>① ForcedSkin 主引擎首先对页面进行全局颜色覆盖（基于 CSS 变量 + inline style）。</p>
        <p>② 引擎加载与当前域名匹配的所有已启用适配器，依次按 <code class="bg-surface-muted px-1 rounded text-foreground text-xs">priority</code> 从高到低调用其 <code class="bg-surface-muted px-1 rounded text-foreground text-xs">apply()</code> 方法。</p>
        <p>③ 适配器通过 <code class="bg-surface-muted px-1 rounded text-foreground text-xs">engineApi</code> 提供的方法，精准修正特定元素的样式（跳过视频播放器、广告等不宜覆盖的区域）。</p>
        <p>④ 适配器可以注册 <code class="bg-surface-muted px-1 rounded text-foreground text-xs">onDomChange</code> 回调，在 SPA 路由切换或异步加载内容后重新执行覆盖。</p>
      </div>
    </section>

    <!-- 快速开始 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-4">最小示例</h2>
      <pre class="text-xs font-mono text-foreground/85 bg-surface-muted border border-border rounded-xl p-4 overflow-x-auto">{{ minimalExample }}</pre>
    </section>

    <!-- engineApi 接口 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">engineApi 接口</h2>
      <p class="text-muted text-sm mb-4">通过 <code class="bg-surface-muted px-1 rounded">window.__GTS_ENGINE__</code> 获取引擎 API 对象。适配器代码运行时始终先检查它是否存在。</p>

      <h3 class="text-lg font-semibold text-foreground mb-3">registerAdapter(adapter)</h3>
      <p class="text-muted text-sm mb-4">向引擎注册一个适配器对象，结构如下：</p>
      <div class="overflow-x-auto mb-6">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-3 py-2 rounded-tl-lg border border-border text-foreground font-semibold">字段</th>
              <th class="px-3 py-2 border border-border text-foreground font-semibold">类型</th>
              <th class="px-3 py-2 border border-border text-foreground font-semibold">必填</th>
              <th class="px-3 py-2 rounded-tr-lg border border-border text-foreground font-semibold">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-border hover:bg-surface-muted/50 transition-colors">
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">id</td>
              <td class="px-3 py-2 border border-border text-muted font-mono text-xs">string</td>
              <td class="px-3 py-2 border border-border text-primary-600 text-xs font-medium">必填</td>
              <td class="px-3 py-2 border border-border text-muted text-xs">适配器唯一标识，通常与 DB name 一致，如 <code class="bg-surface-muted rounded px-1">bilibili</code></td>
            </tr>
            <tr class="border-b border-border hover:bg-surface-muted/50 transition-colors">
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">priority</td>
              <td class="px-3 py-2 border border-border text-muted font-mono text-xs">number</td>
              <td class="px-3 py-2 border border-border text-muted text-xs">可选</td>
              <td class="px-3 py-2 border border-border text-muted text-xs">优先级（数值越大越先执行），默认 0，建议社区适配器使用 100</td>
            </tr>
            <tr class="border-b border-border hover:bg-surface-muted/50 transition-colors">
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">match(hostname)</td>
              <td class="px-3 py-2 border border-border text-muted font-mono text-xs">Function → boolean</td>
              <td class="px-3 py-2 border border-border text-primary-600 text-xs font-medium">必填</td>
              <td class="px-3 py-2 border border-border text-muted text-xs">接收当前页面的 hostname，返回 true 表示该适配器适用于此页面</td>
            </tr>
            <tr class="hover:bg-surface-muted/50 transition-colors">
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">apply(ctx)</td>
              <td class="px-3 py-2 border border-border text-muted font-mono text-xs">Function</td>
              <td class="px-3 py-2 border border-border text-primary-600 text-xs font-medium">必填</td>
              <td class="px-3 py-2 border border-border text-muted text-xs">引擎调用的主方法，接收 context 对象（见下方）</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-lg font-semibold text-foreground mb-3">apply(ctx) Context 对象</h3>
      <div class="space-y-2 mb-6">
        <div v-for="m in apiMethods" :key="m.name"
          class="p-3 rounded-xl border border-border bg-surface">
          <code class="text-sm font-mono font-semibold text-foreground">{{ m.name }}</code>
          <p class="text-muted text-xs mt-1 leading-relaxed">{{ m.desc }}</p>
        </div>
      </div>

      <h3 class="text-lg font-semibold text-foreground mb-3">palette 颜色字段</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-3 py-2 rounded-tl-lg border border-border text-foreground font-semibold">字段</th>
              <th class="px-3 py-2 rounded-tr-lg border border-border text-foreground font-semibold">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in paletteFields" :key="f.name"
              class="border-b border-border hover:bg-surface-muted/50 transition-colors last:border-b-0">
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">palette.{{ f.name }}</td>
              <td class="px-3 py-2 border border-border text-muted text-xs">{{ f.desc }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 完整示例 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">完整示例（bilibili 风格）</h2>
      <pre class="text-xs font-mono text-foreground/85 bg-surface-muted border border-border rounded-xl p-4 overflow-x-auto max-h-96 overflow-y-auto">{{ fullExample }}</pre>
    </section>

    <!-- 最佳实践 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">最佳实践 & 注意事项</h2>
      <div class="space-y-3">
        <div class="flex gap-3 p-4 rounded-xl border border-border bg-surface">
          <span class="text-lg shrink-0">✅</span>
          <div>
            <p class="text-sm font-semibold text-foreground">使用 <code class="bg-surface-muted px-1 rounded text-xs">!important</code></p>
            <p class="text-xs text-muted mt-0.5">设置内联样式时，必须加 <code class="bg-surface-muted px-1 rounded">!important</code>，否则会被网站原有样式覆盖。</p>
          </div>
        </div>
        <div class="flex gap-3 p-4 rounded-xl border border-border bg-surface">
          <span class="text-lg shrink-0">✅</span>
          <div>
            <p class="text-sm font-semibold text-foreground">跳过播放器、遮罩层</p>
            <p class="text-xs text-muted mt-0.5">视频播放器（<code class="bg-surface-muted px-1 rounded">.player-*</code>）、全局遮罩、弹窗背板通常不应覆盖，会破坏 UI 功能。</p>
          </div>
        </div>
        <div class="flex gap-3 p-4 rounded-xl border border-border bg-surface">
          <span class="text-lg shrink-0">✅</span>
          <div>
            <p class="text-sm font-semibold text-foreground">使用 <code class="bg-surface-muted px-1 rounded text-xs">markApplied</code></p>
            <p class="text-xs text-muted mt-0.5">对已处理的元素调用 markApplied，告知引擎该元素已被精细适配，避免全局规则重复覆盖产生闪烁。</p>
          </div>
        </div>
        <div class="flex gap-3 p-4 rounded-xl border border-border bg-surface">
          <span class="text-lg shrink-0">✅</span>
          <div>
            <p class="text-sm font-semibold text-foreground">用 IIFE 包裹代码</p>
            <p class="text-xs text-muted mt-0.5">整段代码必须用 <code class="bg-surface-muted px-1 rounded">(() => &#123; ... &#125;)()</code> 包裹，防止变量泄露到全局作用域。</p>
          </div>
        </div>
        <div class="flex gap-3 p-4 rounded-xl border border-border bg-surface">
          <span class="text-lg shrink-0">🚫</span>
          <div>
            <p class="text-sm font-semibold text-foreground">禁止网络请求 & 危险 API</p>
            <p class="text-xs text-muted mt-0.5">适配器代码中禁止调用 <code class="bg-surface-muted px-1 rounded">fetch</code>、<code class="bg-surface-muted px-1 rounded">XMLHttpRequest</code>、<code class="bg-surface-muted px-1 rounded">eval</code>、<code class="bg-surface-muted px-1 rounded">document.cookie</code>、<code class="bg-surface-muted px-1 rounded">localStorage</code> 等，提交后将被拒绝。</p>
          </div>
        </div>
        <div class="flex gap-3 p-4 rounded-xl border border-border bg-surface">
          <span class="text-lg shrink-0">🚫</span>
          <div>
            <p class="text-sm font-semibold text-foreground">禁止操作非样式属性</p>
            <p class="text-xs text-muted mt-0.5">只允许修改元素的 style（颜色/背景相关），禁止修改 innerHTML、src、href、class 列表等内容属性，避免破坏页面功能。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 提交须知 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">提交须知</h2>
      <div class="p-5 rounded-2xl border border-border bg-surface space-y-3 text-sm text-muted">
        <p>🔐 提交前需登录账号。</p>
        <p>📋 提交时需填写：适配器标识（name）、显示名称、目标域名列表（逗号分隔）、适配器 JS 代码。</p>
        <p>⏳ 提交后进入「待审核」状态，管理员会在 1-3 个工作日内完成代码安全审核。</p>
        <p>✅ 审核通过后，适配器将对所有安装了扩展并启用了该适配器的用户生效。</p>
        <p>❌ 若代码包含恶意操作、网络请求或逻辑错误，审核将被拒绝，请根据反馈修正后重新提交。</p>
      </div>
    </section>

    <!-- 域名格式 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">目标域名格式</h2>
      <p class="text-muted text-sm mb-3">支持逗号分隔的多个域名，用于 <code class="bg-surface-muted px-1 rounded">match(hostname)</code> 的匹配逻辑：</p>
      <pre class="text-xs font-mono text-foreground/85 bg-surface-muted border border-border rounded-xl p-4">{{ 'bilibili.com,www.bilibili.com,m.bilibili.com' }}</pre>
      <p class="text-muted text-xs mt-2">在代码中实现对应的 match 逻辑：</p>
      <pre class="text-xs font-mono text-foreground/85 bg-surface-muted border border-border rounded-xl p-4 mt-2">{{ 'match: (hostname) => hostname === "bilibili.com" || hostname.endsWith(".bilibili.com"),' }}</pre>
    </section>

    <!-- CTA -->
    <div class="text-center py-8">
      <p class="text-muted mb-4">准备好了？去适配器页面提交你的适配器！</p>
      <NuxtLink to="/adapters"
        class="inline-block px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors">
        🔌 前往提交适配器
      </NuxtLink>
    </div>
  </div>
</template>
