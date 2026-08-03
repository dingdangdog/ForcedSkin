# ForcedSkin – Dark Mode & Custom Website Themes

ForcedSkin is a browser extension that applies dark mode, light mode, or a custom color theme to the websites you visit. It recolors page backgrounds, text, links, borders, forms, and other CSS-based interface elements while preserving photos, videos, and other image content.

Use one consistent website theme across the web, switch automatically between light and dark mode, or exclude websites that should keep their original appearance. ForcedSkin is designed for comfortable everyday browsing without changing page layouts or blocking normal website interactions.

## Why ForcedSkin?

- **Dark mode for websites:** Give bright websites a consistent dark appearance, even when they do not provide a built-in night mode.
- **Light mode when you need it:** Replace overly dark interfaces with a cleaner light color palette.
- **Custom website themes:** Choose from multiple palettes and apply coordinated colors to backgrounds, text, links, controls, borders, and scrollbars.
- **Automatic day and night themes:** Switch between light and dark mode based on local time.
- **Per-site control:** Exclude websites that should keep their original design.
- **Works with modern pages:** Supports dynamic websites, single-page applications, open Shadow DOM components, and ordinary web frames.
- **Optional theme sync:** Sign in through [forcedskin.com](https://forcedskin.com) to keep selected themes available across devices.
- **Image-friendly recoloring:** CSS-based interface colors are changed while photos, videos, canvas graphics, and bitmap backgrounds remain intact whenever possible.

## How It Works

1. Install ForcedSkin and open the extension popup.
2. Choose light mode, dark mode, automatic mode, or turn website theming off.
3. Select a color theme from the available palette collection.
4. Exclude individual websites whenever you want to preserve their original appearance.

ForcedSkin changes colors locally in the browser. It does not redesign page layouts, replace website content, or intentionally interfere with links and application navigation.

## Chrome Web Store Listing Copy

The following copy is the recommended English listing for search visibility and conversion.

### Extension Name

**ForcedSkin – Dark Mode & Custom Website Themes**

This name keeps the ForcedSkin brand while naturally including the strongest product-intent phrases: “dark mode,” “custom,” “website,” and “themes.”

### Short Name

**ForcedSkin**

### Short Description

> Apply dark mode, light mode, or custom color themes to any website. Recolor backgrounds, text, links, borders, and forms.

### Detailed Description

The web should not become uncomfortable just because every website chooses a different color scheme.

ForcedSkin gives you one consistent way to control website colors across the browser. It can apply dark mode to bright pages, replace an overly dark interface with a light theme, or use a custom color palette that better matches your preferences. Instead of simply inverting the screen, ForcedSkin recolors CSS-based interface elements—including page backgrounds, surfaces, text, links, borders, buttons, forms, placeholders, scrollbars, and many dynamically loaded components—while preserving photos, videos, canvas graphics, and other image content whenever possible.

### What is ForcedSkin for?

Many websites still do not offer dark mode. Others provide a dark theme that is incomplete, inconsistent, or limited to certain pages. Even when individual websites support themes, switching and configuring them one by one is repetitive. ForcedSkin solves this by providing a single browser-level theme control for ordinary websites.

Use ForcedSkin when you want to:

- browse bright websites with a calmer dark appearance;
- make dark websites easier to use with a light color scheme;
- keep frequently visited websites visually consistent;
- personalize website colors beyond the themes offered by the site itself;
- switch automatically between daytime and nighttime palettes;
- preserve the original appearance of selected websites with per-site exclusions.

### Why install ForcedSkin?

**One theme switch for the web.** Choose a light, dark, or automatic mode from a simple popup instead of searching for theme settings on every website.

**More than a basic color inversion.** ForcedSkin maps interface colors to a coordinated palette. Backgrounds, content surfaces, text, borders, links, controls, and accent colors are handled as related parts of the same theme, helping pages remain recognizable and readable.

**Designed for modern websites.** The extension processes content added after the initial page load and supports many single-page applications, ordinary frames, and open Shadow DOM components. Its incremental engine updates newly added interface elements without intentionally changing page layouts or interfering with links and application navigation.

**Your choice on every website.** If a website already looks right, exclude it and keep its original design. You can turn theming off at any time without permanently modifying the page.

**Automatic light and dark mode.** Automatic mode uses your local time to select a daytime or nighttime theme without continuously polling in the background.

**Optional theme synchronization.** You can use ForcedSkin without signing in. If you choose to connect an account through forcedskin.com, your selected themes can be synchronized across supported devices.

**Local-first operation.** Theme application happens in your browser. ForcedSkin does not need to upload page contents or maintain a browsing-history service in order to recolor websites.

### What ForcedSkin changes

ForcedSkin targets colors controlled through webpage CSS, including:

- page and container backgrounds;
- headings, paragraphs, labels, and muted text;
- links, buttons, inputs, text areas, and selection colors;
- borders, outlines, placeholders, and scrollbars;
- CSS gradients, SVG interface icons, and many pseudo-elements;
- dynamically inserted content and compatible web components.

The extension is intentionally focused on color theming. It does not replace website content, redesign layouts, inject advertisements, or intentionally block clicks and navigation.

### Limitations

Browser extensions cannot modify protected browser pages such as the Chrome Web Store, Chrome settings, and some internal URLs. Colors embedded directly inside photos, videos, canvas drawings, cross-origin media, bitmap backgrounds, or closed Shadow DOM components may also remain unchanged. Website implementations vary, so individual sites can be excluded whenever their original appearance works better.

Choose your preferred colors once, keep control over where they apply, and give everyday browsing a more consistent appearance with ForcedSkin.

## Search Positioning Notes

The store copy intentionally covers these search intents through readable sentences:

- dark mode for websites
- website dark mode extension
- night mode browser extension
- custom website themes
- website theme changer
- change website colors
- light mode extension
- eye-comfort browsing
- custom color palette

Do not paste these phrases into the store as a standalone keyword block. Chrome Web Store policies prohibit irrelevant or excessive keyword repetition, and natural product copy is more trustworthy for users.

## Privacy and Permissions

ForcedSkin operates primarily on-device. Theme preferences, site exclusions, and cached palettes are stored with `chrome.storage`. Optional network requests to `https://forcedskin.com` are used for account sign-in, theme catalog updates, theme selection sync, and public site-adapter definitions.

### Single Purpose

ForcedSkin applies user-selected light, dark, and custom color themes to ordinary websites. Its permissions support this single website-theming purpose and the optional synchronization of theme preferences.

### Permission Usage

- **`storage`:** Saves theme mode, selected palettes, site exclusions, account metadata, and cached theme or adapter data.
- **`alarms`:** Schedules the next local-time boundary when automatic light/dark mode is enabled, without continuous polling.
- **`tabs`:** Sends theme-setting updates to open web tabs and skips browser-protected URLs that extensions cannot modify.
- **`identity`:** Opens the official ForcedSkin authentication flow for optional account and theme synchronization.
- **`scripting`:** This permission is currently declared, but the present source does not directly call `chrome.scripting`. Remove it before store submission unless a concrete scripting API feature requires it; an unused permission should not be justified as necessary.
- **`<all_urls>` host access:** Allows the core website-theme feature to work on ordinary HTTP and HTTPS pages. Page content is not collected as browsing history.

## Product Scope

ForcedSkin can recolor CSS-controlled interface elements. It cannot reliably recolor pixels embedded in photos, videos, canvas drawings, cross-origin media, browser-protected pages, or closed Shadow DOM components.
