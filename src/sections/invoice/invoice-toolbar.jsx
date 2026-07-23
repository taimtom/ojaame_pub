import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';

import { buildReceiptPdfDocument } from 'src/utils/receipt-pdf-document';
import { getPreferredThermalWidthMm } from 'src/utils/receipt-preferences';
import { getPrintResultMessage, printReceipt } from 'src/utils/print-receipt';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import NoSsr from '@mui/material/NoSsr';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { paramCase } from 'src/utils/change-case';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { ReceiptShareDialog } from 'src/components/receipt/receipt-share-dialog';
import { ReceiptOutputFlowDialogs } from 'src/components/receipt/receipt-output-flow-dialogs';
import { useReceiptOutputFlow } from 'src/hooks/use-receipt-output-flow';

function invoiceFileLabel(invoice) {
  return invoice?.invoice_number || invoice?.invoiceNumber || invoice?.id || 'invoice';
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
  const shareDialog = useBoolean();
  const [shareReceipt, setShareReceipt] = useState(null);
  const { runWithReceiptOutput, activeReceipt, dialogs } = useReceiptOutputFlow({
    storeId: invoice?.store_id,
  });

  const getReceiptPdfDocument = useCallback(() => (
    buildReceiptPdfDocument({
      invoice,
      currentStatus,
      receiptFormat,
      pdfFlavor,
      thermalWidthMm: getPreferredThermalWidthMm(),
    })
  ), [invoice, currentStatus, receiptFormat, pdfFlavor]);

  const handleEdit = useCallback(() => {
    router.push(paths.dashboard.pos.edit(storeSlug, invoice?.id));
  }, [invoice?.id, router, storeSlug]);

  const handlePrint = useCallback(async () => {
    if (!invoice) {
      toast.error('No invoice data available to print.');
      return;
    }

    runWithReceiptOutput(invoice, async (outputReceipt) => {
      try {
        const fileName = `${invoiceFileLabel(outputReceipt)}.pdf`;
        const result = await printReceipt({
          receipt: outputReceipt,
          fileName,
          receiptFormat,
          thermalWidthMm: getPreferredThermalWidthMm(),
          currentStatus,
          pdfFlavor,
          preferBluetooth: receiptFormat === 'thermal',
        });

        const message = getPrintResultMessage(result);
        if (message) {
          toast.info(message);
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          toast.error('Failed to prepare invoice for printing.');
        }
      }
    });
  }, [invoice, receiptFormat, currentStatus, pdfFlavor, runWithReceiptOutput]);

  const handleShare = useCallback(() => {
    if (!invoice) {
      toast.error('No invoice data available to share.');
      return;
    }

    runWithReceiptOutput(invoice, (outputReceipt) => {
      setShareReceipt(outputReceipt);
      shareDialog.onTrue();
    });
  }, [invoice, shareDialog, runWithReceiptOutput]);

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
            <IconButton onClick={handleShare}>
              <Iconify icon="solar:share-bold" />
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

      <ReceiptShareDialog
        open={shareDialog.value}
        onClose={() => {
          shareDialog.onFalse();
          setShareReceipt(null);
        }}
        receipt={shareReceipt || invoice}
        receiptFormat={receiptFormat}
        pdfFlavor={pdfFlavor}
        thermalWidthMm={getPreferredThermalWidthMm()}
        currentStatus={currentStatus}
        shareText={receiptFormat === 'thermal' ? 'Receipt' : 'Invoice'}
      />

      <ReceiptOutputFlowDialogs
        receipt={activeReceipt || invoice}
        storeId={invoice?.store_id}
        dialogs={dialogs}
      />
    </>
  );
}
