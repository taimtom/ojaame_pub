/**
 * Resolves display quantity for a sale line. When `quantity` is missing or ~0 but
 * `total` and `price` imply a fractional amount (e.g. legacy int truncation), uses total/price.
 */
export function effectiveSaleLineQuantity(row) {
  if (!row) return 0;
  const rawQ = row.quantity;
  const q = typeof rawQ === 'number' && !Number.isNaN(rawQ) ? rawQ : Number(rawQ);
  const t = Number(row.total);
  const p = Number(row.price);
  if (Number.isFinite(p) && p > 0 && Number.isFinite(t) && Math.abs(t) > 1e-9) {
    if (!Number.isFinite(q) || Math.abs(q) < 1e-9) {
      return t / p;
    }
  }
  return Number.isFinite(q) ? q : 0;
}

/** Human-readable qty for tables (keeps decimals, trims float noise). */
export function formatSaleQtyDisplay(q) {
  const n = Number(q);
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) < 1e-9) return '0';
  if (Number.isInteger(n)) return String(n);
  return String(parseFloat(n.toPrecision(12)));
}
