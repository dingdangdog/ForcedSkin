<script setup lang="ts">
definePageMeta({ layout: "default" });
const localePath = useLocalePath();
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

const formulaSchemaRows = [
  { field: "schema", req: "必填", typ: "string", desc: `固定为 forcedskin-adapter-formula/v1` },
  { field: "id", req: "必填", typ: "string", desc: "适配器逻辑 ID，建议与站点英文名一致，如 bilibili" },
  { field: "priority", req: "可选", typ: "number", desc: "执行顺序：越小越早；站点适配建议 100" },
  { field: "match.hostname", req: "必填", typ: "Rule[]", desc: "hostname 匹配规则数组（见下表）" },
  { field: "layers", req: "必填", typ: "Layer[]", desc: "着色分层列表，kind 含义见下文「着色分层」表" },
];

const hostnameRuleRows = [
  { op: "equals", desc: "hostname 与 value 完全相同（忽略大小写）" },
  { op: "suffixDomain", desc: "hostname === value 或以 .value 为后缀（用于 *.example.com 与 example.com）" },
];

const hostnameSnippet = `[
  { "op": "equals", "value": "bilibili.com" },
  { "op": "suffixDomain", "value": "bilibili.com" }
]`;

const paletteFields = [
  { name: "background", desc: "页面主背景色" },
  { name: "foreground", desc: "主文字颜色" },
  { name: "surface", desc: "卡片/面板背景" },
  { name: "surfaceMuted", desc: "次级容器/悬浮背景" },
  { name: "border", desc: "边框颜色" },
  { name: "muted", desc: "次要文字颜色" },
  { name: "primary500", desc: "主色强调（链接等），由官网主题 JSON 的 primary.500 映射而来" },
  { name: "primary700", desc: "主色更深一档（激活态等），由 primary.700 / 800 映射而来" },
];
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-12">
    <!-- 标题区 -->
    <div class="mb-10">
      <div class="flex items-center gap-2 text-sm text-muted mb-3">
        <NuxtLink :to="localePath('/adapters')" class="hover:text-foreground transition-colors">适配器</NuxtLink>
        <span>/</span>
        <span class="text-foreground">开发指南</span>
      </div>
      <h1 class="text-4xl font-bold text-foreground mb-3">🔌 适配器开发指南</h1>
      <p class="text-muted text-lg leading-relaxed">
        ForcedSkin 适配器使用<strong>声明式 JSON 公式</strong>（<code class="bg-surface-muted px-1 rounded text-xs text-foreground">forcedskin-adapter-formula/v1</code>），
        描述「匹配哪些域名」「按哪些选择器分层着色」。服务端与数据库<strong>只存 JSON</strong>；扩展内置<strong>固定解释器</strong>解析公式并应用样式，不执行任意 JavaScript 源码。
      </p>
    </div>

    <!-- 工作原理 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">工作原理</h2>
      <div class="p-5 rounded-2xl border border-border bg-surface text-sm text-muted leading-relaxed space-y-2">
        <p>① ForcedSkin 主引擎首先对页面进行全局颜色覆盖（基于 CSS 变量 + inline style）。</p>
        <p>② 命中域名后，引擎按每条适配器的 <code class="bg-surface-muted px-1 rounded text-foreground text-xs">priority</code> 数值<strong>升序</strong>执行内置解释器生成的着色步骤（数值<strong>越小越先</strong>；公式里站点适配建议写 <code class="bg-surface-muted px-1 rounded text-xs">100</code>）。</p>
        <p>③ 适配器通过 <code class="bg-surface-muted px-1 rounded text-foreground text-xs">engineApi</code> 提供的方法，精准修正特定元素的样式；播放器容器、半透明遮罩等应由站点逻辑跳过（参见指南「最佳实践」）。</p>
        <p>④ 引擎已对 DOM 变更做增量改写，并在其后节流再次调用适配器；无需在适配器内手写 MutationObserver。</p>
        <p>⑤ <strong>适配器公式由服务端下发：</strong>扩展从 <code class="bg-surface-muted px-1 rounded text-xs text-foreground">GET /api/pub/extension-adapters</code> 拉取每条适配器的 <strong>JSON 公式字符串</strong>（字段 <code class="bg-surface-muted px-1 rounded text-xs">code</code>），缓存后由内置解释器解析；后台或种子更新公式后，用户同步主题或重启浏览器即可生效，无需重装扩展。</p>
      </div>
    </section>

    <!-- 快速开始 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-4">最小示例</h2>
      <pre class="text-xs font-mono text-foreground/85 bg-surface-muted border border-border rounded-xl p-4 overflow-x-auto">{{ minimalExample }}</pre>
    </section>

    <!-- 公式 schema -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">适配器公式 forcedskin-adapter-formula/v1</h2>
      <p class="text-muted text-sm mb-4">
        提交到官网的「适配器代码」字段须为<strong>合法 JSON</strong>，根对象字段如下（服务端会校验）。
      </p>
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
            <tr v-for="row in formulaSchemaRows" :key="row.field"
              class="border-b border-border hover:bg-surface-muted/50 transition-colors last:border-b-0">
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">{{ row.field }}</td>
              <td class="px-3 py-2 border border-border text-muted font-mono text-xs">{{ row.typ }}</td>
              <td class="px-3 py-2 border border-border text-muted text-xs">{{ row.req }}</td>
              <td class="px-3 py-2 border border-border text-muted text-xs">{{ row.desc }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-lg font-semibold text-foreground mb-3">match.hostname 规则</h3>
      <div class="overflow-x-auto mb-6">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-3 py-2 rounded-tl-lg border border-border text-foreground font-semibold">op</th>
              <th class="px-3 py-2 rounded-tr-lg border border-border text-foreground font-semibold">含义</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in hostnameRuleRows" :key="row.op"
              class="border-b border-border hover:bg-surface-muted/50 transition-colors last:border-b-0">
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">{{ row.op }}</td>
              <td class="px-3 py-2 border border-border text-muted text-xs">{{ row.desc }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-lg font-semibold text-foreground mb-3">palette 键名（用于 richText.cssVars / color）</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-3 py-2 rounded-tl-lg border border-border text-foreground font-semibold">键名</th>
              <th class="px-3 py-2 rounded-tr-lg border border-border text-foreground font-semibold">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in paletteFields" :key="f.name"
              class="border-b border-border hover:bg-surface-muted/50 transition-colors last:border-b-0">
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">{{ f.name }}</td>
              <td class="px-3 py-2 border border-border text-muted text-xs">{{ f.desc }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 着色分层公式 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">推荐的「着色分层」公式</h2>
      <p class="text-muted text-sm mb-4">
        不必拘泥于 DIV 标签名；按<strong>语义分层</strong>选用 palette 字段，并用选择器圈定区域。
        内置解释器按公式中的 <code class="bg-surface-muted px-1 rounded text-xs text-foreground">layers[].kind</code> 应用样式（完整范例见仓库 <code class="bg-surface-muted px-1 rounded text-xs">home/server/seeds/bilibili-adapter.formula.json</code>）。
      </p>
      <div class="overflow-x-auto mb-4">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-3 py-2 border border-border text-foreground font-semibold">分层 kind</th>
              <th class="px-3 py-2 border border-border text-foreground font-semibold">用途</th>
              <th class="px-3 py-2 border border-border text-foreground font-semibold">典型样式映射</th>
              <th class="px-3 py-2 border border-border text-foreground font-semibold">markApplied</th>
            </tr>
          </thead>
          <tbody class="text-muted">
            <tr class="border-b border-border">
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">surface</td>
              <td class="px-3 py-2 border border-border text-xs">面板、列表行、导航条容器</td>
              <td class="px-3 py-2 border border-border text-xs">background→surface，color→foreground，border→border</td>
              <td class="px-3 py-2 border border-border text-xs">bg + text + border（三项都打）</td>
            </tr>
            <tr class="border-b border-border">
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">accent</td>
              <td class="px-3 py-2 border border-border text-xs">选中 Tab、当前列表项</td>
              <td class="px-3 py-2 border border-border text-xs">background+border→primary700，color→background（保证对比）</td>
              <td class="px-3 py-2 border border-border text-xs">bg + text + border</td>
            </tr>
            <tr class="border-b border-border">
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">canvas</td>
              <td class="px-3 py-2 border border-border text-xs">带大图背景的整块容器</td>
              <td class="px-3 py-2 border border-border text-xs">去掉 background-image，background→background</td>
              <td class="px-3 py-2 border border-border text-xs">通常仅 bg</td>
            </tr>
            <tr class="border-b border-border">
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">richText</td>
              <td class="px-3 py-2 border border-border text-xs">站内富文本自定义属性</td>
              <td class="px-3 py-2 border border-border text-xs">写入站点要求的 CSS 变量 + color→foreground</td>
              <td class="px-3 py-2 border border-border text-xs">text（或按需加 bg）</td>
            </tr>
            <tr>
              <td class="px-3 py-2 border border-border font-mono text-xs text-foreground">svgRecolor</td>
              <td class="px-3 py-2 border border-border text-xs">矢量图标 path 等</td>
              <td class="px-3 py-2 border border-border text-xs">fill/stroke→currentColor（由父级 color 驱动）</td>
              <td class="px-3 py-2 border border-border text-xs">可不标记（避免干扰引擎清除逻辑）</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4 rounded-xl border border-border bg-surface text-xs text-muted space-y-2">
        <p><strong class="text-foreground">不应着色：</strong>引擎已跳过 IMG / VIDEO / CANVAS / IFRAME、复杂背景图、混合模式、backdrop-filter、以及 class 含 mask/overlay 等的节点；适配器内应对半透明遮罩、播放器叠层做额外 skip。</p>
        <p><strong class="text-foreground">站点隔离：</strong>宿主页面可将预览区等加上 <code class="bg-surface-muted px-1 rounded text-foreground">data-gts-ignore</code>，其子孙不参与全局改写。</p>
      </div>
    </section>

    <!-- 完整示例 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">完整示例（节选）</h2>
      <pre class="text-xs font-mono text-foreground/85 bg-surface-muted border border-border rounded-xl p-4 overflow-x-auto max-h-96 overflow-y-auto">{{ fullExample }}</pre>
    </section>

    <!-- 最佳实践 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">最佳实践 & 注意事项</h2>
      <div class="space-y-3">
        <div class="flex gap-3 p-4 rounded-xl border border-border bg-surface">
          <span class="text-lg shrink-0">✅</span>
          <div>
            <p class="text-sm font-semibold text-foreground">公式须能通过 JSON 校验</p>
            <p class="text-xs text-muted mt-0.5"><code class="bg-surface-muted px-1 rounded">schema</code>、<code class="bg-surface-muted px-1 rounded">layers</code>、<code class="bg-surface-muted px-1 rounded">match.hostname</code> 等字段写错会导致提交被拒；可先对照本文「最小示例」与仓库 seeds。</p>
          </div>
        </div>
        <div class="flex gap-3 p-4 rounded-xl border border-border bg-surface">
          <span class="text-lg shrink-0">✅</span>
          <div>
            <p class="text-sm font-semibold text-foreground">surface 层建议开启 skipOverlayLike</p>
            <p class="text-xs text-muted mt-0.5">与引擎一致，自动跳过半透明遮罩、pointer-events:none 等高风险节点，避免把视频叠层涂实色。</p>
          </div>
        </div>
        <div class="flex gap-3 p-4 rounded-xl border border-border bg-surface">
          <span class="text-lg shrink-0">🚫</span>
          <div>
            <p class="text-sm font-semibold text-foreground">禁止提交 JavaScript 源码</p>
            <p class="text-xs text-muted mt-0.5"><code class="bg-surface-muted px-1 rounded">code</code> 字段必须为 JSON 公式；扩展不再对服务端内容使用 <code class="bg-surface-muted px-1 rounded">new Function</code> 执行任意脚本。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 提交须知 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">提交须知</h2>
      <div class="p-5 rounded-2xl border border-border bg-surface space-y-3 text-sm text-muted">
        <p>🔐 提交前需登录账号。</p>
        <p>📋 提交时需填写：显示名称、目标域名列表（逗号分隔）、以及<strong>适配器公式 JSON</strong>（粘贴到「适配器代码」文本框）。</p>
        <p>⏳ 提交后进入「待审核」状态，管理员会校验公式合法性与安全性。</p>
        <p>✅ 审核通过后，适配器将对所有安装了扩展并启用了该适配器的用户生效。</p>
        <p>❌ 若公式无效、.selector 过于宽泛误伤页面布局，审核将被拒绝，请根据反馈修正 JSON。</p>
      </div>
    </section>

    <!-- 域名格式 -->
    <section class="mb-10">
      <h2 class="text-2xl font-bold text-foreground mb-3">目标域名格式</h2>
      <p class="text-muted text-sm mb-3"><code class="bg-surface-muted px-1 rounded">siteDomain</code> 为人类可读列表；公式里真正生效的是 <code class="bg-surface-muted px-1 rounded">match.hostname</code>，例如：</p>
      <pre class="text-xs font-mono text-foreground/85 bg-surface-muted border border-border rounded-xl p-4">{{ hostnameSnippet }}</pre>
    </section>

    <!-- CTA -->
    <div class="text-center py-8">
      <p class="text-muted mb-4">准备好了？去适配器页面提交你的适配器！</p>
      <NuxtLink :to="localePath('/adapters')"
        class="inline-block px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors">
        🔌 前往提交适配器
      </NuxtLink>
    </div>
  </div>
</template>
