/** Public-facing store name (professional online name overrides internal storeName). */
export function getStoreDisplayName(website) {
  const custom = website?.content_config?.displayName?.trim();
  if (custom) return custom;
  return website?.storeName || 'Store';
}
