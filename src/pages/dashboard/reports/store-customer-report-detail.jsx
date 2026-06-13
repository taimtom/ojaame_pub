import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { fCurrency } from 'src/utils/format-number';
import { paramCase } from 'src/utils/change-case';
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ReportViewToggle } from 'src/components/report-view-toggle';
import { ReportPeriodSelector } from 'src/components/report-period-selector';
import {
  QuickDashboardPayments,
  sumPaymentLines,
} from 'src/sections/quick-dashboard/quick-dashboard-payments';
import { useGetPaymentMethods } from 'src/actions/paymentmethod';
import { usePermissions } from 'src/hooks/use-permissions';
import {
  useCustomerReportDetail,
  collectCustomerPayment,
} from 'src/actions/reports';
import {
  previewFifoAllocation,
  totalOutstanding,
} from 'src/utils/customer-report-allocation';

const AMOUNT_EPS = 0.02;

function getStoreId(storeParam) {
  if (storeParam) return storeParam.split('-').pop();
  try {
    const raw = localStorage.getItem('activeWorkspace');
    if (raw) {
      const { storeName, id } = JSON.parse(raw);
      if (storeName && id) return `${paramCase(storeName)}-${id}`.split('-').pop();
    }
  } catch { /* ignore */ }
  return null;
}

function defaultPaymentLine(amount, paymentMethods) {
  return {
    payment_method_id: paymentMethods[0]?.id ?? '',
    amount: Math.max(0, Number(amount) || 0),
  };
}

