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

export function normalizeReceiptFromSale(sale, items = []) {
  if (!sale) return null;

  return {
    ...sale,
    items: items.map((item) => ({
      ...item,
      description: item.description || item.name,
      product_name: item.product_name || item.name,
      total:
        item.total != null
          ? Number(item.total)
          : Number(item.price || 0) * Number(item.quantity || 0),
    })),
    subtotal: Number(sale.subtotal ?? sale.total_amount ?? 0),
    total_amount: Number(sale.total_amount ?? 0),
    taxes: Number(sale.taxes ?? 0),
    discount: Number(sale.discount ?? 0),
    shipping: Number(sale.shipping ?? 0),
    create_date: sale.create_date,
    due_date: sale.due_date || sale.create_date,
    payments: Array.isArray(sale.payments) ? sale.payments : [],
  };
}
