# 插件介绍

## 简短说明

ForcedSkin 在任意网页上一键统一亮色或暗色配色，护眼、省眼疲劳；可设站点白名单，登录官网还能跨设备同步你喜欢的主题。

## 详细说明（商店「详细说明」正文建议）

### ForcedSkin 是做什么的？

很多网站只有亮色或只有暗色，和系统/个人习惯不一致时容易刺眼或费眼。ForcedSkin 在浏览器里为访问的网页统一套上你选择的配色风格：亮色、暗色，或关闭效果（完全保留站点原样）。目标不是改排版，而是统一颜色观感，让日常浏览更舒服、更一致。

### 为什么值得安装？

**one place 管全天下的网页样式**：不用每个站点单独找「夜间模式」，换设备前先在扩展里选好模式即可。
按需生效：支持白名单，只对信任的域名启用，其它站点保持原样，兼顾习惯与可控性。
和官网打通：扩展与 forcedskin.com 配套，可浏览主题与网站适配能力；登录后还能同步账号与主题偏好，多电脑、多浏览器环境更容易保持一致。
操作简单：点击扩展图标即可切换模式、管理当前站点与白名单，无需复杂配置。
若你希望夜间阅读更轻松、或希望所有常用站点的亮度风格一致，ForcedSkin 就是为这类日常需求准备的工具。

英文版（若商店需英文或双语）
What it does: ForcedSkin applies a consistent light or dark color theme across websites you visit—or you can turn it off per your preference. It focuses on harmonizing colors without restructuring pages.

Why install: One switch for eye-friendly reading; domain whitelist for control; works with forcedskin.com for themes and adapters; sign in to sync your theme choices across devices. Simple popup—no steep learning curve.

# 插件应用商店：隐私 / 单一用途 / 权限说明（英文填报文案）

## 如何使用

以下内容均为**英文**，可直接复制到 Chrome 网上应用店、Microsoft Edge 加载项中心等「单一用途」「权限用途说明」类字段。

- **单一用途**：整段可复制到「Single purpose」或等价说明框（可按字数限制截取首句核心句）。
- **各权限**：每段对应一项权限的名称；若商店要求分项填写，就只贴该段正文。
- 若审核方要求「权限与实现一致」：当前仓库里的 `manifest.json` 已声明 `**scripting`**，但源码中未发现对 `chrome.scripting` 的调用；若审核反馈该权限冗余，可考虑从清单中移除 `scripting` 后再上架，或与审核说明保持一致。

---

## 单一用途说明（英文）

### Single purpose

ForcedSkin lets you apply a consistent **light / dark appearance** across websites by adjusting CSS colors (and related visuals) locally in the browser—without rewriting page layouts. You can optionally log in via the official site to sync your preferred theme palettes and related settings across devices, and disable or scope automatic theming using a simple site whitelist. The extension exists only to deliver this **readable, user-controlled unified theming** experience.

---

## 需请求权限的理由（英文分项）

以下各段可与商店表单项 **一一对应**。

### `storage`

The extension saves your preferences and cached data locally: theme mode (light / dark / off), per-site whitelist, signed-in profile metadata, authentication token issued after OAuth, downloaded theme catalogs and palette definitions, and cached site-adapter formulas fetched from ForcedSkin’s servers. `**storage` is required** so these settings persist between sessions and so the popup and content scripts can read the same data without transmitting browsing history.

### `alarms`

Under **Manifest V3**, the background worker may be suspended when idle. When the user selects **automatic** theme mode, the extension switches between light and dark based on **local clock boundaries** (day vs night hours). `**chrome.alarms`** schedules a single named alarm for the **next** boundary so the worker can wake, re-evaluate the effective theme, and **broadcast updates** to open tabs—without keeping a persistent timer or polling. Alarms are cleared whenever automatic mode is not active; they are used **only** for this scheduled theme refresh, not for unrelated scheduling or background work.

### `scripting`

This extension targets **Manifest V3**. The `**scripting` permission** is declared so the extension may use Chrome’s programmatic script APIs when needed—for example to register content scripts programmatically or to inject scripts in coordination with tab lifecycle—alongside statically declared content scripts that apply universal theming. Use is limited to **theme and adapter orchestration**, not unrelated page modification.

*(若你从 `manifest.json` 中移除 `scripting`，请在本项填「不适用」或删除该权限声明后再提交商店。)*

### `tabs`

The background service worker needs `**chrome.tabs`** to enumerate regular browser tabs (`https` / `http`), listen for activation and navigation events, and **send one-way messages** so each tab’s content script receives updated theme mode, whitelist, palettes, or adapter-cache refresh signals. Tab URLs are inspected **only** to skip restricted schemes (for example non-web pages); the extension does not collect or upload your browsing history.

### `identity`

`**identity`** is used solely for `**chrome.identity.launchWebAuthFlow**`—opening a bounded OAuth / session handshake with `**https://forcedskin.com**` and returning to the extension’s predefined redirect URL. This lets users sign in with the same account mechanism as the website and receive a bearer token stored locally for syncing theme selections. No third-party identity provider access beyond that official auth bridge is requested by this permission itself.

### Host permissions (`<all_urls>`)

Universal **host access** matches where the extension is designed to operate: ordinary website documents on `http://*` and `https://*`. Manifest **content scripts** load at `**document_start`** on those origins so lightweight color overrides can run early. Narrowing host permissions would defeat the primary goal of consistent theming across sites the user chooses to browse. Sensitive internal controls (whitelist, optional login) remain **under the user’s control** inside the popup; the extension does not exfiltrate page content unrelated to delivering theming behaviour.

---

## 可选附加说明（数据与传输，英文短文）

以下为「隐私惯例 / 数据收集」类字段可参考的短文（按需裁剪）。

ForcedSkin operates primarily **on-device**: preferences and caches live in `**chrome.storage`**. Optional network calls go to `**https://forcedskin.com**` (authenticated theme/catalog sync after login, fetching public adapter definitions and palette metadata). Browser tabs are iterated locally to propagate settings; **URLs are not bulk-uploaded as browsing history.** Authentication uses the `**identity`** web-auth flow tied to ForcedSkin’s OAuth bridge endpoint.