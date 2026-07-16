import { normalizeReceiptFromSale } from './receipt-from-sale';

// ----------------------------------------------------------------------

function sumConsumables(consumables = []) {
  return consumables.reduce((sum, row) => {
    const qty = Number(row.quantity_used) || 0;
    const unitPrice = Number(row.unit_price) || 0;
    const lineTotal = Number(row.line_total);
    return sum + (Number.isFinite(lineTotal) && row.line_total != null ? lineTotal : unitPrice * qty);
  }, 0);
}

function sumExpenses(expenses = []) {
  return expenses.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
}

function sumServices(services = []) {
  return services.reduce((sum, row) => {
    const qty = Number(row.quantity) || 1;
    const unit = Number(row.unit_price) || 0;
    const lineTotal = Number(row.line_total);
    return sum + (Number.isFinite(lineTotal) && row.line_total != null ? lineTotal : unit * qty);
  }, 0);
}

/**
 * Resolve base service fee when API omits `base_service_price`.
 */
export function resolveServiceLogBreakdown(log) {
  if (!log) {
    return {
      baseServicePrice: 0,
      productsTotal: 0,
      expensesTotal: 0,
      servicePrice: 0,
    };
  }

  const productsTotal =
    log.products_total != null && Number.isFinite(Number(log.products_total))
      ? Number(log.products_total)
      : sumConsumables(log.consumables);

  const expensesTotal =
    log.expenses_total != null && Number.isFinite(Number(log.expenses_total))
      ? Number(log.expenses_total)
      : sumExpenses(log.expenses);

  const servicePrice = Number(log.service_price) || 0;

  let baseServicePrice;
  if (Array.isArray(log.services) && log.services.length) {
    baseServicePrice = sumServices(log.services);
  } else if (log.base_service_price != null && Number.isFinite(Number(log.base_service_price))) {
    baseServicePrice = Number(log.base_service_price);
  } else {
    baseServicePrice = servicePrice - productsTotal - expensesTotal;
  }

  if (!Number.isFinite(baseServicePrice) || baseServicePrice < 0) {
    baseServicePrice = Math.max(0, servicePrice - productsTotal - expensesTotal);
  }

  return {
    baseServicePrice,
    productsTotal,
    expensesTotal,
    servicePrice,
  };
}

/**
 * Build receipt line items from a service log (services + products used + expenses).
 */
export function buildServiceLogReceiptItems(log) {
  if (!log) return [];

  const items = [];
  const serviceLines =
    Array.isArray(log.services) && log.services.length
      ? log.services
      : [
          {
            service_id: log.service_id,
            service_name: log.service_name || 'Service',
            unit_price: resolveServiceLogBreakdown(log).baseServicePrice,
            quantity: 1,
          },
        ];

  serviceLines.forEach((row) => {
    const qty = Number(row.quantity) || 1;
    const unit = Number(row.unit_price) || 0;
    const lineTotal =
      row.line_total != null && Number.isFinite(Number(row.line_total))
        ? Number(row.line_total)
        : unit * qty;
    items.push({
      service_id: row.service_id,
      service_name: row.service_name || log.service_name || 'Service',
      description: 'Service fee',
      quantity: qty,
      price: unit,
      total: lineTotal,
      line_type: 'service',
    });
  });

  (log.consumables || []).forEach((row) => {
    const qty = Number(row.quantity_used) || 0;
    const unitPrice = Number(row.unit_price) || 0;
    const persisted = Number(row.line_total);
    const lineTotal =
      Number.isFinite(persisted) && row.line_total != null ? persisted : unitPrice * qty;
    if (qty <= 0) return;
    items.push({
      product_id: row.product_id,
      product_name: row.product_name || 'Product',
      description: 'Product used',
      quantity: qty,
      price: unitPrice,
      total: lineTotal,
      line_type: 'product',
    });
  });

  (log.expenses || []).forEach((row) => {
    const amount = Number(row.amount) || 0;
    if (amount <= 0) return;
    const label = row.description?.trim() || row.category || 'Expense';
    items.push({
      description: label,
      product_name: `Expense · ${label}`,
      quantity: 1,
      price: amount,
      total: amount,
      line_type: 'expense',
    });
  });

  return items;
}

/**
 * Normalize a service log into a receipt object for print/share/PDF.
 */
export function normalizeReceiptFromServiceLog(log, storeContext = {}) {
  if (!log) return null;

  const items = buildServiceLogReceiptItems(log);
  const { servicePrice } = resolveServiceLogBreakdown(log);

  const saleLike = {
    id: log.sale_id || log.id,
    store_id: log.store_id,
    invoice_number: log.log_number || `SL-${log.id}`,
    status: log.sale_status || (log.status === 'billed' ? 'paid' : log.status || 'logged'),
    create_date: log.created_at,
    due_date: log.created_at,
    total_amount: servicePrice,
    taxes: 0,
    discount: 0,
    shipping: 0,
    invoiceTo: {
      name: log.customer_name || 'Walk-in customer',
    },
    invoiceFrom: {
      name: storeContext.storeName || storeContext.name || 'Store',
      address: storeContext.address || storeContext.storeAddress || '',
      phone: storeContext.phone || storeContext.phoneNumber || '',
    },
    served_by: log.performed_by_name,
    performed_by_name: log.performed_by_name,
    notes: log.notes,
    payments: log.payments || [],
    amount_paid: log.amount_paid,
    balance_due: log.balance_due,
  };

  return normalizeReceiptFromSale(saleLike, items);
}
