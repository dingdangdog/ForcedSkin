# 009 — 插件主题与官网解耦

**日期：** 2026-06-08

## 问题

插件在登录或同步主题时，会用官网账号上的 `lightTheme` / `darkTheme` 覆盖本地已选主题；在插件内切换主题也会写回服务端。导致官网收藏/切换主题后，插件默认主题被连带改变。

## 变更摘要

- 插件当前应用的亮/暗主题仅保存在 `chrome.storage.local`（`gtsPickLight` / `gtsPickDark`），同步时只更新收藏候选列表，不再读取或覆盖服务端选中项。
- 插件内选择主题时不再调用 `extension-theme-select` 写回账号。
- `extension-settings` 接口的 `light` / `dark` 字段改为系统默认主题（供首次初始化回退），候选列表为「系统默认 + 用户收藏」。

## 修改文件

- `extension/src/background.js` — `persistThemeStateFromApi`、`APPLY_THEME_VARIANT`
- `home/server/api/pub/extension-settings.get.ts` — 移除账号主题偏好对扩展接口的影响
