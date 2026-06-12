import { useState, useCallback } from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import NoSsr from '@mui/material/NoSsr';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useBluetoothPrinter } from 'src/hooks/use-bluetooth-printer';

import { buildReceiptPdfDocument } from 'src/utils/receipt-pdf-document';
import { printReceipt, getPrintResultMessage } from 'src/utils/print-receipt';
import {
  normalizeThermalWidthMm,
  getPreferredReceiptFormat,
  setPreferredReceiptFormat,
  getPreferredThermalWidthMm,
  setPreferredThermalWidthMm,
} from 'src/utils/receipt-preferences';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InvoiceDetails } from '../../invoice/invoice-details';

// ----------------------------------------------------------------------

export function ReceiptView({ receipt, receiptLoading, receiptError, storeSlug, storeNameSlug, storeId }) {
  const router = useRouter();
  const view = useBoolean();
  const [receiptFormat, setReceiptFormat] = useState(() => getPreferredReceiptFormat());
  const [thermalWidthMm, setThermalWidthMm] = useState(() => getPreferredThermalWidthMm());
  const [printLoading, setPrintLoading] = useState(false);
  const {
    isSupported: bluetoothSupported,
    isPaired: bluetoothPaired,
    printerName,
    pair: pairBluetoothPrinter,
    status: bluetoothStatus,
  } = useBluetoothPrinter();

  const handleBackToSales = useCallback(() => {
    router.push(paths.dashboard.pos.root(storeSlug));
  }, [router, storeSlug]);

  const handlePairPrinter = useCallback(async () => {
    try {
      const paired = await pairBluetoothPrinter();
      toast.success(`Paired with ${paired.name}`);
    } catch (err) {
      if (err?.name === 'NotFoundError') return;
      toast.error(err?.message || 'Could not pair Bluetooth printer.');
    }
  }, [pairBluetoothPrinter]);

  const handlePrint = useCallback(async () => {
    if (!receipt || printLoading) return;

    setPrintLoading(true);
    try {
      const fileName = `receipt-${receipt?.invoice_number || 'unknown'}.pdf`;
      const result = await printReceipt({
        receipt,
        fileName,
        receiptFormat,
        thermalWidthMm,
        currentStatus: receipt?.status,
        pdfFlavor: 'pos',
      });

      const message = getPrintResultMessage(result);
      if (message) {
        toast.info(message);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        toast.error('Failed to prepare receipt for printing.');
      }
    } finally {
      setPrintLoading(false);
    }
  }, [receipt, printLoading, receiptFormat, thermalWidthMm]);

  const handleFormatChange = (event, newFormat) => {
    if (newFormat !== null) {
      setReceiptFormat(newFormat);
      setPreferredReceiptFormat(newFormat);
    }
  };

  const handleThermalWidthChange = (event, newWidth) => {
    if (newWidth !== null) {
      const width = normalizeThermalWidthMm(newWidth);
      setThermalWidthMm(width);
      setPreferredThermalWidthMm(width);
    }
  };

  const getPDFComponent = () => (
    buildReceiptPdfDocument({
      receipt,
      currentStatus: receipt?.status,
      receiptFormat,
      pdfFlavor: 'pos',
      thermalWidthMm,
    }) || <span />
  );

  // Get status color for visual feedback
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'success';
      case 'credit': return 'warning';
      case 'draft': return 'default';
      default: return 'primary';
    }
  };

  const renderDownload = (
    <NoSsr>
      <PDFDownloadLink
        document={getPDFComponent()}
        fileName={`receipt-${receiptFormat}-${receipt?.invoice_number || 'unknown'}.pdf`}
        style={{ textDecoration: 'none' }}
      >
        {({ loading }) => (
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Iconify icon="eva:cloud-download-fill" />}
            disabled={loading}
          >
            {loading ? 'Generating...' : `Download ${receiptFormat.toUpperCase()} PDF`}
          </Button>
        )}
      </PDFDownloadLink>
    </NoSsr>
  );

  if (receiptLoading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              Loading receipt...
            </Typography>
          </Stack>
        </Box>
      </DashboardContent>
    );
  }

  if (receiptError || !receipt) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Receipt"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Point of Sales', href: paths.dashboard.pos.root(storeSlug) },
            { name: 'Receipt' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Error Loading Receipt
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {receiptError || 'Receipt not found'}
          </Typography>
          <Button variant="contained" onClick={handleBackToSales}>
            Back to Point of Sales
          </Button>
        </Card>
      </DashboardContent>
    );
  }

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={`Receipt #${receipt?.invoice_number || 'Unknown'}`}
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Point of Sales', href: paths.dashboard.pos.root(storeSlug) },
            { name: 'Receipt' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        {/* Receipt Status and Actions */}
        <Card sx={{ p: 3, mb: 3 }}>
          <Stack spacing={3}>
            {/* Status Display */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h5" color="primary">
                Sales Receipt Generated Successfully!
              </Typography>
              <Chip
                label={receipt?.status?.toUpperCase() || 'UNKNOWN'}
                color={getStatusColor(receipt?.status)}
                variant="filled"
                size="large"
                sx={{ fontWeight: 'bold' }}
              />
            </Stack>

            {bluetoothSupported && (
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                <Chip
                  size="small"
                  variant="outlined"
                  color={bluetoothPaired ? 'success' : 'default'}
                  icon={<Iconify icon="mdi:bluetooth" width={16} />}
                  label={
                    bluetoothPaired
                      ? `Bluetooth printer: ${printerName || 'Connected'}`
                      : 'Bluetooth printer not paired'
                  }
                />
                {!bluetoothPaired && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={handlePairPrinter}
                    disabled={bluetoothStatus === 'connecting'}
                  >
                    Pair printer
                  </Button>
                )}
              </Stack>
            )}

            {/* Format Selection */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Receipt format (print, download, share):
                </Typography>
                <Stack direction="row" flexWrap="wrap" alignItems="center" spacing={1}>
                  <ToggleButtonGroup
                    value={receiptFormat}
                    exclusive
                    onChange={handleFormatChange}
                    size="small"
                  >
                    <ToggleButton value="thermal">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify icon="mdi:receipt" />
                        <span>Thermal</span>
                      </Stack>
                    </ToggleButton>
                    <ToggleButton value="a4">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify icon="mdi:file-pdf-box" />
                        <span>A4 Paper</span>
                      </Stack>
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {receiptFormat === 'thermal' && (
                    <ToggleButtonGroup
                      value={thermalWidthMm}
                      exclusive
                      onChange={handleThermalWidthChange}
                      size="small"
                    >
                      <ToggleButton value={80}>80mm</ToggleButton>
                      <ToggleButton value={58}>58mm</ToggleButton>
                    </ToggleButtonGroup>
                  )}
                </Stack>
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="eva:arrow-back-fill" />}
                  onClick={handleBackToSales}
                >
                  New Transaction
                </Button>

                <Button
                  variant="outlined"
                  startIcon={
                    printLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <Iconify icon="solar:printer-minimalistic-bold" />
                    )
                  }
                  onClick={handlePrint}
                  disabled={printLoading}
                >
                  {printLoading ? 'Preparing…' : 'Print'}
                </Button>

                <Tooltip title="View PDF">
                  <IconButton onClick={view.onTrue}>
                    <Iconify icon="solar:eye-bold" />
                  </IconButton>
                </Tooltip>

                {renderDownload}
              </Stack>
            </Stack>

            {/* Credit Sale Warning */}
            {receipt?.status === 'credit' && (
              <Box sx={{ p: 2, bgcolor: 'warning.lighter', borderRadius: 1, border: 1, borderColor: 'warning.main' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify icon="eva:alert-triangle-fill" color="warning.main" />
                  <Typography variant="subtitle2" color="warning.dark">
                    Credit Sale - Payment is still pending for this transaction
                  </Typography>
                </Stack>
              </Box>
            )}
          </Stack>
        </Card>

        {/* Receipt Details */}
        <InvoiceDetails invoice={receipt} receiptFormat={receiptFormat} pdfFlavor="pos" />
      </DashboardContent>

      {/* PDF Preview Dialog */}
      <Dialog fullScreen open={view.value}>
        <Box sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
          <DialogActions sx={{ p: 1.5 }}>
            <Button color="inherit" variant="contained" onClick={view.onFalse}>
              Close
            </Button>
          </DialogActions>

          <Box sx={{ flexGrow: 1, height: 1, overflow: 'hidden' }}>
            <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
              {getPDFComponent()}
            </PDFViewer>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}

