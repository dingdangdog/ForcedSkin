<script setup lang="ts">
definePageMeta({ layout: "default" });

useHead({
  title: "用户协议 — ForcedSkin",
  meta: [
    { name: "description", content: "ForcedSkin 用户服务协议：注册和使用 ForcedSkin 需遵守的条款与条件。" },
    { property: "og:title", content: "用户协议 — ForcedSkin" },
    { property: "og:description", content: "ForcedSkin 用户服务协议：注册和使用 ForcedSkin 需遵守的条款与条件。" },
    { property: "og:url", content: "https://forcedskin.com/terms" },
  ],
  link: [{ rel: "canonical", href: "https://forcedskin.com/terms" }],
});

const effectiveDate = "2026 年 4 月 28 日";
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-16">
    <div class="mb-10">
      <p class="text-primary-500 text-sm font-medium mb-2">法律文件</p>
      <h1 class="text-3xl font-bold text-foreground mb-3">用户服务协议</h1>
      <p class="text-muted text-sm">生效日期：{{ effectiveDate }}｜最近更新：{{ effectiveDate }}</p>
    </div>

    <div class="space-y-8 text-sm">

      <section class="bg-primary-500/5 border border-primary-500/20 rounded-xl p-4">
        <p class="text-foreground leading-relaxed">
          欢迎使用 <strong>ForcedSkin</strong>（forcedskin.com）。请在注册或使用本服务前仔细阅读本协议。
          <strong>注册账号或使用本服务，即表示你已阅读、理解并同意接受本协议的全部条款。</strong>
          如不同意，请停止使用。
        </p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">1. 服务说明</h2>
        <p class="text-muted leading-relaxed">
          ForcedSkin 是一个面向普通用户的浏览器换肤平台，提供：
        </p>
        <ul class="list-disc list-inside text-muted mt-2 space-y-1.5">
          <li>浏览器扩展：通过 CSS / JavaScript 向任意网页注入自定义主题配色</li>
          <li>主题商城：浏览、收藏和选择社区 / 官方提供的配色方案</li>
          <li>网站适配器：针对特定网站的精细化换肤代码，支持社区提交和审核</li>
          <li>账号系统：跨设备同步主题偏好</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">2. 账号注册</h2>
        <ul class="list-disc list-inside text-muted space-y-1.5">
          <li>你必须年满 13 周岁方可注册账号</li>
          <li>注册时须提供真实有效的用户名（字母、数字、下划线，至少 4 位）和密码（至少 8 位）</li>
          <li>你对账号及密码安全负责，请勿将账号信息泄露给他人</li>
          <li>如发现账号被盗用，请立即联系我们</li>
          <li>每人只能注册一个账号，禁止注册虚假账号</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">3. 用户行为规范</h2>
        <p class="text-muted mb-2">你同意在使用本服务时：</p>
        <div class="space-y-3">
          <div class="bg-surface-muted rounded-xl p-4">
            <h3 class="font-semibold text-foreground mb-2">✅ 允许的行为</h3>
            <ul class="list-disc list-inside text-muted space-y-1">
              <li>提交原创的、用于网页换肤的适配器代码</li>
              <li>分享和收藏配色方案</li>
              <li>将扩展用于个人浏览体验改善</li>
            </ul>
          </div>
          <div class="bg-surface-muted rounded-xl p-4">
            <h3 class="font-semibold text-foreground mb-2">❌ 禁止的行为</h3>
            <ul class="list-disc list-inside text-muted space-y-1">
              <li>提交含有恶意代码、数据窃取、广告注入等有害功能的适配器</li>
              <li>提交侵犯他人著作权、商标权或隐私权的内容</li>
              <li>利用本扩展或平台进行网络攻击、欺诈、钓鱼等违法活动</li>
              <li>使用自动化工具批量注册账号或滥用 API</li>
              <li>冒充他人或发布虚假信息</li>
              <li>反向工程、破解本平台服务器端代码</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">4. 适配器审核机制</h2>
        <ul class="list-disc list-inside text-muted space-y-1.5">
          <li>用户提交的适配器代码须经管理员审核方可上线</li>
          <li>我们有权拒绝或下线任何违反规范或含有安全风险的适配器，无需提前通知</li>
          <li>通过审核不代表我们为代码质量或安全性提供担保</li>
          <li>提交者须保证对所提交内容拥有合法授权</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">5. 知识产权</h2>
        <ul class="list-disc list-inside text-muted space-y-1.5">
          <li>ForcedSkin 平台的品牌、Logo、界面设计、官方主题等知识产权归 ForcedSkin 所有</li>
          <li>用户提交的适配器代码版权归提交者本人所有，提交即视为授权 ForcedSkin 展示和分发</li>
          <li>如你认为平台上的内容侵犯了你的知识产权，请通过 <a href="mailto:legal@forcedskin.com" class="text-primary-500 hover:underline">legal@forcedskin.com</a> 联系我们</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">6. 免责声明</h2>
        <div class="space-y-2 text-muted">
          <p>本扩展通过修改网页样式提供换肤功能，<strong class="text-foreground">我们不对以下情况负责：</strong></p>
          <ul class="list-disc list-inside space-y-1">
            <li>目标网站功能因样式覆盖而出现异常</li>
            <li>第三方网站的内容、隐私实践或安全状况</li>
            <li>用户提交的适配器代码中的安全问题（审核时已尽力排查）</li>
            <li>因不可抗力或第三方故障导致的服务中断</li>
          </ul>
          <p>本服务按"现状"提供，不做任何明示或暗示的保证。</p>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">7. 服务变更与终止</h2>
        <ul class="list-disc list-inside text-muted space-y-1.5">
          <li>我们保留随时修改、暂停或终止本服务的权利</li>
          <li>重大变更将提前 7 天在官网通知</li>
          <li>我们有权在用户严重违反本协议时暂停或删除其账号</li>
          <li>你可随时注销账号，注销后数据将在 30 天内删除</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">8. 协议修改</h2>
        <p class="text-muted leading-relaxed">
          本协议可能随时更新。修订后的协议将在本页面公布，并注明更新日期。
          重大修改将通过网站通知告知用户。继续使用本服务视为接受修订后的协议。
        </p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">9. 适用法律</h2>
        <p class="text-muted leading-relaxed">
          本协议受中华人民共和国法律管辖。如发生争议，双方应首先协商解决；协商不成的，提交有管辖权的人民法院解决。
        </p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">10. 联系我们</h2>
        <p class="text-muted mb-2">如对本协议有任何疑问：</p>
        <ul class="list-none text-muted space-y-1">
          <li>📧 邮箱：<a href="mailto:legal@forcedskin.com" class="text-primary-500 hover:underline">legal@forcedskin.com</a></li>
          <li>🌐 官网：<a href="https://forcedskin.com" class="text-primary-500 hover:underline">forcedskin.com</a></li>
        </ul>
      </section>

    </div>

    <div class="mt-12 pt-8 border-t border-border flex flex-wrap gap-4">
      <NuxtLink to="/privacy" class="text-primary-500 hover:underline text-sm">隐私政策 →</NuxtLink>
      <NuxtLink to="/" class="text-muted hover:text-foreground text-sm">返回首页</NuxtLink>
    </div>
  </div>
</template>
