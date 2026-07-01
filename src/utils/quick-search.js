const SEARCH_CACHE_KEY = 'qs_search_cache';
const SEARCH_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function saveSearchCache(results) {
  try {
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify({ results, ts: Date.now() }));
  } catch {
    // ignore quota errors
  }
}

export function loadSearchCache() {
  try {
    const raw = localStorage.getItem(SEARCH_CACHE_KEY);
    if (!raw) return [];
    const { results, ts } = JSON.parse(raw);
    if (Date.now() - ts > SEARCH_CACHE_MAX_AGE_MS) return [];
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  }
}

export function filterCacheByQuery(cachedResults, q) {
  const lower = q.toLowerCase();
  const spaceless = lower.replace(/\s+/g, '');
  const tokens = lower.split(/\s+/).filter(Boolean);

  return cachedResults.filter((r) => {
    const name = r.name?.toLowerCase() || '';
    const sku = r.sku?.toLowerCase() || '';
    const code = r.code?.toLowerCase() || '';

    if (name.includes(lower) || sku.includes(lower) || code.includes(lower)) return true;
    const nameSpaceless = name.replace(/\s+/g, '');
    if (spaceless && nameSpaceless.includes(spaceless)) return true;
    if (tokens.length > 1 && tokens.every((t) => name.includes(t))) return true;
    return false;
  });
}

export function cartIdForSearchItem(item, packMode = 'unit') {
  if (item.type === 'product' && item.is_pack) {
    return `${item.type}-${item.id}-${packMode}`;
  }
  return `${item.type}-${item.id}`;
}

export function normalizeQuickSearchProduct(item) {
  if (!item || item.type !== 'product') return item;
  const isPack = Boolean(item.is_pack ?? item.isPack);
  const qpp = item.quantity_per_pack ?? item.quantityPerPack ?? null;
  return {
    ...item,
    is_pack: isPack,
    quantity_per_pack: qpp,
    cost_price_per_pack: item.cost_price_per_pack ?? item.costPricePerPack ?? null,
    pack_sell_price: item.pack_sell_price ?? item.packSellPrice ?? null,
  };
}

export function lineKeyForFormItem(item) {
  if (item.product_id != null) return `product-${item.product_id}`;
  if (item.service_id != null) return `service-${item.service_id}`;
  return null;
}

export function searchItemToFormFields(item, existingQty = 0) {
  const row = normalizeQuickSearchProduct(item);
  const qty = existingQty > 0 ? existingQty + 1 : 1;
  const price = Number(row.price) || 0;
  return {
    product_id: row.type === 'product' ? row.id : undefined,
    service_id: row.type === 'service' ? row.id : undefined,
    item: row.name,
    description: row.name,
    quantity: row.type === 'service' ? 1 : qty,
    price,
    total: (row.type === 'service' ? 1 : qty) * price,
    costPrice: row.type === 'product' ? row.cost_price ?? price : undefined,
    originalPrice: price,
    _meta: {
      type: row.type,
      stock: row.stock ?? null,
      has_consigned: row.has_consigned ?? false,
      allow_variable_price: row.allow_variable_price ?? false,
      variable_price_min: row.variable_price_min ?? null,
      variable_price_max: row.variable_price_max ?? null,
    },
  };
}
