# 028 - 保证 html/body 基础主题色

## 问题

`html` 和 `body` 的背景色、文字色不能保证被正确设置，原因有两个：

### 原因一：CSS 注入无法对抗内联 `!important`

之前只靠 CSS 注入：
```css
html, body { background-color: #101410 !important; color: #E0E0E0 !important; }
```

若网站在 `<body>` 上写了 `style="background: white !important"`，CSS 注入无法覆盖（内联 `!important` 优先级高于样式表 `!important`）。

### 原因二：per-element JS 逻辑二次覆盖了 body

`applyGlobalRewriteToElements` 在处理 `<body>` 时，会读取 `computed.backgroundColor`（此时已是我们注入的深色），但 luminance 低于 0.2，因此被改成 `surfaceMuted`（#161816），把正确的页面背景色（#101410）覆盖掉了。

## 修改

### 新增 `forceRootStyles(palette)`

在 `run()` 和 `runIncremental()` 中，通过 JS 直接给 `html` 和 `body` 设置内联 `!important` 样式：

```js
forceRootStyles(palette) {
  [document.documentElement, document.body].forEach((el) => {
    if (!el) return;
    el.style.setProperty("background-color", palette.background, "important");
    el.style.setProperty("background-image", "none", "important");
    el.style.setProperty("color", palette.foreground, "important");
  });
}
```

JS 内联 `!important` 是最高优先级，能覆盖网站的任何 CSS，包括网站自身的内联 `!important`（后设置的覆盖先设置的）。

### `applyGlobalRewriteToElements` 跳过 html/body

`html` 和 `body` 已由 `forceRootStyles` 精确设置，per-element 逻辑不再处理它们，避免被二次覆盖成错误的颜色。

### CSS 注入保留 `background-image: none`

`html` 和 `body` 的 CSS 注入同时清除 `background-image`，防止网站背景图覆盖背景色。

## 附加修复：透明背景元素的文字对比度计算错误

### 问题

原代码：
```js
const bgForText = themedBgColor || parseCssColor(computed.backgroundColor) || textFallbackBg;
```

`parseCssColor("rgba(0,0,0,0)")` 对透明背景返回 `{r:0,g:0,b:0,a:0}`，这是**真值**，导致 `textFallbackBg` 永远不被使用。透明背景元素的 `bgForText` 被当作纯黑色计算，白色文字对纯黑对比度极高（21），不会被修改——但实际背景已被换成浅色，结果白字浅底看不清。

典型场景：原本是暗色主题的网站（如 X/Twitter），应用亮色模式时文字无法阅读。

### 修复

```js
const rawBg = parseCssColor(computed.backgroundColor);
const bgForText = themedBgColor || (rawBg && rawBg.a > 0.05 ? rawBg : textFallbackBg);
```

透明度低于 0.05 的背景视为透明，使用 `textFallbackBg`（= 当前主题的页面背景色）作为对比度计算的基准，保证文字颜色决策基于实际渲染背景。
