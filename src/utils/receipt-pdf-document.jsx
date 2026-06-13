import { InvoicePDF } from 'src/sections/invoice/invoice-pdf';
import { A4ReceiptPDF } from 'src/sections/pos/receipt-a4';
import { ThermalReceiptPDF } from 'src/sections/pos/receipt-thermal';

import {
  getPreferredThermalWidthMm,
  normalizeThermalWidthMm,
} from './receipt-preferences';

// ----------------------------------------------------------------------

/**
 * Build the @react-pdf document element for a receipt or invoice.
 */
export function buildReceiptPdfDocument({
  receipt,
  invoice,
  currentStatus,
  receiptFormat = 'thermal',
  pdfFlavor = 'pos',
  thermalWidthMm,
}) {
  const data = receipt || invoice;
  if (!data) return null;

  const status = currentStatus ?? data?.status ?? '';

  if (receiptFormat === 'thermal') {
    const widthMm = normalizeThermalWidthMm(thermalWidthMm ?? getPreferredThermalWidthMm());
    return (
      <ThermalReceiptPDF receipt={data} currentStatus={status} paperWidthMm={widthMm} />
    );
  }

  if (pdfFlavor === 'pos') {
    return <A4ReceiptPDF receipt={data} currentStatus={status} />;
  }

  return <InvoicePDF invoice={data} currentStatus={status} />;
}
