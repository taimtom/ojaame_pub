/** Display-only receipt adjustment helpers (mirrors backend transform). */

import { lineItemTotal, resolveReceiptSubtotal } from 'src/utils/escpos/receipt-from-sale';

export const SERVICE_CHARGE_DESCRIPTION = 'Service / handling';

function itemsSubtotal(receipt) {
  return (receipt?.items || []).reduce((sum, item) => sum + lineItemTotal(item), 0);
}

export function cloneReceiptLineItem(item) {
  const total = lineItemTotal(item);
  const qty = Number(item.quantity ?? 0);
  const price = Number(item.price ?? 0);
  return {
    ...item,
    key: item.id != null ? `sale-${item.id}` : `custom-${Date.now()}-${Math.random()}`,
    quantity: qty,
    price,
    total,
    original_price: price,
    original_total: total,
    description: item.description || item.product_name || item.service_name || 'Item',
    is_custom: false,
  };
}

export function createCustomDisplayLine(description = SERVICE_CHARGE_DESCRIPTION) {
  return {
    key: `custom-${Date.now()}-${Math.random()}`,
    id: null,
    product_id: null,
    service_id: null,
    product_name: null,
    service_name: null,
    quantity: 1,
    price: 0,
    total: 0,
    original_price: null,
    original_total: null,
    description,
    is_custom: true,
  };
}

/**
 * Proportionally scale purchase lines toward a target receipt total.
 */
export function suggestDisplayLines(receipt, targetTotal) {
  const actualTotal = Number(receipt?.total_amount ?? 0);
  const target = Number(targetTotal);
  if (!Number.isFinite(target) || target <= actualTotal) {
    return null;
  }

  const ratio = actualTotal > 0 ? target / actualTotal : 1;
  return (receipt.items || []).map((item) => {
    const base = cloneReceiptLineItem(item);
    const newTotal = Math.round(base.total * ratio * 100) / 100;
    const qty = base.quantity > 0 ? base.quantity : 1;
    return {
      ...base,
      total: newTotal,
      price: Math.round((newTotal / qty) * 100) / 100,
    };
  });
}

export function updateLinePrice(line, price) {
  const qty = Number(line.quantity) > 0 ? Number(line.quantity) : 1;
  const nextPrice = Math.max(0, Number(price) || 0);
  return {
    ...line,
    price: nextPrice,
    total: Math.round(nextPrice * qty * 100) / 100,
  };
}

export function updateLineTotal(line, total) {
  const qty = Number(line.quantity) > 0 ? Number(line.quantity) : 1;
  const nextTotal = Math.max(0, Number(total) || 0);
  return {
    ...line,
    total: nextTotal,
    price: Math.round((nextTotal / qty) * 100) / 100,
  };
}

export function computeDisplayAmounts(receipt, displayLines) {
  const displaySubtotal = displayLines.reduce((sum, line) => sum + lineItemTotal(line), 0);
  const actualSubtotal = itemsSubtotal(receipt);
  const ratio = actualSubtotal > 0 ? displaySubtotal / actualSubtotal : 1;

  const taxes = Number(receipt?.taxes ?? 0);
  const shipping = Number(receipt?.shipping ?? 0);
  const discount = Number(receipt?.discount ?? 0);

  const displayTaxes = taxes > 0 ? Math.round(taxes * ratio * 100) / 100 : 0;
  const displayShipping = shipping > 0 ? Math.round(shipping * ratio * 100) / 100 : 0;
  const displayDiscount = discount > 0 ? Math.round(discount * ratio * 100) / 100 : 0;
  const displayTotal =
    Math.round((displaySubtotal + displayTaxes + displayShipping - displayDiscount) * 100) / 100;

  return {
    actual_total: Number(receipt?.total_amount ?? 0),
    display_subtotal: Math.round(displaySubtotal * 100) / 100,
    display_taxes: displayTaxes,
    display_shipping: displayShipping,
    display_discount: displayDiscount,
    display_total: displayTotal,
    display_items: displayLines,
  };
}

/**
 * Build a full preview/save payload from editable display lines.
 */
export function buildDisplaySnapshot(receipt, displayLines) {
  if (!receipt || !displayLines?.length) return null;
  const snapshot = computeDisplayAmounts(receipt, displayLines);
  if (snapshot.display_total <= snapshot.actual_total) {
    return null;
  }
  return snapshot;
}

/** @deprecated Use suggestDisplayLines + buildDisplaySnapshot */
export function previewDisplayReceipt(receipt, targetTotal) {
  const lines = suggestDisplayLines(receipt, targetTotal);
  if (!lines) return null;
  return buildDisplaySnapshot(receipt, lines);
}

/**
 * Merge persisted adjustment snapshot into a receipt for print/share output.
 */
export function buildDisplayReceipt(receipt, adjustment) {
  if (!receipt || !adjustment) return receipt;

  const merged = {
    ...receipt,
    items: adjustment.display_items || receipt.items,
    subtotal: adjustment.display_subtotal ?? receipt.subtotal,
    total_amount: adjustment.display_total ?? receipt.total_amount,
    taxes: adjustment.display_taxes ?? receipt.taxes,
    discount: adjustment.display_discount ?? receipt.discount,
    shipping: adjustment.display_shipping ?? receipt.shipping,
    payments: [],
  };

  return {
    ...merged,
    subtotal: resolveReceiptSubtotal(merged),
  };
}

/**
 * Build display receipt from API adjustment summary on sale detail.
 */
export function buildDisplayReceiptFromSummary(receipt) {
  const adjustment = receipt?.receipt_display_adjustment;
  if (!adjustment) return receipt;
  return buildDisplayReceipt(receipt, adjustment);
}

/**
 * Strip UI-only fields before sending lines to the API.
 */
export function serializeDisplayItemsForApi(displayLines) {
  return displayLines.map((line) => ({
    id: line.id ?? null,
    sales_id: line.sales_id ?? null,
    product_id: line.product_id ?? null,
    service_id: line.service_id ?? null,
    product_name: line.product_name ?? null,
    service_name: line.service_name ?? null,
    quantity: Number(line.quantity ?? 1),
    price: Number(line.price ?? 0),
    total: lineItemTotal(line),
    description: line.description || 'Item',
    original_price: line.original_price ?? null,
    original_total: line.original_total ?? null,
    is_custom: Boolean(line.is_custom),
  }));
}
