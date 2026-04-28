<script setup lang="ts">
definePageMeta({ layout: "default" });

useHead({
  title: "隐私政策 — ForcedSkin",
  meta: [
    { name: "description", content: "ForcedSkin 隐私政策：了解我们如何收集、使用和保护你的个人信息。" },
    { property: "og:title", content: "隐私政策 — ForcedSkin" },
    { property: "og:description", content: "ForcedSkin 隐私政策：了解我们如何收集、使用和保护你的个人信息。" },
    { property: "og:url", content: "https://forcedskin.com/privacy" },
  ],
  link: [{ rel: "canonical", href: "https://forcedskin.com/privacy" }],
});

const effectiveDate = "2026 年 4 月 28 日";
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-16">
    <div class="mb-10">
      <p class="text-primary-500 text-sm font-medium mb-2">法律文件</p>
      <h1 class="text-3xl font-bold text-foreground mb-3">隐私政策</h1>
      <p class="text-muted text-sm">生效日期：{{ effectiveDate }}｜最近更新：{{ effectiveDate }}</p>
    </div>

    <div class="prose prose-sm max-w-none text-foreground space-y-8">

      <section>
        <p class="text-muted leading-relaxed">
          欢迎使用 <strong class="text-foreground">ForcedSkin</strong>（以下简称"本平台"，网址：forcedskin.com）。
          本隐私政策描述了我们在你使用 ForcedSkin 网站及浏览器扩展（统称"服务"）时，如何收集、使用、存储和保护你的个人信息。
          请在使用本服务前仔细阅读本政策。<strong class="text-foreground">使用本服务即表示你同意本政策的条款。</strong>
        </p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">1. 我们收集哪些信息</h2>
        <div class="space-y-4">
          <div>
            <h3 class="font-semibold text-foreground mb-1">1.1 你主动提供的信息</h3>
            <ul class="list-disc list-inside text-muted space-y-1 text-sm">
              <li>注册账号时：用户名、密码（加密存储）、昵称、电子邮件（选填）</li>
              <li>提交网站适配器时：代码内容、适配器说明</li>
            </ul>
          </div>
          <div>
            <h3 class="font-semibold text-foreground mb-1">1.2 自动收集的信息</h3>
            <ul class="list-disc list-inside text-muted space-y-1 text-sm">
              <li>登录时间、IP 地址（仅用于安全审计，不对外共享）</li>
              <li>浏览器扩展中存储的主题偏好设置（仅存于 <code class="bg-surface-muted px-1 rounded">chrome.storage</code>，不上传服务器）</li>
            </ul>
          </div>
          <div>
            <h3 class="font-semibold text-foreground mb-1">1.3 不收集的信息</h3>
            <p class="text-muted text-sm">我们<strong class="text-foreground">不</strong>收集你浏览的网页内容、浏览历史、输入内容或任何与主题应用无关的个人数据。</p>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">2. 我们如何使用信息</h2>
        <ul class="list-disc list-inside text-muted space-y-1.5 text-sm">
          <li>提供账号登录和身份验证服务</li>
          <li>保存并同步你的主题收藏和选择（亮色 / 暗色主题偏好）</li>
          <li>将你提交的适配器代码提交至管理员审核流程</li>
          <li>改善产品体验和安全性</li>
          <li>发送与账号直接相关的服务通知（如密码重置）</li>
        </ul>
        <p class="text-muted text-sm mt-3">我们<strong class="text-foreground">不会</strong>将你的个人信息用于广告定向、出售给第三方或其他与提供本服务无关的用途。</p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">3. 信息的存储与安全</h2>
        <ul class="list-disc list-inside text-muted space-y-1.5 text-sm">
          <li>用户密码使用 SHA-256 + 用户名加盐后存储，我们无法还原明文</li>
          <li>用户会话通过 JWT 实现，有效期 30 天，使用 HttpOnly Cookie 传输</li>
          <li>浏览器扩展的认证 Token 存储于 <code class="bg-surface-muted px-1 rounded">chrome.storage.local</code>，仅在本设备可访问</li>
          <li>我们采用 HTTPS 加密所有网络传输</li>
          <li>服务器数据存储于经过安全加固的云环境</li>
        </ul>
        <p class="text-muted text-sm mt-3">尽管我们采取了合理的安全措施，但互联网传输并不能保证 100% 安全。如发现账号异常，请立即联系我们。</p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">4. Cookies 与本地存储</h2>
        <div class="space-y-3 text-sm text-muted">
          <p><strong class="text-foreground">Authorization Cookie：</strong>登录后设置，用于保持会话，HttpOnly、SameSite=Lax，有效期 30 天。</p>
          <p><strong class="text-foreground">主题偏好 Cookie：</strong>存储你选择的亮/暗模式，无个人身份信息，有效期 1 年。</p>
          <p><strong class="text-foreground">扩展本地存储：</strong>主题配色数据存储在 <code class="bg-surface-muted px-1 rounded">chrome.storage.local</code>，不会上传至服务器。</p>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">5. 第三方服务</h2>
        <p class="text-muted text-sm">本平台当前不集成任何第三方广告、分析或社交登录服务。如将来引入，我们会更新本政策并提前通知用户。</p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">6. 未成年人隐私</h2>
        <p class="text-muted text-sm">本服务不面向 13 岁以下儿童。如发现未成年人账号，我们将予以删除。</p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">7. 你的权利</h2>
        <ul class="list-disc list-inside text-muted space-y-1.5 text-sm">
          <li><strong class="text-foreground">访问与修改：</strong>登录后可在账号设置中查看和修改个人信息</li>
          <li><strong class="text-foreground">删除账号：</strong>可随时联系我们申请删除账号及相关数据</li>
          <li><strong class="text-foreground">数据导出：</strong>可申请获取你在本平台存储的数据副本</li>
          <li><strong class="text-foreground">撤回同意：</strong>可随时停止使用本服务，卸载扩展，数据将不再被处理</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">8. 政策变更</h2>
        <p class="text-muted text-sm">
          我们保留随时修改本隐私政策的权利。重大变更将在网站首页或通过邮件提前 7 天通知。继续使用本服务视为接受修订后的政策。
        </p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">9. 联系我们</h2>
        <p class="text-muted text-sm">如对本隐私政策有任何疑问，请通过以下方式联系我们：</p>
        <ul class="list-none text-sm mt-2 space-y-1 text-muted">
          <li>📧 邮箱：<a href="mailto:privacy@forcedskin.com" class="text-primary-500 hover:underline">privacy@forcedskin.com</a></li>
          <li>🌐 官网：<a href="https://forcedskin.com" class="text-primary-500 hover:underline">forcedskin.com</a></li>
        </ul>
      </section>

    </div>

    <div class="mt-12 pt-8 border-t border-border flex flex-wrap gap-4">
      <NuxtLink to="/terms" class="text-primary-500 hover:underline text-sm">用户协议 →</NuxtLink>
      <NuxtLink to="/" class="text-muted hover:text-foreground text-sm">返回首页</NuxtLink>
    </div>
  </div>
</template>
