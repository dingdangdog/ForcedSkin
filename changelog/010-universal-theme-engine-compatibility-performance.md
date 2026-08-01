# 010 通用主题引擎兼容性与性能优化

## 变更内容

- 将全局主题覆盖改为“基础 CSS 规则 + 背景增量映射”的混合方案，文字、边框、表单、占位符、选区和滚动条无需逐元素重复计算。
- 不再跳过透明层、遮罩、渐变、滤镜和 `pointer-events: none` 元素；CSS 渐变会被主题表面色替换，URL/位图背景继续保留。
- 根据原始背景的透明度、明度、色差和色度，将普通背景映射为 `background`、`surface`、`surfaceMuted` 或主题强调色，并为强调色背景自动选择更清晰的文字色。
- 支持 `::before` / `::after` 伪元素背景改色，补充 SVG、表单控件、禁用态和动态 class 变化的主题覆盖。
- 扫描并改写根节点中值为颜色的 CSS 自定义属性，提升依赖设计令牌的网站兼容性。
- 为开放 Shadow DOM 注入独立主题样式并建立独立增量观察器；新增主世界 `attachShadow` 通知钩子，覆盖延迟创建的开放 Shadow Root。
- 内容脚本改为作用于所有 iframe，并支持 `about:blank` 与同源回退 frame。
- 各 frame 监听主题、调色板和白名单存储变化，切换设置后无需刷新子 frame。
- 单独更新主题模式时继续沿用当前白名单，避免消息载荷未携带白名单导致站点被临时启用。
- 全量处理拆成首屏同步批次与空闲时间批次，动态 DOM 继续按节点子树合并、增量处理，避免高频整页重扫。
- 站点适配器首次执行时缓存深度根列表，动态刷新时只查询本批变更子树，不再为每个适配层重复遍历整页与全部 Shadow DOM。
- 主题引擎和声明式适配器统一通过可逆样式写入接口修改内联样式；关闭或切换主题时精确恢复原值与优先级，不再误删网站自身样式。
- 恢复样式前会校验当前值是否仍由插件写入；若网站运行期间主动更新了同一内联属性，则保留网站的新值。

## 涉及文件

- `extension/src/content/engine.js`
- `extension/src/content/shadow-hook.js`
- `extension/src/content/adapter-formula.js`
- `extension/src/content/content.js`
- `extension/manifest.json`
