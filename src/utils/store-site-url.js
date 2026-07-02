/**
 * Build a URL to the dedicated storefront app (store_site_fe).
 *
 * Dev: VITE_STORE_SITE_URL (e.g. http://localhost:5173) — slug comes from
 *      VITE_DEV_SLUG in store_site_fe/.env (simulates {slug}.ojaa.me locally).
 * Prod: VITE_STORE_SITE_DOMAIN (e.g. ojaa.me) — https://{slug}.ojaa.me
 * Fallback: legacy embedded route /site/{slug} on this app
 */
export function getStoreSiteUrl(slug, options = {}) {
  const { path = '' } = options;
  if (!slug) return '';

  const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';

  const baseUrl = import.meta.env.VITE_STORE_SITE_URL;
  if (baseUrl) {
    const url = new URL(baseUrl);
    url.pathname = normalizedPath || '/';
    return url.toString();
  }

  const domain = import.meta.env.VITE_STORE_SITE_DOMAIN;
  if (domain) {
    const host = domain.replace(/^\.+/, '');
    return `https://${slug}.${host}${normalizedPath}`;
  }

  return `/site/${slug}${normalizedPath}`;
}
