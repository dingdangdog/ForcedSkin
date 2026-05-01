<script setup lang="ts">
definePageMeta({ layout: "default" });

const localePath = useLocalePath();

useForcedSkinSeo("/privacy", {
  titleKey: "seo.privacy.title",
  descriptionKey: "seo.privacy.description",
  ogTitleKey: "seo.privacy.og_title",
  ogDescriptionKey: "seo.privacy.og_description",
});

const effectiveDate = "April 28, 2026";
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-16">
    <div class="mb-10">
      <h1 class="text-3xl font-bold text-foreground mb-3">Privacy Policy</h1>
      <p class="text-muted text-sm">Effective date: {{ effectiveDate }} · Last updated: {{ effectiveDate }}</p>
    </div>

    <div class="prose prose-sm max-w-none text-foreground space-y-8">

      <section>
        <p class="text-muted leading-relaxed">
          Welcome to <strong class="text-foreground">ForcedSkin</strong> (“the Platform,” forcedskin.com).
          This Privacy Policy explains how we collect, use, store, and protect your personal information when you use the ForcedSkin website and browser extension (together, the “Service”).
          Please read it before using the Service. <strong class="text-foreground">By using the Service, you agree to this Policy.</strong>
        </p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">1. Information we collect</h2>
        <div class="space-y-4">
          <div>
            <h3 class="font-semibold text-foreground mb-1">1.1 Information you provide</h3>
            <ul class="list-disc list-inside text-muted space-y-1 text-sm">
              <li>When you register: username, password (stored hashed), display name, and optional email</li>
              <li>When you submit a site adapter: code content and description</li>
            </ul>
          </div>
          <div>
            <h3 class="font-semibold text-foreground mb-1">1.2 Information collected automatically</h3>
            <ul class="list-disc list-inside text-muted space-y-1 text-sm">
              <li>Login timestamps and IP address (for security auditing only; not shared externally)</li>
              <li>Theme preference settings stored in the extension via <code class="bg-surface-muted px-1 rounded">chrome.storage</code> (local only; not uploaded to our servers)</li>
            </ul>
          </div>
          <div>
            <h3 class="font-semibold text-foreground mb-1">1.3 What we do not collect</h3>
            <p class="text-muted text-sm">We <strong
                class="text-foreground">do not</strong> collect the contents of pages you browse, browsing history, keystrokes, or other personal data unrelated to applying themes.</p>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">2. How we use information</h2>
        <ul class="list-disc list-inside text-muted space-y-1.5 text-sm">
          <li>To provide sign-in and authentication</li>
          <li>To save and sync your theme favorites and selections (light / dark preferences)</li>
          <li>To route adapter submissions through administrator review</li>
          <li>To improve product experience and security</li>
          <li>To send service-related notices tied to your account (e.g., password reset)</li>
        </ul>
        <p class="text-muted text-sm mt-3">We <strong
            class="text-foreground">do not</strong> use your personal information for ad targeting, sell it to third parties, or use it for purposes unrelated to operating the Service.</p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">3. Storage and security</h2>
        <ul class="list-disc list-inside text-muted space-y-1.5 text-sm">
          <li>Passwords are stored using SHA-256 with a per-user salt; we cannot recover plaintext passwords</li>
          <li>Sessions use JWT with a 30-day lifetime, delivered via HttpOnly cookies</li>
          <li>Extension auth tokens are stored in <code class="bg-surface-muted px-1 rounded">chrome.storage.local</code> and are accessible only on your device</li>
          <li>We use HTTPS for network transport</li>
          <li>Server data is hosted in a hardened cloud environment</li>
        </ul>
        <p class="text-muted text-sm mt-3">No internet transmission is 100% secure. If you notice suspicious account activity, contact us immediately.</p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">4. Cookies and local storage</h2>
        <div class="space-y-3 text-sm text-muted">
          <p><strong class="text-foreground">Authorization cookie:</strong> Set after login to maintain your session; HttpOnly; SameSite=Lax; 30-day lifetime.</p>
          <p><strong class="text-foreground">Theme preference cookie:</strong> Stores light/dark mode choice; no personally identifying information; 1-year lifetime.</p>
          <p><strong class="text-foreground">Extension storage:</strong> Theme data lives in <code
              class="bg-surface-muted px-1 rounded">chrome.storage.local</code> and is not uploaded to our servers.</p>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">5. Third-party services</h2>
        <p class="text-muted text-sm">The Platform does not currently integrate third-party advertising, analytics, or social login. If that changes, we will update this Policy and notify you in advance.</p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">6. Children</h2>
        <p class="text-muted text-sm">The Service is not directed at children under 13. If we learn of an underage account, we will delete it.</p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">7. Your rights</h2>
        <ul class="list-disc list-inside text-muted space-y-1.5 text-sm">
          <li><strong class="text-foreground">Access and correction:</strong> After login, you can view and edit profile information in account settings</li>
          <li><strong class="text-foreground">Account deletion:</strong> Contact us anytime to request deletion of your account and related data</li>
          <li><strong class="text-foreground">Data export:</strong> You may request a copy of data we hold about you</li>
          <li><strong class="text-foreground">Withdraw consent:</strong> Stop using the Service or uninstall the extension; we will cease processing as described here</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">8. Changes to this Policy</h2>
        <p class="text-muted text-sm">
          We may update this Privacy Policy from time to time. Material changes will be announced on the website homepage or by email at least 7 days in advance.
          Continued use after changes constitutes acceptance.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-bold text-foreground mb-3 pb-2 border-b border-border">9. Contact</h2>
        <p class="text-muted text-sm">Questions about this Privacy Policy:</p>
        <ul class="list-none text-sm mt-2 space-y-1 text-muted">
          <li>📧 Email: <a href="mailto:privacy@forcedskin.com"
              class="text-primary-500 hover:underline">privacy@forcedskin.com</a></li>
          <li>🌐 Website: <a href="https://forcedskin.com" class="text-primary-500 hover:underline">forcedskin.com</a></li>
        </ul>
      </section>

    </div>

    <div class="mt-12 pt-8 border-t border-border flex flex-wrap gap-4">
      <NuxtLink :to="localePath('/terms')" class="text-primary-500 hover:underline text-sm">Terms of Service →</NuxtLink>
      <NuxtLink :to="localePath('/')" class="text-muted hover:text-foreground text-sm">Back to home</NuxtLink>
    </div>
  </div>
</template>
