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

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { A4ReceiptPDF } from '../receipt-a4';
import { InvoicePDF } from '../../invoice/invoice-pdf';
import { ThermalReceiptPDF } from '../receipt-thermal';
import { InvoiceDetails } from '../../invoice/invoice-details';

// ----------------------------------------------------------------------

export function ReceiptView({ receipt, receiptLoading, receiptError, storeSlug, storeNameSlug, storeId }) {
  const router = useRouter();
  const view = useBoolean();
  const [receiptFormat, setReceiptFormat] = useState('a4'); // 'a4' or 'thermal'

  const handleBackToSales = useCallback(() => {
    router.push(paths.dashboard.pos.root(storeSlug));
  }, [router, storeSlug]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleFormatChange = (event, newFormat) => {
    if (newFormat !== null) {
      setReceiptFormat(newFormat);
    }
  };

  // Get the appropriate PDF component based on format
  const getPDFComponent = () => {
    if (!receipt) return <span />;

    switch (receiptFormat) {
      case 'thermal':
        return <ThermalReceiptPDF receipt={receipt} currentStatus={receipt?.status} />;
      case 'a4':
        return <A4ReceiptPDF receipt={receipt} currentStatus={receipt?.status} />;
      default:
        return <InvoicePDF invoice={receipt} currentStatus={receipt?.status} />;
    }
  };

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

            {/* Format Selection */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Receipt Format:
                </Typography>
                <ToggleButtonGroup
                  value={receiptFormat}
                  exclusive
                  onChange={handleFormatChange}
                  size="small"
                >
                  <ToggleButton value="a4">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="mdi:file-pdf-box" />
                      <span>A4 Paper</span>
                    </Stack>
                  </ToggleButton>
                  <ToggleButton value="thermal">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="mdi:receipt" />
                      <span>80mm Thermal</span>
                    </Stack>
                  </ToggleButton>
                </ToggleButtonGroup>
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
                  startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
                  onClick={handlePrint}
                >
                  Print
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
        <InvoiceDetails invoice={receipt} />
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

