// ----------------------------------------------------------------------

function isMobileDevice() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
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
    downloadBlob(blob, fileName);
    return 'downloaded';
  }
}
