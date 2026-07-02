// ----------------------------------------------------------------------

/** Match invoice-details / thermal PDF line totals. */
export function lineItemTotal(item) {
  if (item?.total != null && item.total !== '') {
    const t = Number(item.total);
    if (!Number.isNaN(t)) return t;
  }
  const p = Number(item?.price);
  const q = Number(item?.quantity);
  if (!Number.isNaN(p) && !Number.isNaN(q)) return p * q;
  return 0;
}

/**
 * Resolve receipt subtotal from line items, explicit field, or sale totals.
 */
export function resolveReceiptSubtotal(receipt) {
  if (!receipt) return 0;

  const items = receipt.items || [];
  const fromLines = items.reduce((sum, item) => sum + lineItemTotal(item), 0);
  if (fromLines > 0) return fromLines;

  const explicit = Number(receipt.subtotal);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  const total = Number(receipt.total_amount ?? 0);
  const taxes = Number(receipt.taxes ?? 0);
  const shipping = Number(receipt.shipping ?? 0);
  const discount = Number(receipt.discount ?? 0);
  const derived = total - taxes - shipping + discount;
  return derived > 0 ? derived : total;
}

export function normalizeReceiptFromSale(sale, items = []) {
  if (!sale) return null;

  const mappedItems = (items.length ? items : sale.items || []).map((item) => ({
    ...item,
    description: item.description || item.name || item.product_name || item.service_name,
    product_name: item.product_name || item.name,
    service_name: item.service_name,
    price: Number(item.price ?? item.unit_price ?? 0),
    quantity: Number(item.quantity ?? 0),
    total:
      item.total != null
        ? Number(item.total)
        : Number(item.subtotal ?? 0) ||
          Number(item.price || item.unit_price || 0) * Number(item.quantity || 0),
  }));

  const normalized = {
    ...sale,
    items: mappedItems,
    taxes: Number(sale.taxes ?? 0),
    discount: Number(sale.discount ?? 0),
    shipping: Number(sale.shipping ?? 0),
    total_amount: Number(sale.total_amount ?? 0),
    create_date: sale.create_date,
    due_date: sale.due_date || sale.create_date,
    payments: Array.isArray(sale.payments) ? sale.payments : [],
  };

  return {
    ...normalized,
    subtotal: resolveReceiptSubtotal(normalized),
  };
}
