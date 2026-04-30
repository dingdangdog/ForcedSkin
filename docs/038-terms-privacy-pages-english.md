# 038 - 用户协议与隐私政策页面改为英文

## 变更说明

官网静态法律页面 `/terms` 与 `/privacy` 的正文、页面标题、SEO meta（description、Open Graph）及页脚交叉链接文案由中文改为英文，生效日期格式改为英文（April 28, 2026）。

## 涉及文件

| 文件 | 说明 |
|------|------|
| `home/app/pages/terms.vue` | Terms of Service 全文英文化 |
| `home/app/pages/privacy.vue` | Privacy Policy 全文英文化 |

## 未改动

- `home/i18n/locales/zh.json` / `en.json` 中页脚与登录页的「用户协议 / 隐私政策」词条仍为各语言 UI 用语；法律正文以页面内英文为准。
- 适用法律条款仍为中华人民共和国法律（仅语言译为英文）。
