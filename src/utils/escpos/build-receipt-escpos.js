import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';

import { fDate } from 'src/utils/format-time';
import { normalizeThermalWidthMm } from 'src/utils/receipt-preferences';

import { lineItemTotal } from './receipt-from-sale';
import { fCurrencyEscPos } from './format-currency-escpos';

// ----------------------------------------------------------------------

function columnsForWidth(paperWidthMm) {
  return normalizeThermalWidthMm(paperWidthMm) === 58 ? 32 : 48;
}

function itemLabel(item) {
  return item.description || item.product_name || item.service_name || 'Item';
}

function paymentMethodLabel(payment, index) {
  return (
    payment.payment_method_name ||
    payment.method_type?.replace(/_/g, ' ').toUpperCase() ||
    `Method ${index + 1}`
  );
}

function dividerLine(columns) {
  return '-'.repeat(columns);
}

// ----------------------------------------------------------------------

/**
 * Build ESC/POS bytes for a thermal receipt.
 * @param {object} receipt
 * @param {{ paperWidthMm?: 58|80, currentStatus?: string }} [options]
 * @returns {Uint8Array}
 */
export function buildReceiptEscPos(receipt, options = {}) {
  const {
    items = [],
    payments = [],
    discount = 0,
    shipping = 0,
    subtotal = 0,
    taxes = 0,
    total_amount = 0,
    invoice_number,
    customer_name,
    customer_phone,
    store_name,
    store_address,
    store_phone,
    rc_cac_reg_number,
    user_fullname,
    create_date,
    status,
  } = receipt || {};

  const currentStatus = options.currentStatus ?? status ?? '';
  const paperWidthMm = normalizeThermalWidthMm(options.paperWidthMm ?? 80);
  const columns = columnsForWidth(paperWidthMm);

  const encoder = new ReceiptPrinterEncoder({
    language: 'esc-pos',
    printerModel: 'mpt-ii',
    columns,
  });

  encoder
    .codepage('cp437')
    .align('center')
    .bold(true)
    .line(store_name || 'Your Store')
    .bold(false);

  if (store_address) encoder.line(String(store_address));
  if (store_phone) encoder.line(`Tel: ${store_phone}`);
  if (rc_cac_reg_number) encoder.line(String(rc_cac_reg_number));

  encoder
    .align('center')
    .line(dividerLine(columns))
    .bold(true)
    .line('SALES RECEIPT')
    .bold(false)
    .align('left')
    .line(`Receipt #: ${invoice_number || '—'}`)
    .line(`Date: ${create_date ? fDate(create_date) : '—'}`)
    .line(`Cashier: ${user_fullname || 'N/A'}`);

  if (customer_name && customer_name !== 'Walk In Customer') {
    encoder.line(`Customer: ${customer_name}`);
    if (customer_phone) encoder.line(`Phone: ${customer_phone}`);
  }

  encoder.line(dividerLine(columns));

  encoder
    .bold(true)
    .table(
      [
        { width: Math.floor(columns * 0.45), align: 'left' },
        { width: Math.floor(columns * 0.15), align: 'center' },
        { width: Math.floor(columns * 0.2), align: 'right' },
        { width: columns - Math.floor(columns * 0.45) - Math.floor(columns * 0.15) - Math.floor(columns * 0.2), align: 'right' },
      ],
      [
        ['Item', 'Qty', 'Price', 'Total'],
        ...items.map((item) => [
          itemLabel(item),
          String(item.quantity ?? ''),
          fCurrencyEscPos(item.price),
          fCurrencyEscPos(lineItemTotal(item)),
        ]),
      ]
    )
    .bold(false)
    .line(dividerLine(columns));

  encoder.line(`Subtotal:${' '.repeat(Math.max(1, columns - 9 - fCurrencyEscPos(subtotal).length))}${fCurrencyEscPos(subtotal)}`);

  if (Number(discount) > 0) {
    encoder.line(`Discount:${' '.repeat(Math.max(1, columns - 9 - fCurrencyEscPos(discount).length))}-${fCurrencyEscPos(discount)}`);
  }
  if (Number(taxes) > 0) {
    encoder.line(`Tax:${' '.repeat(Math.max(1, columns - 4 - fCurrencyEscPos(taxes).length))}${fCurrencyEscPos(taxes)}`);
  }
  if (Number(shipping) > 0) {
    encoder.line(`Shipping:${' '.repeat(Math.max(1, columns - 9 - fCurrencyEscPos(shipping).length))}${fCurrencyEscPos(shipping)}`);
  }

  encoder
    .bold(true)
    .line(`TOTAL:${' '.repeat(Math.max(1, columns - 6 - fCurrencyEscPos(total_amount).length))}${fCurrencyEscPos(total_amount)}`)
    .bold(false);

  if (payments.length > 0) {
    encoder.line(dividerLine(columns)).bold(true).line('PAYMENT DETAILS').bold(false);

    payments.forEach((payment, index) => {
      const label = paymentMethodLabel(payment, index);
      const amount = fCurrencyEscPos(payment.amount);
      const pad = Math.max(1, columns - label.length - amount.length);
      encoder.line(`${label}${' '.repeat(pad)}${amount}`);
    });

    const paidTotal = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const paidLabel = 'Total Paid:';
    const paidAmount = fCurrencyEscPos(paidTotal);
    encoder
      .bold(true)
      .line(`${paidLabel}${' '.repeat(Math.max(1, columns - paidLabel.length - paidAmount.length))}${paidAmount}`)
      .bold(false);

    if (paidTotal > total_amount) {
      const change = fCurrencyEscPos(paidTotal - total_amount);
      encoder.line(`Change:${' '.repeat(Math.max(1, columns - 7 - change.length))}${change}`);
    } else if (paidTotal < total_amount) {
      const balance = fCurrencyEscPos(total_amount - paidTotal);
      encoder.line(`Balance:${' '.repeat(Math.max(1, columns - 8 - balance.length))}${balance}`);
    }

    encoder.line(dividerLine(columns));
  }

  encoder
    .align('center')
    .bold(true)
    .line('THANK YOU!')
    .bold(false)
    .line('Please come again')
    .line(`Status: ${String(currentStatus).toUpperCase() || 'PAID'}`);

  if (String(currentStatus).toLowerCase() === 'credit') {
    encoder.bold(true).line('** CREDIT SALE **').bold(false);
  }

  if (invoice_number) {
    encoder.line(`||||| ${invoice_number} |||||`);
  }

  encoder.newline(2).cut();

  return encoder.encode();
}

/** Minimal receipt for printer test from settings. */
export function buildTestReceiptEscPos(paperWidthMm = 58) {
  return buildReceiptEscPos(
    {
      store_name: 'Ojaa Me',
      store_phone: 'Test print',
      invoice_number: 'TEST-001',
      create_date: new Date().toISOString(),
      user_fullname: 'Setup',
      items: [
        {
          description: 'Test item',
          quantity: 1,
          price: 1000,
          total: 1000,
        },
      ],
      subtotal: 1000,
      total_amount: 1000,
      payments: [{ payment_method_name: 'Cash', amount: 1000 }],
      status: 'paid',
    },
    { paperWidthMm, currentStatus: 'paid' }
  );
}
