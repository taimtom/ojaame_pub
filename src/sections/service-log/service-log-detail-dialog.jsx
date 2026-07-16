import PropTypes from 'prop-types';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { useReceiptOutputFlow } from 'src/hooks/use-receipt-output-flow';

import axiosInstance from 'src/utils/axios';
import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';
import { getPreferredThermalWidthMm } from 'src/utils/receipt-preferences';
import { printReceipt, getPrintResultMessage } from 'src/utils/print-receipt';
import { resolveServiceLogBreakdown, buildServiceLogReceiptItems, normalizeReceiptFromServiceLog } from 'src/utils/escpos/receipt-from-service-log';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ReceiptShareDialog } from 'src/components/receipt/receipt-share-dialog';
import { ReceiptOutputFlowDialogs } from 'src/components/receipt/receipt-output-flow-dialogs';

function lineTotal(row) {
  if (row.total != null) return Number(row.total) || 0;
  return (Number(row.price) || 0) * (Number(row.quantity) || 0);
}

function getStoreContextFromStorage() {
  try {
    const raw = localStorage.getItem('activeWorkspace');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function ServiceLogDetailDialog({
  open,
  logId,
  storeId,
  onClose,
  initialLog = null,
  openShareOnLoad = false,
}) {
  const [log, setLog] = useState(initialLog);
  const [loading, setLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareReceipt, setShareReceipt] = useState(null);
  const [printing, setPrinting] = useState(false);

  const storeContext = useMemo(() => getStoreContextFromStorage(), []);

  const { runWithReceiptOutput, activeReceipt, dialogs } = useReceiptOutputFlow({
    storeId,
  });

  const loadLog = useCallback(async () => {
    if (!logId || !storeId) return null;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/service-logs/${logId}`, {
        params: { store_id: storeId },
      });
      let detail = res.data;

      if (detail.sale_id) {
        try {
          const saleRes = await axiosInstance.get(
            `/api/sales/detail/${storeId}/${detail.sale_id}/`
          );
          detail = {
            ...detail,
            payments: saleRes.data?.payments || [],
            sale_status: saleRes.data?.status || detail.sale_status,
          };
        } catch {
          // keep log-only data
        }
      }

      setLog(detail);
      return detail;
    } catch {
      toast.error('Could not load service log details.');
      setLog(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [logId, storeId]);

  const handleEntered = useCallback(() => {
    // Always refetch so unit prices, expenses, and base service fee are present
    if (initialLog && initialLog.id === logId) {
      setLog(initialLog);
    }
    loadLog().then((detail) => {
      if (openShareOnLoad && detail) {
        const receipt = normalizeReceiptFromServiceLog(detail, storeContext);
        runWithReceiptOutput(receipt, (outputReceipt) => {
          setShareReceipt(outputReceipt);
          setShareOpen(true);
        });
      }
    });
  }, [initialLog, logId, loadLog, openShareOnLoad, runWithReceiptOutput, storeContext]);

  const receiptItems = useMemo(() => buildServiceLogReceiptItems(log), [log]);

  const breakdown = useMemo(() => resolveServiceLogBreakdown(log), [log]);

  const computedSubtotal = useMemo(
    () => receiptItems.reduce((sum, row) => sum + lineTotal(row), 0),
    [receiptItems]
  );

  const buildReceipt = useCallback(
    () => normalizeReceiptFromServiceLog(log, storeContext),
    [log, storeContext]
  );

  const handleShare = useCallback(() => {
    if (!log) return;
    const receipt = buildReceipt();
    runWithReceiptOutput(
      receipt,
      (outputReceipt) => {
        setShareReceipt(outputReceipt);
        setShareOpen(true);
      }
    );
  }, [buildReceipt, log, runWithReceiptOutput]);

  const handlePrint = useCallback(async () => {
    if (!log || printing) return;
    setPrinting(true);
    try {
      const receipt = buildReceipt();
      await runWithReceiptOutput(receipt, async (outputReceipt) => {
        const result = await printReceipt({
          receipt: outputReceipt,
          fileName: `${outputReceipt.invoice_number || 'service-receipt'}.pdf`,
          receiptFormat: 'thermal',
          thermalWidthMm: getPreferredThermalWidthMm(),
          currentStatus: outputReceipt.status,
          pdfFlavor: 'pos',
          preferBluetooth: true,
        });
        const message = getPrintResultMessage(result);
        if (message) toast.info(message);
      });
    } catch {
      toast.error('Could not print receipt.');
    } finally {
      setPrinting(false);
    }
  }, [buildReceipt, log, printing, runWithReceiptOutput]);

  const handleClose = () => {
    setShareOpen(false);
    setShareReceipt(null);
    setLog(null);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        TransitionProps={{ onEntered: handleEntered }}
      >
        <DialogTitle>
          Service receipt
          {log?.log_number ? (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {log.log_number}
            </Typography>
          ) : null}
        </DialogTitle>

        <DialogContent dividers>
          {loading && !log ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress size={28} />
            </Stack>
          ) : !log ? (
            <Typography color="text.secondary">Service log not found.</Typography>
          ) : (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.disabled">
                    Customer
                  </Typography>
                  <Typography variant="subtitle2">{log.customer_name || 'Walk-in'}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.disabled">
                    Staff
                  </Typography>
                  <Typography variant="subtitle2">
                    {log.performed_by_name || '—'}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.disabled">
                    Date
                  </Typography>
                  <Typography variant="subtitle2">
                    {log.created_at ? fDate(log.created_at) : '—'}
                  </Typography>
                </Box>
              </Stack>

              {log.notes ? (
                <Box>
                  <Typography variant="overline" color="text.disabled">
                    Notes
                  </Typography>
                  <Typography variant="body2">{log.notes}</Typography>
                </Box>
              ) : null}

              <Divider />

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Unit price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receiptItems.map((row, index) => {
                    const name =
                      row.line_type === 'service'
                        ? row.service_name || 'Service'
                        : row.line_type === 'expense'
                          ? row.product_name || row.description || 'Expense'
                          : row.product_name || row.description || 'Item';
                    const showSub =
                      row.description &&
                      row.description !== name &&
                      row.description.trim() !== '';

                    return (
                      <TableRow key={`${row.line_type || 'item'}-${name}-${index}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{name}</Typography>
                          {showSub && (
                            <Typography variant="caption" color="text.secondary">
                              {row.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{row.quantity}</TableCell>
                        <TableCell align="right">{fCurrency(row.price)}</TableCell>
                        <TableCell align="right">{fCurrency(lineTotal(row))}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Stack spacing={0.75} sx={{ alignItems: 'flex-end' }}>
                <Stack direction="row" spacing={4}>
                  <Typography variant="body2" color="text.secondary">
                    Service fee
                  </Typography>
                  <Typography variant="body2" sx={{ minWidth: 100, textAlign: 'right' }}>
                    {fCurrency(breakdown.baseServicePrice)}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={4}>
                  <Typography variant="body2" color="text.secondary">
                    Products used
                  </Typography>
                  <Typography variant="body2" sx={{ minWidth: 100, textAlign: 'right' }}>
                    {fCurrency(breakdown.productsTotal)}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={4}>
                  <Typography variant="body2" color="text.secondary">
                    Subtotal
                  </Typography>
                  <Typography variant="subtitle2" sx={{ minWidth: 100, textAlign: 'right' }}>
                    {fCurrency(computedSubtotal)}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={4}>
                  <Typography variant="subtitle1">Total</Typography>
                  <Typography variant="subtitle1" sx={{ minWidth: 100, textAlign: 'right' }}>
                    {fCurrency(computedSubtotal)}
                  </Typography>
                </Stack>
                {breakdown.expensesTotal > 0 && (
                  <Typography variant="caption" color="text.disabled" sx={{ pt: 0.5 }}>
                    Internal expenses {fCurrency(breakdown.expensesTotal)} (not billed to customer)
                  </Typography>
                )}
                {log.amount_paid > 0 && (
                  <Stack direction="row" spacing={4}>
                    <Typography variant="body2" color="text.secondary">
                      Paid
                    </Typography>
                    <Typography variant="body2" sx={{ minWidth: 100, textAlign: 'right' }}>
                      {fCurrency(log.amount_paid)}
                    </Typography>
                  </Stack>
                )}
                {log.balance_due > 0.02 && (
                  <Stack direction="row" spacing={4}>
                    <Typography variant="body2" color="warning.main">
                      Balance due
                    </Typography>
                    <Typography variant="body2" color="warning.main" sx={{ minWidth: 100, textAlign: 'right' }}>
                      {fCurrency(log.balance_due)}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
            disabled={!log || printing}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:share-bold" />}
            disabled={!log}
            onClick={handleShare}
          >
            Share receipt
          </Button>
        </DialogActions>
      </Dialog>

      <ReceiptShareDialog
        open={shareOpen}
        onClose={() => {
          setShareOpen(false);
          setShareReceipt(null);
        }}
        receipt={shareReceipt}
        receiptFormat="thermal"
        pdfFlavor="pos"
        thermalWidthMm={getPreferredThermalWidthMm()}
        currentStatus={shareReceipt?.status}
        shareText="Service receipt"
      />

      <ReceiptOutputFlowDialogs
        receipt={activeReceipt}
        storeId={storeId}
        dialogs={dialogs}
      />
    </>
  );
}

ServiceLogDetailDialog.propTypes = {
  open: PropTypes.bool,
  logId: PropTypes.number,
  storeId: PropTypes.number,
  onClose: PropTypes.func,
  initialLog: PropTypes.shape({
    id: PropTypes.number,
    log_number: PropTypes.string,
    customer_name: PropTypes.string,
    service_name: PropTypes.string,
    service_price: PropTypes.number,
    status: PropTypes.string,
    created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    performed_by_name: PropTypes.string,
    notes: PropTypes.string,
    amount_paid: PropTypes.number,
    balance_due: PropTypes.number,
    base_service_price: PropTypes.number,
    products_total: PropTypes.number,
    expenses_total: PropTypes.number,
    consumables: PropTypes.arrayOf(
      PropTypes.shape({
        product_id: PropTypes.number,
        product_name: PropTypes.string,
        quantity_used: PropTypes.number,
        unit_price: PropTypes.number,
        line_total: PropTypes.number,
      })
    ),
    expenses: PropTypes.arrayOf(
      PropTypes.shape({
        amount: PropTypes.number,
        description: PropTypes.string,
        category: PropTypes.string,
      })
    ),
    services: PropTypes.arrayOf(
      PropTypes.shape({
        service_id: PropTypes.number,
        service_name: PropTypes.string,
        unit_price: PropTypes.number,
        quantity: PropTypes.number,
        line_total: PropTypes.number,
      })
    ),
  }),
  openShareOnLoad: PropTypes.bool,
};
