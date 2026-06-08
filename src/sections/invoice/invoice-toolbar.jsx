import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PDFViewer, PDFDownloadLink, pdf } from '@react-pdf/renderer';

import { buildReceiptPdfDocument } from 'src/utils/receipt-pdf-document';
import { getPreferredThermalWidthMm } from 'src/utils/receipt-preferences';
import { printReceiptBlob } from 'src/utils/print-receipt';
import html2canvas from 'html2canvas';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import NoSsr from '@mui/material/NoSsr';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { paramCase } from 'src/utils/change-case';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

function invoiceFileLabel(invoice) {
  return invoice?.invoice_number || invoice?.invoiceNumber || invoice?.id || 'invoice';
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header?.match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] || 'image/png';
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function withTimeout(promise, ms) {
  let timeoutId;
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve({ __timeout: true }), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

async function waitForCaptureAssets(rootEl) {
  // Wait for fonts (helps with intermittent missing/blank text)
  if (document?.fonts?.ready) {
    await withTimeout(document.fonts.ready, 8000);
  }

  // Wait for images inside the capture area
  const images = Array.from(rootEl.querySelectorAll('img'));
  if (!images.length) return;

  await withTimeout(
    Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) return resolve();
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
            return undefined;
          })
      )
    ),
    8000
  );
}


// Helper function to get storeSlug from either props, URL params or localStorage
function getStoreSlug(propStoreSlug, storeParam) {
  let storeSlug = propStoreSlug || storeParam;
  if (!storeSlug) {
    const activeWorkspaceJson = localStorage.getItem('activeWorkspace');
    if (activeWorkspaceJson) {
      try {
        const activeWorkspace = JSON.parse(activeWorkspaceJson);
        if (activeWorkspace && activeWorkspace.storeName && activeWorkspace.id) {
          storeSlug = `${paramCase(activeWorkspace.storeName)}-${activeWorkspace.id}`;
        } else {
          storeSlug = 'default-store';
        }
      } catch (error) {
        storeSlug = 'default-store';
      }
    } else {
      storeSlug = 'default-store';
    }
  }
  return storeSlug;
}