function KpiCard({ icon, label, value, color = 'primary.main', loading }) {
  return (
    <Card sx={{ flex: 1, minWidth: 160 }}>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              bgcolor: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Iconify icon={icon} width={24} sx={{ color }} />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" noWrap>
              {label}
            </Typography>
            {loading ? (
              <CircularProgress size={16} sx={{ mt: 0.5 }} />
            ) : (
              <Typography variant="h5" fontWeight={700}>
                {value}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function statusColor(status) {
  if (status === 'paid') return 'success';
  if (status === 'credit') return 'warning';
  return 'default';
}

export default function StoreCustomerReportDetailPage() {
  const { storeParam, customerId } = useParams();
  const storeId = getStoreId(storeParam);
  const numericCustomerId = Number(customerId);
  const { hasPermission } = usePermissions();
  const canCollect = hasPermission('sales.update');

  const [periodState, setPeriodState] = useState({
    period: 'this_month',
    month: null,
    year: null,
    date: null,
  });
  const [monthlyMode, setMonthlyMode] = useState('list');
  const [collectOpen, setCollectOpen] = useState(false);
  const [collectMode, setCollectMode] = useState('pay_all');
  const [partialAmount, setPartialAmount] = useState('');
  const [paymentLines, setPaymentLines] = useState([{ payment_method_id: '', amount: 0 }]);
  const [collectSubmitting, setCollectSubmitting] = useState(false);

  const { period, month, year, date } = periodState;

  const { detail, detailLoading, detailError, refetchDetail } = useCustomerReportDetail(
    storeId,
    numericCustomerId,
    period,
    month,
    year,
    date
  );

  const { paymentMethods, paymentMethodsLoading } = useGetPaymentMethods(storeId);

  const outstanding = detail?.outstanding_invoices || [];
  const totalOwing = useMemo(() => totalOutstanding(outstanding), [outstanding]);

  const targetAmount = useMemo(() => {
    if (collectMode === 'pay_all') return totalOwing;
    const parsed = Number(partialAmount);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [collectMode, partialAmount, totalOwing]);

  const allocationPreview = useMemo(
    () => previewFifoAllocation(outstanding, targetAmount),
    [outstanding, targetAmount]
  );

  const affectedSaleIds = useMemo(
    () => new Set(allocationPreview.map((row) => row.sale_id)),
    [allocationPreview]
  );

  const paidSum = sumPaymentLines(paymentLines);
  const paymentMismatch = Math.abs(paidSum - targetAmount) > AMOUNT_EPS;
  const partialInvalid =
    collectMode === 'partial' &&
    (targetAmount <= AMOUNT_EPS || targetAmount > totalOwing + AMOUNT_EPS);

  const resetCollectDialog = useCallback(() => {
    setCollectMode('pay_all');
    setPartialAmount('');
    setPaymentLines([defaultPaymentLine(totalOwing, paymentMethods)]);
  }, [totalOwing, paymentMethods]);

  useEffect(() => {
    if (collectOpen && paymentMethods.length) {
      setPaymentLines([defaultPaymentLine(totalOwing, paymentMethods)]);
    }
  }, [collectOpen, totalOwing, paymentMethods]);

  useEffect(() => {
    if (collectOpen && collectMode === 'pay_all' && paymentMethods.length) {
      setPaymentLines([defaultPaymentLine(totalOwing, paymentMethods)]);
    }
  }, [collectOpen, collectMode, totalOwing, paymentMethods]);

  const handleCollectSubmit = async () => {
    if (!storeId || !numericCustomerId) return;
    if (paymentMismatch || partialInvalid || targetAmount <= AMOUNT_EPS) return;

    const validLines = paymentLines.filter(
      (line) => line.payment_method_id && Number(line.amount) > AMOUNT_EPS
    );
    if (!validLines.length) {
      toast.error('Add at least one payment method with an amount.');
      return;
    }

    try {
      setCollectSubmitting(true);
      await collectCustomerPayment(numericCustomerId, {
        store_id: Number(storeId),
        mode: collectMode,
        amount: collectMode === 'partial' ? targetAmount : undefined,
        payment_lines: validLines.map((line) => ({
          payment_method_id: Number(line.payment_method_id),
          amount: Number(line.amount),
        })),
      });
      toast.success('Payment recorded successfully.');
      setCollectOpen(false);
      resetCollectDialog();
      refetchDetail();
    } catch (error) {
      toast.error(error?.message || 'Failed to record payment.');
    } finally {
      setCollectSubmitting(false);
    }
  };

  const monthlyBreakdown = detail?.monthly_breakdown || [];
  const chartCategories = monthlyBreakdown.map((row) =>
    row.month ? row.month.slice(0, 7) : ''
  );
  const chartOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
    xaxis: { categories: chartCategories },
    yaxis: { labels: { formatter: (v) => fCurrency(v) } },
    tooltip: { y: { formatter: (v) => fCurrency(v) } },
    colors: ['#00A76F', '#003768'],
    dataLabels: { enabled: false },
    legend: { position: 'top' },
  };
  const chartSeries = [
    { name: 'Purchased', data: monthlyBreakdown.map((row) => row.total_purchased) },
    { name: 'Transactions', data: monthlyBreakdown.map((row) => row.transaction_count) },
  ];

  const metrics = detail?.metrics;
  const customer = detail?.customer;

  return (
    <>
      <Helmet>
        <title>{customer?.name ? `${customer.name} | Customer Report` : 'Customer Report'}</title>
      </Helmet>
      <DashboardContent maxWidth="xl">
        <CustomBreadcrumbs
          heading={customer?.name || 'Customer Report'}
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            {
              name: 'Customer Report',
              href: paths.dashboard.reports.customers(storeParam),
            },
            { name: customer?.name || 'Detail' },
          ]}
          sx={{ mb: 3 }}
        />

        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            {customer && (
              <Typography variant="body2" color="text.secondary">
                {customer.phone_number}
                {customer.email ? ` · ${customer.email}` : ''}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {detail
                ? `${detail.start_date?.slice(0, 10)} → ${detail.end_date?.slice(0, 10)}`
                : 'Selected period'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {canCollect && totalOwing > AMOUNT_EPS && (
              <Button
                variant="contained"
                color="warning"
                startIcon={<Iconify icon="solar:wallet-money-bold" />}
                onClick={() => setCollectOpen(true)}
              >
                Collect payment
              </Button>
            )}
            <ReportPeriodSelector period={period} onChange={setPeriodState} />
          </Stack>
        </Stack>

        {detailError && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
            <Typography color="error" variant="body2">
              Could not load customer report. {detailError?.message || 'Please try again.'}
            </Typography>
          </Box>
        )}

        <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
          <KpiCard
            icon="solar:cart-large-2-bold"
            label="Total Purchased"
            value={fCurrency(metrics?.total_purchased ?? 0)}
            color="info.main"
            loading={detailLoading}
          />
          <KpiCard
            icon="solar:wallet-money-bold"
            label="Amount Owing"
            value={fCurrency(metrics?.amount_owing ?? 0)}
            color="warning.main"
            loading={detailLoading}
          />
          <KpiCard
            icon="solar:transfer-horizontal-bold"
            label="Transactions"
            value={metrics?.transaction_count ?? 0}
            loading={detailLoading}
          />
          <KpiCard
            icon="solar:calendar-bold"
            label="Visits / Month"
            value={(metrics?.visits_per_month ?? 0).toFixed(1)}
            color="success.main"
            loading={detailLoading}
          />
        </Stack>

        {totalOwing > AMOUNT_EPS && (
          <Card sx={{ mb: 3 }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Outstanding Invoices
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Oldest invoices are paid first when collecting payment.
              </Typography>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {outstanding.map((row) => (
                    <TableRow
                      key={row.sale_id}
                      sx={{
                        bgcolor: collectOpen && affectedSaleIds.has(row.sale_id)
                          ? 'warning.lighter'
                          : undefined,
                      }}
                    >
                      <TableCell>{row.invoice_number}</TableCell>
                      <TableCell>{row.create_date?.slice(0, 10)}</TableCell>
                      <TableCell align="right">{fCurrency(row.total_amount)}</TableCell>
                      <TableCell align="right">{fCurrency(row.amount_paid)}</TableCell>
                      <TableCell align="right">{fCurrency(row.balance_due)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={row.status} color={statusColor(row.status)} variant="soft" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Card>
        )}

        <Card sx={{ mb: 3 }}>
          <Box
            sx={{
              p: 2.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Monthly Breakdown
            </Typography>
            {monthlyBreakdown.length > 0 && (
              <ReportViewToggle value={monthlyMode} onChange={setMonthlyMode} />
            )}
          </Box>
          <Box sx={{ p: 2.5 }}>
            {detailLoading && <CircularProgress size={24} />}
            {!detailLoading && monthlyBreakdown.length === 0 && (
              <Typography color="text.secondary">No activity in this period.</Typography>
            )}
            {!detailLoading && monthlyBreakdown.length > 0 && monthlyMode === 'list' && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Transactions</TableCell>
                    <TableCell align="right">Purchased</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyBreakdown.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell>{row.month?.slice(0, 7)}</TableCell>
                      <TableCell align="right">{row.transaction_count}</TableCell>
                      <TableCell align="right">{fCurrency(row.total_purchased)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!detailLoading && monthlyBreakdown.length > 0 && monthlyMode === 'chart' && (
              <ReactApexChart type="bar" height={320} options={chartOptions} series={chartSeries} />
            )}
          </Box>
        </Card>

        <Card>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Transactions in Period
            </Typography>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Invoice</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Paid</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detailLoading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                )}
                {!detailLoading && (detail?.transactions || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No transactions in this period.</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!detailLoading &&
                  (detail?.transactions || []).map((row) => (
                    <TableRow key={row.sale_id}>
                      <TableCell>{row.invoice_number}</TableCell>
                      <TableCell>{row.create_date?.slice(0, 10)}</TableCell>
                      <TableCell align="right">{fCurrency(row.total_amount)}</TableCell>
                      <TableCell align="right">{fCurrency(row.amount_paid)}</TableCell>
                      <TableCell align="right">{fCurrency(row.balance_due)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={row.status} color={statusColor(row.status)} variant="soft" />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Box>
        </Card>

        <Dialog
          open={collectOpen}
          onClose={() => !collectSubmitting && setCollectOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Collect Payment</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Total owing: <strong>{fCurrency(totalOwing)}</strong>
            </Typography>

            <Tabs
              value={collectMode}
              onChange={(_, value) => setCollectMode(value)}
              sx={{ mb: 2 }}
            >
              <Tab value="pay_all" label="Pay all" />
              <Tab value="partial" label="Pay part" />
            </Tabs>

            {collectMode === 'partial' && (
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Amount to pay"
                value={partialAmount}
                onChange={(e) => {
                  setPartialAmount(e.target.value);
                  const next = Number(e.target.value);
                  if (Number.isFinite(next) && next > 0) {
                    setPaymentLines([defaultPaymentLine(next, paymentMethods)]);
                  }
                }}
                error={partialInvalid}
                helperText={
                  partialInvalid
                    ? `Enter an amount between ${fCurrency(AMOUNT_EPS)} and ${fCurrency(totalOwing)}`
                    : ' '
                }
                sx={{ mb: 2 }}
              />
            )}

            <QuickDashboardPayments
              lines={paymentLines}
              onChange={setPaymentLines}
              cartTotal={targetAmount}
              paymentMethods={paymentMethods}
              paymentMethodsLoading={paymentMethodsLoading}
              disabled={collectSubmitting}
              compact
            />

            {allocationPreview.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Allocation preview
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice</TableCell>
                      <TableCell align="right">Applied</TableCell>
                      <TableCell align="right">Remaining</TableCell>
                      <TableCell>Result</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allocationPreview.map((row) => (
                      <TableRow key={row.sale_id}>
                        <TableCell>{row.invoice_number}</TableCell>
                        <TableCell align="right">{fCurrency(row.amount_applied)}</TableCell>
                        <TableCell align="right">{fCurrency(row.balance_after)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.new_status === 'paid' ? 'Fully paid' : 'Partial payment'}
                            color={row.new_status === 'paid' ? 'success' : 'warning'}
                            variant="soft"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCollectOpen(false)} disabled={collectSubmitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={
                collectSubmitting ||
                paymentMismatch ||
                partialInvalid ||
                targetAmount <= AMOUNT_EPS ||
                !paymentMethods.length
              }
              onClick={handleCollectSubmit}
            >
              {collectSubmitting ? 'Recording…' : 'Record payment'}
            </Button>
          </DialogActions>
        </Dialog>
      </DashboardContent>
    </>
  );
}
