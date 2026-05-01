<script setup lang="ts">
definePageMeta({ layout: "default" });

const localePath = useLocalePath();

useForcedSkinSeo("/terms", {
  titleKey: "seo.terms.title",
  descriptionKey: "seo.terms.description",
  ogTitleKey: "seo.terms.og_title",
  ogDescriptionKey: "seo.terms.og_description",
});

const effectiveDate = "April 28, 2026";
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-16">
    <div class="mb-10">
      <h1 class="text-3xl font-bold text-foreground mb-3">Terms of Service</h1>
      <p class="text-muted text-sm">Effective date: {{ effectiveDate }} · Last updated: {{ effectiveDate }}</p>
    </div>

    <div class="space-y-8 text-sm">

      <section class="bg-primary-500/5 border border-primary-500/20 rounded-xl p-4">
        <p class="text-foreground leading-relaxed">
          Welcome to <strong>ForcedSkin</strong> (forcedskin.com). Please read these Terms carefully before you register or use the Service.
          <strong>By creating an account or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms in full.</strong>
          If you do not agree, do not use the Service.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">1. The Service</h2>
        <p class="text-muted leading-relaxed">
          ForcedSkin is a browser theming platform for end users. It provides:
        </p>
        <ul class="list-disc list-inside text-muted mt-2 space-y-1.5">
          <li>A browser extension that injects custom theme styling into web pages via CSS and JavaScript</li>
          <li>A theme gallery to browse, collect, and apply community and official color schemes</li>
          <li>Site adapters—fine-tuned theming code for specific websites—with community submission and review</li>
          <li>An account system to sync theme preferences across devices</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">2. Registration</h2>
        <ul class="list-disc list-inside text-muted space-y-1.5">
          <li>You must be at least 13 years old to register</li>
          <li>You must provide a valid username (letters, numbers, underscores; at least 4 characters) and a password (at least 8 characters)</li>
          <li>You are responsible for keeping your account credentials secure and must not share them with others</li>
          <li>If you believe your account has been compromised, contact us immediately</li>
          <li>One account per person; fraudulent or duplicate accounts are prohibited</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">3. Acceptable use</h2>
        <p class="text-muted mb-2">You agree that when using the Service you will:</p>
        <div class="space-y-3">
          <div class="bg-surface-muted rounded-xl p-4">
            <h3 class="font-semibold text-foreground mb-2">✅ Permitted conduct</h3>
            <ul class="list-disc list-inside text-muted space-y-1">
              <li>Submit original adapter code intended for lawful web theming</li>
              <li>Share and collect color schemes</li>
              <li>Use the extension to improve your personal browsing experience</li>
            </ul>
          </div>
          <div class="bg-surface-muted rounded-xl p-4">
            <h3 class="font-semibold text-foreground mb-2">❌ Prohibited conduct</h3>
            <ul class="list-disc list-inside text-muted space-y-1">
              <li>Submit adapters containing malware, data theft, injected ads, or other harmful functionality</li>
              <li>Submit content that infringes others’ copyright, trademark, or privacy rights</li>
              <li>Use the extension or platform for attacks, fraud, phishing, or other illegal activity</li>
              <li>Use automation to mass-register accounts or abuse APIs</li>
              <li>Impersonate others or spread false information</li>
              <li>Reverse engineer or attempt to break server-side security of the platform</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">4. Adapter review</h2>
        <ul class="list-disc list-inside text-muted space-y-1.5">
          <li>User-submitted adapter code must be approved by an administrator before publication</li>
          <li>We may reject or remove any adapter that violates these Terms or poses a security risk, without prior notice</li>
          <li>Approval does not constitute a warranty of code quality or security</li>
          <li>Submitters warrant they have the necessary rights to submit the content</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">5. Intellectual property</h2>
        <ul class="list-disc list-inside text-muted space-y-1.5">
          <li>ForcedSkin branding, logos, UI design, and official themes remain our property</li>
          <li>Copyright in user-submitted adapter code belongs to the submitter; by submitting, you grant ForcedSkin a license to display and distribute it on the Service</li>
          <li>If you believe content on the platform infringes your rights, contact us at <a href="mailto:legal@forcedskin.com"
              class="text-primary-500 hover:underline">legal@forcedskin.com</a></li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">6. Disclaimer</h2>
        <div class="space-y-2 text-muted">
          <p>The extension changes page styling for theming purposes. <strong class="text-foreground">We are not responsible for:</strong></p>
          <ul class="list-disc list-inside space-y-1">
            <li>Sites breaking or behaving oddly because of style overrides</li>
            <li>Third-party sites’ content, privacy practices, or security</li>
            <li>Security issues in user-submitted adapters (we strive to review carefully)</li>
            <li>Service interruptions due to force majeure or third-party failures</li>
          </ul>
          <p>The Service is provided “as is,” without warranties of any kind, express or implied.</p>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">7. Changes and termination</h2>
        <ul class="list-disc list-inside text-muted space-y-1.5">
          <li>We may modify, suspend, or discontinue the Service at any time</li>
          <li>Material changes will be announced on the website at least 7 days in advance</li>
          <li>We may suspend or delete accounts that materially breach these Terms</li>
          <li>You may delete your account at any time; related data will be removed within 30 days</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">8. Changes to these Terms</h2>
        <p class="text-muted leading-relaxed">
          We may update these Terms from time to time. Revised Terms will be posted on this page with an updated effective date.
          For material changes, we will notify users via the website. Continued use of the Service after changes constitutes acceptance.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">9. Governing law</h2>
        <p class="text-muted leading-relaxed">
          These Terms are governed by the laws of the People’s Republic of China. Any dispute shall first be resolved through good-faith negotiation;
          if that fails, it shall be submitted to a court of competent jurisdiction.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">10. Contact</h2>
        <p class="text-muted mb-2">Questions about these Terms:</p>
        <ul class="list-none text-muted space-y-1">
          <li>📧 Email: <a href="mailto:legal@forcedskin.com"
              class="text-primary-500 hover:underline">legal@forcedskin.com</a></li>
          <li>🌐 Website: <a href="https://forcedskin.com" class="text-primary-500 hover:underline">forcedskin.com</a></li>
        </ul>
      </section>

    </div>

    <div class="mt-12 pt-8 border-t border-border flex flex-wrap gap-4">
      <NuxtLink :to="localePath('/privacy')" class="text-primary-500 hover:underline text-sm">Privacy Policy →</NuxtLink>
      <NuxtLink :to="localePath('/')" class="text-muted hover:text-foreground text-sm">Back to home</NuxtLink>
    </div>
  </div>
</template>
