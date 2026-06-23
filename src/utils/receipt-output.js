import { pdf } from '@react-pdf/renderer';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

import { buildReceiptPdfDocument } from './receipt-pdf-document';
import {
  getPreferredReceiptFormat,
  getPreferredThermalWidthMm,
} from './receipt-preferences';
import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// ----------------------------------------------------------------------

GlobalWorkerOptions.workerSrc = pdfjsWorker;

export function receiptFileLabel(receipt) {
  return receipt?.invoice_number || receipt?.invoiceNumber || receipt?.id || 'receipt';
}

export function buildReceiptShareCaption(receipt) {
  if (!receipt) return 'Receipt';
  const label = receiptFileLabel(receipt);
  const total = receipt.total_amount;
  const date = receipt.create_date;
  const parts = [`Receipt ${label}`];
  if (total != null && total !== '') {
    parts.push(fCurrency(total));
  }
  if (date) {
    parts.push(fDate(date));
  }
  return parts.join(' — ');
}

export function downloadReceiptBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Build a PDF blob from receipt data via @react-pdf/renderer.
 */
export async function buildReceiptPdfBlob({
  receipt,
  receiptFormat,
  pdfFlavor = 'pos',
  thermalWidthMm,
  currentStatus,
}) {
  const receiptDoc = buildReceiptPdfDocument({
    receipt,
    invoice: receipt,
    currentStatus: currentStatus ?? receipt?.status,
    receiptFormat: receiptFormat ?? getPreferredReceiptFormat(),
    pdfFlavor,
    thermalWidthMm: thermalWidthMm ?? getPreferredThermalWidthMm(),
  });

  if (!receiptDoc) {
    throw new Error('No receipt data available.');
  }

  return pdf(receiptDoc).toBlob();
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to convert canvas to PNG blob'));
    }, 'image/png');
  });
}

async function renderPdfPage(pdfDoc, pageNum, scale) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

/**
 * Rasterize a PDF blob to a single PNG (multi-page receipts are stitched vertically).
 */
export async function pdfBlobToPngBlob(pdfBlob, { scale = 3 } = {}) {
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const pdfDoc = await getDocument({ data: arrayBuffer }).promise;
  const pageCount = pdfDoc.numPages;
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1);
  const pageCanvases = await Promise.all(
    pageNumbers.map((pageNum) => renderPdfPage(pdfDoc, pageNum, scale))
  );

  if (pageCanvases.length === 1) {
    return canvasToPngBlob(pageCanvases[0]);
  }

  const totalWidth = Math.max(...pageCanvases.map((c) => c.width));
  const totalHeight = pageCanvases.reduce((sum, c) => sum + c.height, 0);
  const stitched = document.createElement('canvas');
  stitched.width = totalWidth;
  stitched.height = totalHeight;
  const stitchedCtx = stitched.getContext('2d');
  stitchedCtx.fillStyle = '#ffffff';
  stitchedCtx.fillRect(0, 0, totalWidth, totalHeight);

  pageCanvases.reduce((offsetY, canvas) => {
    stitchedCtx.drawImage(canvas, 0, offsetY);
    return offsetY + canvas.height;
  }, 0);

  return canvasToPngBlob(stitched);
}

/**
 * Build a receipt file as PDF, WhatsApp PNG, or legacy thermal PNG.
 */
export async function buildReceiptFile({
  receipt,
  format = 'pdf',
  receiptFormat,
  pdfFlavor = 'pos',
  thermalWidthMm,
  currentStatus,
}) {
  const label = receiptFileLabel(receipt);

  if (format === 'whatsapp') {
    const pdfBlob = await buildReceiptPdfBlob({
      receipt,
      receiptFormat: 'whatsapp',
      pdfFlavor,
      currentStatus,
    });
    const pngBlob = await pdfBlobToPngBlob(pdfBlob, { scale: 4 });
    return {
      blob: pngBlob,
      fileName: `${label}.png`,
      mimeType: 'image/png',
    };
  }

  const effectiveReceiptFormat = receiptFormat ?? getPreferredReceiptFormat();
  const pdfBlob = await buildReceiptPdfBlob({
    receipt,
    receiptFormat: effectiveReceiptFormat,
    pdfFlavor,
    thermalWidthMm,
    currentStatus,
  });

  if (format === 'png') {
    const pngBlob = await pdfBlobToPngBlob(pdfBlob, { scale: 3 });
    return {
      blob: pngBlob,
      fileName: `${label}.png`,
      mimeType: 'image/png',
    };
  }

  return {
    blob: pdfBlob,
    fileName: `${label}.pdf`,
    mimeType: 'application/pdf',
  };
}

/**
 * Share a receipt file via native share sheet, or download as fallback.
 * @returns {'shared' | 'downloaded' | 'cancelled'}
 */
export async function shareReceiptFile({
  blob,
  fileName,
  mimeType,
  title,
  text = 'Receipt',
}) {
  const file = new File([blob], fileName, { type: mimeType });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: title || fileName.replace(/\.(png|pdf)$/i, ''),
        text,
        files: [file],
      });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
      throw err;
    }
  }

  downloadReceiptBlob(blob, fileName);
  return 'downloaded';
}
