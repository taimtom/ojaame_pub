import axiosInstance from 'src/utils/axios';
import { buildReceiptPdfBlob, downloadReceiptBlob } from 'src/utils/receipt-output';
import { normalizeReceiptFromSale } from 'src/utils/escpos/receipt-from-sale';
import {
  canUseBluetoothPrint,
  getBluetoothPrinterId,
  getAutoPrintBluetooth,
  getPreferredReceiptFormat,
  getPreferredThermalWidthMm,
} from 'src/utils/receipt-preferences';
import {
  isBluetoothPrintSupported,
  printReceiptViaBluetooth,
} from 'src/utils/bluetooth-printer';

// Re-export for consumers that need download/share helpers.
export { downloadReceiptBlob, shareReceiptFile } from 'src/utils/receipt-output';

// ----------------------------------------------------------------------

function isMobileDevice() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function printPdfBlobDesktop(blob) {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none';

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      iframe.remove();
      URL.revokeObjectURL(url);
    };

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(cleanup, 60_000);
        resolve();
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    iframe.onerror = () => {
      cleanup();
      reject(new Error('Failed to load print document'));
    };

    iframe.src = url;
    document.body.appendChild(iframe);
  });
}

/**
 * Print a PDF blob cross-platform.
 * Mobile: native share sheet (user can pick Print).
 * Desktop: hidden iframe print dialog.
 * Fallback: download the PDF.
 *
 * @returns {'shared' | 'printed' | 'downloaded' | 'cancelled'}
 */
export async function printReceiptBlob(blob, fileName = 'receipt.pdf') {
  const file = new File([blob], fileName, { type: 'application/pdf' });

  if (isMobileDevice() && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: fileName.replace(/\.pdf$/i, ''),
        text: 'Receipt',
        files: [file],
      });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
      throw err;
    }
  }

  try {
    await printPdfBlobDesktop(blob);
    return 'printed';
  } catch {
    downloadReceiptBlob(blob, fileName);
    return 'downloaded';
  }
}

async function printReceiptPdf({
  receipt,
  fileName,
  receiptFormat,
  thermalWidthMm,
  currentStatus,
  pdfFlavor,
}) {
  const blob = await buildReceiptPdfBlob({
    receipt,
    receiptFormat: receiptFormat ?? getPreferredReceiptFormat(),
    thermalWidthMm: thermalWidthMm ?? getPreferredThermalWidthMm(),
    currentStatus: currentStatus ?? receipt?.status,
    pdfFlavor: pdfFlavor ?? 'pos',
  });

  return printReceiptBlob(blob, fileName);
}

/**
 * Preferred print entry: Bluetooth thermal when paired, else PDF/share/print.
 * @returns {'bluetooth' | 'shared' | 'printed' | 'downloaded' | 'cancelled'}
 */
export async function printReceipt({
  receipt,
  fileName = 'receipt.pdf',
  receiptFormat,
  thermalWidthMm,
  currentStatus,
  pdfFlavor = 'pos',
  preferBluetooth = true,
}) {
  if (!receipt) {
    throw new Error('No receipt data available to print.');
  }

  const shouldTryBluetooth =
    preferBluetooth && isBluetoothPrintSupported() && canUseBluetoothPrint();

  if (shouldTryBluetooth) {
    try {
      await printReceiptViaBluetooth(receipt, {
        deviceId: getBluetoothPrinterId(),
        paperWidthMm: thermalWidthMm ?? getPreferredThermalWidthMm(),
        currentStatus: currentStatus ?? receipt?.status,
      });
      return 'bluetooth';
    } catch (err) {
      if (err?.name === 'NotFoundError') {
        return 'cancelled';
      }
      console.warn('[printReceipt] Bluetooth print failed, using PDF fallback.', err);
    }
  }

  return printReceiptPdf({
    receipt,
    fileName,
    receiptFormat,
    thermalWidthMm,
    currentStatus,
    pdfFlavor,
  });
}

/**
 * Auto-print after sale when enabled and a printer is paired.
 * @returns {{ skipped: true } | { skipped: false, result: string } | { skipped: false, error: Error }}
 */
export async function autoPrintReceiptIfEnabled({
  receipt,
  fileName = 'receipt.pdf',
  thermalWidthMm,
  currentStatus,
}) {
  if (!getAutoPrintBluetooth() || !canUseBluetoothPrint() || !receipt) {
    return { skipped: true };
  }

  try {
    const result = await printReceipt({
      receipt,
      fileName,
      thermalWidthMm,
      currentStatus,
      preferBluetooth: true,
    });
    return { skipped: false, result };
  } catch (err) {
    console.warn('[autoPrintReceiptIfEnabled] failed', err);
    return { skipped: false, error: err };
  }
}

export async function autoPrintSaleReceipt({
  storeId,
  saleId,
  fallbackSale,
  fallbackItems = [],
}) {
  let receipt = null;

  if (storeId && saleId) {
    try {
      const { data } = await axiosInstance.get(`/api/sales/detail/${storeId}/${saleId}/`);
      receipt = data;
    } catch {
      receipt = null;
    }
  }

  if (!receipt && fallbackSale) {
    receipt = normalizeReceiptFromSale(fallbackSale, fallbackItems);
  }

  if (!receipt) {
    return { skipped: true };
  }

  return autoPrintReceiptIfEnabled({
    receipt,
    fileName: `${receipt.invoice_number || `sale-${saleId || 'receipt'}`}.pdf`,
    currentStatus: receipt.status,
  });
}

export function getPrintResultMessage(result) {
  switch (result) {
    case 'bluetooth':
      return 'Receipt sent to Bluetooth printer.';
    case 'downloaded':
      return 'Print preview unavailable. Receipt PDF downloaded — open it to print.';
    case 'shared':
      return 'Choose Print from the share menu to send to your printer.';
    default:
      return null;
  }
}