export function InvoiceToolbar({
  invoice,
  currentStatus,
  statusOptions,
  onChangeStatus,
  shareCaptureRef,
  storeSlug: propStoreSlug,
  /** 'thermal' | 'a4' — default A4 for dashboard invoice list; POS receipt passes thermal by default. */
  receiptFormat = 'a4',
  /** 'pos' uses A4ReceiptPDF for A4; 'invoice' keeps classic InvoicePDF for A4. */
  pdfFlavor = 'invoice',
}) {
  const router = useRouter();
  const { storeParam } = useParams();
  const storeSlug = getStoreSlug(propStoreSlug, storeParam);

  const view = useBoolean();
  const [shareLoading, setShareLoading] = useState(false);
  const [readyShareFile, setReadyShareFile] = useState(null);
  const [sharePreviewOpen, setSharePreviewOpen] = useState(false);

  const sharePreviewUrl = useMemo(
    () => (readyShareFile ? URL.createObjectURL(readyShareFile) : null),
    [readyShareFile]
  );

  useEffect(() => {
    if (!sharePreviewUrl) return undefined;
    return () => URL.revokeObjectURL(sharePreviewUrl);
  }, [sharePreviewUrl]);

  const closeSharePreview = useCallback(() => {
    setSharePreviewOpen(false);
    setReadyShareFile(null);
  }, []);

  const getReceiptPdfDocument = useCallback(() => (
    buildReceiptPdfDocument({
      invoice,
      currentStatus,
      receiptFormat,
      pdfFlavor,
      thermalWidthMm: getPreferredThermalWidthMm(),
    })
  ), [invoice, currentStatus, receiptFormat, pdfFlavor]);

  useEffect(() => {
    setReadyShareFile(null);
  }, [invoice?.id, receiptFormat]);

  const handleEdit = useCallback(() => {
    // Use the computed storeSlug and invoice id to navigate to the edit page
    router.push(paths.dashboard.pos.edit(storeSlug, invoice?.id));
  }, [invoice?.id, router, storeSlug]);

  const handlePrint = useCallback(async () => {
    if (!invoice) {
      toast.error('No invoice data available to print.');
      return;
    }

    try {
      const invoiceDocument = getReceiptPdfDocument();
      if (!invoiceDocument) {
        toast.error('No invoice data available to print.');
        return;
      }

      const fileName = `${invoiceFileLabel(invoice)}.pdf`;
      const blob = await pdf(invoiceDocument).toBlob();
      const result = await printReceiptBlob(blob, fileName);

      if (result === 'downloaded') {
        toast.info('Print preview unavailable. Receipt PDF downloaded — open it to print.');
      } else if (result === 'shared') {
        toast.info('Choose Print from the share menu to send to your printer.');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        toast.error('Failed to prepare invoice for printing.');
      }
    }
  }, [invoice, getReceiptPdfDocument]);

  const handleShareNow = useCallback(async () => {
    if (!readyShareFile) return;

    try {
      if (navigator.share && navigator.canShare?.({ files: [readyShareFile] })) {
        await navigator.share({
          title: readyShareFile.name.replace(/\.(png|pdf)$/i, ''),
          text: receiptFormat === 'thermal' ? 'Receipt' : 'Invoice',
          files: [readyShareFile],
        });
        closeSharePreview();
        return;
      }

      const downloadUrl = URL.createObjectURL(readyShareFile);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = readyShareFile.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);
      toast.info('Direct sharing is unavailable on this browser. File downloaded.');
      closeSharePreview();
    } catch (error) {
      if (error?.name !== 'AbortError') {
        // eslint-disable-next-line no-console
        console.error('Share file failed:', error);
        toast.error('Sharing was blocked by the browser. Try again.');
      }
    }
  }, [closeSharePreview, readyShareFile, receiptFormat]);

  const handleShare = useCallback(async () => {
    if (shareLoading) return;

    if (!invoice) {
      toast.error('No invoice data available to share.');
      return;
    }

    // If already generated, just open the preview modal.
    if (readyShareFile) {
      setSharePreviewOpen(true);
      return;
    }

    const invoiceLabel = invoiceFileLabel(invoice);

    try {
      setShareLoading(true);

      // Prefer PDF (thermal or A4): full line items, prices, and totals on mobile share targets.
      try {
        const pdfDoc = getReceiptPdfDocument();
        if (pdfDoc) {
          const pdfBlob = await pdf(pdfDoc).toBlob();
          const pdfFile = new File([pdfBlob], `${invoiceLabel}.pdf`, { type: 'application/pdf' });

          if (navigator.share && navigator.canShare?.({ files: [pdfFile] })) {
            setReadyShareFile(pdfFile);
            setSharePreviewOpen(true);
            return;
          }

          const downloadUrl = URL.createObjectURL(pdfBlob);
          const anchor = document.createElement('a');
          anchor.href = downloadUrl;
          anchor.download = `${invoiceLabel}.pdf`;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          URL.revokeObjectURL(downloadUrl);
          toast.info('PDF downloaded — attach it from your files if share is not supported.');
          return;
        }
      } catch (pdfError) {
        // eslint-disable-next-line no-console
        console.error('Share PDF generation failed, falling back to image:', pdfError);
      }

      const captureElement = shareCaptureRef?.current;
      if (!captureElement) {
        toast.error('Invoice preview not ready for sharing.');
        return;
      }

      await waitForCaptureAssets(captureElement);

      const el = captureElement;
      const fullWidth = Math.max(el.scrollWidth, el.offsetWidth);
      const fullHeight = Math.max(el.scrollHeight, el.offsetHeight);

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
        backgroundColor: '#ffffff',
        imageTimeout: 15000,
        width: fullWidth,
        height: fullHeight,
        windowWidth: fullWidth,
        windowHeight: fullHeight,
      });

      const blobFromToBlob = await new Promise((resolve) => {
        canvas.toBlob((blobValue) => resolve(blobValue), 'image/png');
      });

      let blob = blobFromToBlob;
      if (!blob) {
        // If toBlob fails (can be intermittent), fall back to toDataURL.
        blob = dataUrlToBlob(canvas.toDataURL('image/png'));
      }

      if (!blob) {
        toast.error('Could not generate invoice image for sharing.');
        return;
      }

      const imageFile = new File([blob], `${invoiceLabel}.png`, { type: 'image/png' });

      // Some browsers require share() to be called immediately on click.
      // Cache the file and ask the user to share from a second gesture (modal button).
      if (navigator.share && navigator.canShare?.({ files: [imageFile] })) {
        setReadyShareFile(imageFile);
        setSharePreviewOpen(true);
        return;
      }

      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `${invoiceLabel}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);

      toast.info('Direct image sharing is unavailable on this browser. Invoice image downloaded.');
    } catch (error) {
      // AbortError occurs when the user cancels native share; avoid noisy error toast.
      if (error?.name !== 'AbortError') {
        // Log helps debug tainted canvas / memory errors without surfacing details to users
        // eslint-disable-next-line no-console
        console.error('Invoice share-as-image failed:', error);
        toast.error('Could not generate invoice image for sharing.');
      }
    } finally {
      setShareLoading(false);
    }
  }, [invoice, readyShareFile, shareCaptureRef, shareLoading, getReceiptPdfDocument]);

  const renderDownload = (
    <NoSsr>
      <PDFDownloadLink
        document={invoice ? getReceiptPdfDocument() : <span />}
        fileName={`${receiptFormat}-${invoiceFileLabel(invoice)}.pdf`}
        style={{ textDecoration: 'none' }}
      >
        {({ loading }) => (
          <Tooltip title="Download">
            <IconButton>
              {loading ? <CircularProgress size={24} color="inherit" /> : <Iconify icon="eva:cloud-download-fill" />}
            </IconButton>
          </Tooltip>
        )}
      </PDFDownloadLink>
    </NoSsr>
  );

  return (
    <>
      <Stack
        spacing={3}
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-end', sm: 'center' }}
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        <Stack direction="row" spacing={1} flexGrow={1} sx={{ width: 1 }}>
          <Tooltip title="Edit">
            <IconButton onClick={handleEdit}>
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          </Tooltip>

          <Tooltip title="View">
            <IconButton onClick={view.onTrue}>
              <Iconify icon="solar:eye-bold" />
            </IconButton>
          </Tooltip>

          {renderDownload}

          <Tooltip title="Print">
            <IconButton onClick={handlePrint}>
              <Iconify icon="solar:printer-minimalistic-bold" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Send">
            <IconButton>
              <Iconify icon="iconamoon:send-fill" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Share">
            <IconButton onClick={handleShare} disabled={shareLoading}>
              {shareLoading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                <Iconify icon="solar:share-bold" />
              )}
            </IconButton>
          </Tooltip>
        </Stack>

        <TextField
          fullWidth
          select
          label="Status"
          value={currentStatus}
          onChange={onChangeStatus}
          inputProps={{ id: 'status-select-label' }}
          InputLabelProps={{ htmlFor: 'status-select-label' }}
          sx={{ maxWidth: 160 }}
        >
          {statusOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Dialog fullScreen open={view.value}>
        <Box sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
          <DialogActions sx={{ p: 1.5 }}>
            <Button color="inherit" variant="contained" onClick={view.onFalse}>
              Close
            </Button>
          </DialogActions>

          <Box sx={{ flexGrow: 1, height: 1, overflow: 'hidden' }}>
            <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
              {invoice && getReceiptPdfDocument()}
            </PDFViewer>
          </Box>
        </Box>
      </Dialog>

      <Dialog open={sharePreviewOpen} onClose={closeSharePreview} maxWidth="sm" fullWidth>
        <DialogTitle>
          {readyShareFile?.type === 'application/pdf' ? 'Share receipt PDF' : 'Share invoice image'}
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {sharePreviewUrl ? (
            readyShareFile?.type === 'application/pdf' ? (
              <Box
                component="iframe"
                title="Receipt PDF preview"
                src={sharePreviewUrl}
                sx={{
                  width: 1,
                  height: { xs: 360, sm: 480 },
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                }}
              />
            ) : (
              <Box
                component="img"
                alt="Invoice preview"
                src={sharePreviewUrl}
                sx={{
                  width: 1,
                  height: 'auto',
                  borderRadius: 1,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              />
            )
          ) : (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
              Preview not available
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button color="inherit" onClick={closeSharePreview}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleShareNow} disabled={!readyShareFile}>
            Share now
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
