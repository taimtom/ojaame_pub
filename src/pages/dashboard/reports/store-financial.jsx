import { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrency, fPercent } from 'src/utils/format-number';
import { paramCase } from 'src/utils/change-case';
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { ReportViewToggle } from 'src/components/report-view-toggle';
import {
  useStoreDailySales,
  useStoreMonthlySales,
  useStoreExpenses,
  useStoreSalesByPaymentMethod,
  useStoreYearlySales,
} from 'src/actions/dashboard';

// ── helpers ───────────────────────────────────────────────────────────────────

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

function KpiCard({ icon, label, value, sub, color = 'primary.main', loading }) {
  return (
    <Card sx={{ flex: 1 }}>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Box sx={{ width: 44, height: 44, borderRadius: 1.5, bgcolor: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Iconify icon={icon} width={24} sx={{ color }} />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
            {loading
              ? <CircularProgress size={16} sx={{ mt: 0.5 }} />
              : <>
                  <Typography variant="h5" fontWeight={700}>{value}</Typography>
                  {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
                </>}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const EXPENSE_PERIODS = [
  { value: 'day', label: 'Today' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

const DONUT_COLORS = ['#00A76F', '#003768', '#FFAB00', '#FF5630', '#00B8D9', '#8E33FF', '#FF3030', '#22C55E'];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StoreFinancialReportPage() {
  const { storeParam } = useParams();
  const storeId = getStoreId(storeParam);
  const [expensePeriod, setExpensePeriod] = useState('month');
  const [paymentPeriod, setPaymentPeriod] = useState('month');
  const [expenseMode, setExpenseMode] = useState('list');
  const [paymentMode, setPaymentMode] = useState('list');

  const { dailySales, dailySalesLoading } = useStoreDailySales(storeId);
  const { monthlySales, monthlySalesLoading } = useStoreMonthlySales(storeId);
  const { expenses, expensesLoading, expensesValidating } = useStoreExpenses(storeId, expensePeriod);
  const { salesByPaymentMethod, salesByPaymentMethodLoading, salesByPaymentMethodValidating } = useStoreSalesByPaymentMethod(storeId, paymentPeriod);
  const { data: yearlySales, loading: yearlySalesLoading } = useStoreYearlySales(storeId, new Date().getFullYear());

  const netIncome = (monthlySales?.total_value ?? 0) - (expenses?.total_expenses ?? 0);
  const monthlyData = yearlySales?.monthly_data || [];

  // ── Chart configs ──────────────────────────────────────────────────────────

  const expenseDonutOptions = {
    chart: { type: 'donut' },
    labels: (expenses?.categories || []).map((c) => c.category),
    legend: { position: 'bottom' },
    tooltip: { y: { formatter: (v) => fCurrency(v) } },
    colors: DONUT_COLORS,
    dataLabels: { formatter: (v) => `${v.toFixed(1)}%` },
    plotOptions: { pie: { donut: { size: '65%' } } },
  };
  const expenseDonutSeries = (expenses?.categories || []).map((c) => c.amount);

  const paymentDonutOptions = {
    chart: { type: 'donut' },
    labels: (salesByPaymentMethod || []).map((m) => (m.method_type || '').replace(/_/g, ' ')),
    legend: { position: 'bottom' },
    tooltip: { y: { formatter: (v) => fCurrency(v) } },
    colors: DONUT_COLORS,
    dataLabels: { formatter: (v) => `${v.toFixed(1)}%` },
    plotOptions: { pie: { donut: { size: '65%' } } },
  };
  const paymentDonutSeries = (salesByPaymentMethod || []).map((m) => m.total_amount);

  const yearlyAreaOptions = {
    chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false } },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
    xaxis: { categories: monthlyData.map((m) => m.month) },
    yaxis: { labels: { formatter: (v) => fCurrency(v) } },
    tooltip: { y: { formatter: (v) => fCurrency(v) } },
    legend: { position: 'top' },
    colors: ['#00A76F', '#FF5630'],
    dataLabels: { enabled: false },
  };
  const yearlyAreaSeries = [
    { name: 'Income', data: monthlyData.map((m) => m.income) },
    { name: 'Expenses', data: monthlyData.map((m) => m.expenses) },
  ];

  return (
    <>
      <Helmet><title>Financial Report | Dashboard</title></Helmet>
      <DashboardContent maxWidth="xl">

        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Financial Report</Typography>
            <Typography variant="body2" color="text.secondary">Revenue, expenses and cash flow overview</Typography>
          </Box>
        </Stack>

        {/* KPI row */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
          <KpiCard
            icon="solar:dollar-minimalistic-bold"
            label="Today's Revenue"
            value={fCurrency(dailySales?.total_sales ?? 0)}
            sub={`${dailySales?.change_percentage >= 0 ? '+' : ''}${fPercent(dailySales?.change_percentage ?? 0)} vs yesterday`}
            color="success.main"
            loading={dailySalesLoading}
          />
          <KpiCard
            icon="solar:chart-bold"
            label="Monthly Revenue"
            value={fCurrency(monthlySales?.total_value ?? 0)}
            sub={`${monthlySales?.change_percentage >= 0 ? '+' : ''}${fPercent(monthlySales?.change_percentage ?? 0)} vs last month`}
            color="info.main"
            loading={monthlySalesLoading}
          />
          <KpiCard
            icon="solar:wallet-money-bold"
            label="Monthly Expenses"
            value={fCurrency(expenses?.total_expenses ?? 0)}
            color="warning.main"
            loading={expensesLoading}
          />
          <KpiCard
            icon={netIncome >= 0 ? 'solar:graph-up-bold' : 'solar:graph-down-bold'}
            label="Net Income (Month)"
            value={fCurrency(netIncome)}
            color={netIncome >= 0 ? 'success.main' : 'error.main'}
            loading={monthlySalesLoading || expensesLoading}
          />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>

          {/* Expenses breakdown */}
          <Card sx={{ flex: 1 }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={700}>Expenses by Category</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FormControl size="small" sx={{ width: 130 }}>
                  <InputLabel>Period</InputLabel>
                  <Select value={expensePeriod} label="Period" onChange={(e) => setExpensePeriod(e.target.value)}>
                    {EXPENSE_PERIODS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <ReportViewToggle value={expenseMode} onChange={setExpenseMode} />
              </Stack>
            </Box>
            {(expensesLoading || expensesValidating)
              ? <LinearProgress />
              : expenseMode === 'list'
                ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">% of Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(expenses?.categories || []).length === 0
                        ? <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.disabled' }}>No expense data</TableCell></TableRow>
                        : (expenses?.categories || []).map((cat) => {
                            const pct = expenses.total_expenses > 0
                              ? ((cat.amount / expenses.total_expenses) * 100).toFixed(1)
                              : 0;
                            return (
                              <TableRow key={cat.category} hover>
                                <TableCell>{cat.category}</TableCell>
                                <TableCell align="right">{fCurrency(cat.amount)}</TableCell>
                                <TableCell align="right">{pct}%</TableCell>
                              </TableRow>
                            );
                          })}
                      {(expenses?.categories || []).length > 0 && (
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>{fCurrency(expenses?.total_expenses ?? 0)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>100%</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )
                : expenseDonutSeries.length === 0
                  ? <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}><Typography variant="body2">No expense data</Typography></Box>
                  : <Box sx={{ p: 2 }}>
                      <ReactApexChart type="donut" series={expenseDonutSeries} options={expenseDonutOptions} height={300} />
                    </Box>
            }
          </Card>

          {/* Sales by payment method */}
          <Card sx={{ flex: 1 }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={700}>Sales by Payment Method</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FormControl size="small" sx={{ width: 130 }}>
                  <InputLabel>Period</InputLabel>
                  <Select value={paymentPeriod} label="Period" onChange={(e) => setPaymentPeriod(e.target.value)}>
                    {EXPENSE_PERIODS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <ReportViewToggle value={paymentMode} onChange={setPaymentMode} />
              </Stack>
            </Box>
            {(salesByPaymentMethodLoading || salesByPaymentMethodValidating)
              ? <LinearProgress />
              : paymentMode === 'list'
                ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Method</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Transactions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(salesByPaymentMethod || []).length === 0
                        ? <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.disabled' }}>No payment data</TableCell></TableRow>
                        : salesByPaymentMethod.map((m) => (
                            <TableRow key={m.method_type} hover>
                              <TableCell sx={{ textTransform: 'capitalize' }}>
                                {m.method_type?.replace(/_/g, ' ')}
                              </TableCell>
                              <TableCell align="right">{fCurrency(m.total_amount)}</TableCell>
                              <TableCell align="right">{m.transaction_count ?? '—'}</TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                )
                : paymentDonutSeries.length === 0
                  ? <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}><Typography variant="body2">No payment data</Typography></Box>
                  : <Box sx={{ p: 2 }}>
                      <ReactApexChart type="donut" series={paymentDonutSeries} options={paymentDonutOptions} height={300} />
                    </Box>
            }
          </Card>

        </Stack>

        {/* Revenue vs Expenses — 12 month area chart */}
        <Card>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={700}>Revenue vs Expenses ({new Date().getFullYear()})</Typography>
            <Typography variant="caption" color="text.secondary">12-month income and expense comparison</Typography>
          </Box>
          {yearlySalesLoading
            ? <LinearProgress />
            : monthlyData.length === 0
              ? <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}><Typography variant="body2">No yearly data available</Typography></Box>
              : <Box sx={{ p: 2 }}>
                  <ReactApexChart type="area" series={yearlyAreaSeries} options={yearlyAreaOptions} height={280} />
                </Box>
          }
        </Card>

      </DashboardContent>
    </>
  );
}
