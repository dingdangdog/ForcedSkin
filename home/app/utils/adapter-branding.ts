/** 适配器 siteDomain 可能为逗号分隔多域名，取首个用于图标与展示 */
export function getAdapterMainDomain(siteDomain: string): string {
  const domains = siteDomain.split(",").map((d) => d.trim()).filter(Boolean);
  return domains[0] || "";
}

/** Google favicon 服务（与首页「已适配网站」区一致） */
export function getAdapterFaviconUrl(siteDomain: string, sizePx = 32): string {
  const domain = getAdapterMainDomain(siteDomain);
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${sizePx}`;
}
