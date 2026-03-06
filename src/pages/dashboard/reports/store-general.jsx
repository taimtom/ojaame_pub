import { useState, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import ToggleButton from '@mui/material/ToggleButton';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import LinearProgress from '@mui/material/LinearProgress';

import { fCurrency, fPercent } from 'src/utils/format-number';
import { paramCase } from 'src/utils/change-case';
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { useAuthContext } from 'src/auth/hooks';
import {
  useStoreDailySales,
  useStoreMonthlySales,
  useStoreExpenses,
  useStoreSalesByPaymentMethod,
} from 'src/actions/dashboard';
import {
  useStoreDashboardStats,
  useStoreInventoryAlerts,
  useStoreSalesTrend,
  useStoreCategoryPerformance,
  useStoreProfitLoss,
  useStoreForecast,
} from 'src/actions/reports';

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

const CHART_COLORS = ['#00A76F', '#003768', '#FFAB00', '#FF5630', '#00B8D9', '#8E33FF', '#FF3030', '#22C55E'];

const PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
];

const EXPENSE_PERIOD_MAP = { '7d': 'day', '30d': 'month', '90d': 'month', '1y': 'year' };
const TREND_PERIOD_MAP = { '7d': '7d', '30d': '30d', '90d': '90d', '1y': '30d' };

// ── sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ title, subtitle }) {
  return (
    <Box mb={2} mt={1}>
      <Typography variant="h6" fontWeight={700}>{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
    </Box>
  );
}

function KpiCard({ icon, label, value, sub, color = 'primary.main', loading, chip }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Box sx={{
            width: 48, height: 48, borderRadius: 1.5,
            bgcolor: `${color}20`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Iconify icon={icon} width={26} sx={{ color }} />
          </Box>
          <Box flex={1} minWidth={0}>
            <Typography variant="body2" color="text.secondary" gutterBottom noWrap>{label}</Typography>
            {loading
              ? <CircularProgress size={18} sx={{ mt: 0.5 }} />
              : (
                <>
                  <Typography variant="h5" fontWeight={700} noWrap>{value}</Typography>
                  {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
                  {chip && (
                    <Box mt={0.5}>
                      <Chip label={chip.label} size="small"
                        color={chip.color || 'default'} sx={{ fontSize: 11 }} />
                    </Box>
                  )}
                </>
              )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, subtitle, loading, children, minHeight = 260 }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} mb={0.5}>{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        <Box mt={1.5} sx={{ minHeight }}>
          {loading
            ? <Box display="flex" justifyContent="center" alignItems="center" height={minHeight}>
                <CircularProgress />
              </Box>
            : children}
        </Box>
      </CardContent>
    </Card>
  );
}

function TableCard({ title, subtitle, children }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ pb: '0 !important' }}>
        <Typography variant="subtitle1" fontWeight={700} mb={0.5}>{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary" display="block" mb={1}>{subtitle}</Typography>}
        {children}
      </CardContent>
    </Card>
  );
}

function TrendBadge({ direction }) {
  const map = {
    up:     { label: 'Trending Up',    color: 'success', icon: 'solar:arrow-up-bold' },
    down:   { label: 'Trending Down',  color: 'error',   icon: 'solar:arrow-down-bold' },
    stable: { label: 'Stable',         color: 'default', icon: 'solar:minus-bold' },
  };
  const cfg = map[direction] || map.stable;
  return (
    <Chip
      size="small"
      color={cfg.color}
      icon={<Iconify icon={cfg.icon} width={14} />}
      label={cfg.label}
      sx={{ fontSize: 11 }}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StoreGeneralReportPage() {
  const { storeParam } = useParams();
  const storeId = getStoreId(storeParam);
  const { user } = useAuthContext();
  const companyId = user?.company_id;

  const [period, setPeriod] = useState('30d');
  const expensePeriod = EXPENSE_PERIOD_MAP[period] || 'month';
  const trendPeriod = TREND_PERIOD_MAP[period] || '30d';

  // ── Data hooks ─────────────────────────────────────────────────────────────
  const { stats, statsLoading } = useStoreDashboardStats(storeId, period);
  const { alerts, alertsLoading } = useStoreInventoryAlerts(storeId);
  const { trend, trendLoading } = useStoreSalesTrend(storeId, trendPeriod);
  const { categories, categoryLoading } = useStoreCategoryPerformance(storeId, period);
  const { profitLoss, profitLossLoading } = useStoreProfitLoss(companyId, storeId, period);
  const { forecast, forecastLoading } = useStoreForecast(storeId);

  const { dailySales, dailySalesLoading } = useStoreDailySales(storeId);
  const { monthlySales, monthlySalesLoading } = useStoreMonthlySales(storeId);
  const { expenses, expensesLoading } = useStoreExpenses(storeId, expensePeriod);
  const { salesByPaymentMethod, salesByPaymentMethodLoading } = useStoreSalesByPaymentMethod(storeId, expensePeriod);

  // ── Derived values ─────────────────────────────────────────────────────────
  const outOfStock = useMemo(() => alerts.filter((a) => a.status === 'out_of_stock').length, [alerts]);
  const lowStock = useMemo(() => alerts.filter((a) => a.status === 'low_stock').length, [alerts]);
  const netIncome = (monthlySales?.total_value ?? 0) - (expenses?.total_expenses ?? 0);
  const cashFlowItems = [
    { label: 'Revenue (Sales)', value: stats?.total_revenue ?? 0, type: 'in' },
    { label: 'Cost of Goods Sold', value: profitLoss?.cost_of_goods_sold ?? 0, type: 'out' },
    { label: 'Operating Expenses', value: expenses?.total_expenses ?? 0, type: 'out' },
  ];
  const netCashFlow = cashFlowItems.reduce((acc, i) => i.type === 'in' ? acc + i.value : acc - i.value, 0);

  // ── Chart configs ──────────────────────────────────────────────────────────

  // Category donut
  const categoryDonut = {
    options: {
      chart: { type: 'donut' },
      labels: categories.map((c) => c.category),
      legend: { position: 'bottom' },
      tooltip: { y: { formatter: (v) => fCurrency(v) } },
      colors: CHART_COLORS,
      dataLabels: { formatter: (v) => `${v.toFixed(1)}%` },
      plotOptions: { pie: { donut: { size: '65%' } } },
    },
    series: categories.map((c) => c.revenue),
  };

  // Payment method donut
  const paymentDonut = {
    options: {
      chart: { type: 'donut' },
      labels: (salesByPaymentMethod || []).map((m) => (m.method_type || '').replace(/_/g, ' ')),
      legend: { position: 'bottom' },
      tooltip: { y: { formatter: (v) => fCurrency(v) } },
      colors: CHART_COLORS,
      dataLabels: { formatter: (v) => `${v.toFixed(1)}%` },
      plotOptions: { pie: { donut: { size: '65%' } } },
    },
    series: (salesByPaymentMethod || []).map((m) => m.total_amount ?? 0),
  };

  // Expense breakdown donut
  const expenseDonut = {
    options: {
      chart: { type: 'donut' },
      labels: (expenses?.categories || []).map((c) => c.category),
      legend: { position: 'bottom' },
      tooltip: { y: { formatter: (v) => fCurrency(v) } },
      colors: CHART_COLORS,
      dataLabels: { formatter: (v) => `${v.toFixed(1)}%` },
      plotOptions: { pie: { donut: { size: '65%' } } },
    },
    series: (expenses?.categories || []).map((c) => c.amount ?? 0),
  };

  // Daily sales pattern bar
  const salesPatternBar = {
    options: {
      chart: { type: 'bar', toolbar: { show: false } },
      xaxis: { categories: trend.map((t) => t.date?.slice(5)) },
      yaxis: { labels: { formatter: (v) => fCurrency(v) } },
      tooltip: { y: { formatter: (v) => fCurrency(v) } },
      colors: ['#00A76F'],
      dataLabels: { enabled: false },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    },
    series: [{ name: 'Revenue', data: trend.map((t) => t.revenue) }],
  };

  // Weekly forecast bar
  const weekForecastBar = {
    options: {
      chart: { type: 'bar', toolbar: { show: false } },
      xaxis: { categories: (forecast?.week_forecast || []).map((d) => d.date?.slice(5)) },
      yaxis: { labels: { formatter: (v) => fCurrency(v) } },
      tooltip: { y: { formatter: (v) => fCurrency(v) } },
      colors: ['#00B8D9'],
      dataLabels: { enabled: false },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    },
    series: [{ name: 'Projected Revenue', data: (forecast?.week_forecast || []).map((d) => d.revenue) }],
  };

  // Monthly forecast area
  const monthForecastArea = {
    options: {
      chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false } },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
      xaxis: { categories: (forecast?.month_forecast || []).map((d) => d.date?.slice(5)), tickAmount: 6 },
      yaxis: { labels: { formatter: (v) => fCurrency(v) } },
      tooltip: { y: { formatter: (v) => fCurrency(v) } },
      colors: ['#00B8D9'],
      dataLabels: { enabled: false },
    },
    series: [{ name: 'Projected Revenue', data: (forecast?.month_forecast || []).map((d) => d.revenue) }],
  };

  // Profit forecast area
  const profitForecastArea = {
    options: {
      chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false } },
      stroke: { curve: 'smooth', width: 2, dashArray: [0, 4] },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02 } },
      xaxis: { categories: (forecast?.profit_forecast || []).map((d) => d.date?.slice(5)), tickAmount: 6 },
      yaxis: { labels: { formatter: (v) => fCurrency(v) } },
      tooltip: { y: { formatter: (v) => fCurrency(v) } },
      colors: ['#00A76F'],
      dataLabels: { enabled: false },
    },
    series: [{ name: 'Projected Profit', data: (forecast?.profit_forecast || []).map((d) => d.profit) }],
  };

  // Revenue forecast – historical (30d trend) + projected (30d forecast) on one chart
  const historicalRevDates = trend.map((t) => t.date?.slice(5));
  const historicalRevData = trend.map((t) => t.revenue);
  const forecastRevDates = (forecast?.revenue_forecast || []).map((d) => d.date?.slice(5));
  const forecastRevData = (forecast?.revenue_forecast || []).map((d) => d.revenue);
  const allRevDates = [...historicalRevDates, ...forecastRevDates];

  const revForecastLine = {
    options: {
      chart: { type: 'line', toolbar: { show: false }, zoom: { enabled: false } },
      stroke: { curve: 'smooth', width: [2, 2], dashArray: [0, 5] },
      xaxis: { categories: allRevDates, tickAmount: 8 },
      yaxis: { labels: { formatter: (v) => fCurrency(v) } },
      tooltip: { y: { formatter: (v) => fCurrency(v) } },
      colors: ['#003768', '#FFAB00'],
      legend: { position: 'top' },
      dataLabels: { enabled: false },
      annotations: historicalRevDates.length > 0 ? {
        xaxis: [{
          x: historicalRevDates[historicalRevDates.length - 1],
          borderColor: '#999',
          label: { text: 'Today', style: { fontSize: '11px' } },
        }],
      } : {},
    },
    series: [
      {
        name: 'Historical Revenue',
        data: [
          ...historicalRevData,
          ...new Array(forecastRevDates.length).fill(null),
        ],
      },
      {
        name: 'Forecasted Revenue',
        data: [
          ...new Array(historicalRevDates.length).fill(null),
          ...forecastRevData,
        ],
      },
    ],
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Helmet><title>General Store Reports | Dashboard</title></Helmet>
      <DashboardContent maxWidth="xl">

        {/* Page header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }}
          justifyContent="space-between" mb={3} spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={700}>General Store Reports</Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive overview — summaries, analytics and forecasts
            </Typography>
          </Box>
          <ToggleButtonGroup
            size="small"
            value={period}
            exclusive
            onChange={(_, val) => val && setPeriod(val)}
          >
            {PERIODS.map((p) => (
              <ToggleButton key={p.value} value={p.value} sx={{ px: 2 }}>
                {p.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        {/* ── SECTION 1: Summary KPIs ── */}
        <SectionTitle title="Summary Overview" subtitle="Key metrics at a glance across all report categories" />
        <Grid container spacing={2} mb={4}>
          {/* 1. Sales Overview */}
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              icon="solar:chart-2-bold"
              label="Total Revenue"
              color="primary.main"
              loading={statsLoading}
              value={fCurrency(stats?.total_revenue ?? 0)}
              sub={`${stats?.total_transactions ?? 0} transactions · avg ${fCurrency(stats?.avg_transaction_value ?? 0)}`}
            />
          </Grid>
          {/* 2. Financial Highlights */}
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              icon="solar:dollar-minimalistic-bold"
              label="Monthly Net Income"
              color="success.main"
              loading={monthlySalesLoading || expensesLoading}
              value={fCurrency(netIncome)}
              sub={`Revenue ${fCurrency(monthlySales?.total_value ?? 0)} · Expenses ${fCurrency(expenses?.total_expenses ?? 0)}`}
              chip={netIncome >= 0 ? { label: 'Profitable', color: 'success' } : { label: 'Net Loss', color: 'error' }}
            />
          </Grid>
          {/* 3. Inventory Snapshot */}
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              icon="solar:box-bold"
              label="Stock Alerts"
              color={outOfStock > 0 ? 'error.main' : 'warning.main'}
              loading={alertsLoading}
              value={`${outOfStock + lowStock} Issues`}
              sub={`${outOfStock} out of stock · ${lowStock} low stock`}
              chip={outOfStock > 0 ? { label: `${outOfStock} Critical`, color: 'error' } : undefined}
            />
          </Grid>
          {/* 4. P&L Summary */}
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              icon="solar:graph-up-bold"
              label="Gross Profit Margin"
              color="info.main"
              loading={profitLossLoading}
              value={fPercent(profitLoss?.gross_profit_margin ?? 0)}
              sub={`Net margin ${fPercent(profitLoss?.net_profit_margin ?? 0)} · Gross profit ${fCurrency(profitLoss?.gross_profit ?? 0)}`}
              chip={
                (profitLoss?.net_profit_margin ?? 0) >= 0
                  ? { label: 'In Profit', color: 'success' }
                  : { label: 'At Loss', color: 'error' }
              }
            />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 4 }} />

        {/* ── SECTION 2: Additional Reports ── */}
        <SectionTitle title="Detailed Analytics" subtitle="In-depth breakdown across products, categories, payments, expenses, and cash flow" />
        <Grid container spacing={3} mb={4}>

          {/* 5. Top Products */}
          <Grid item xs={12} md={6}>
            <TableCard
              title="Top Products by Revenue"
              subtitle={`Best-performing products in the selected period`}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Qty Sold</TableCell>
                    <TableCell align="right">Margin</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statsLoading
                    ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <CircularProgress size={22} />
                        </TableCell>
                      </TableRow>
                    )
                    : (stats?.best_by_revenue || []).slice(0, 8).map((item, idx) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ color: 'text.secondary', width: 32 }}>{idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.type}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>{fCurrency(item.total_revenue)}</Typography>
                        </TableCell>
                        <TableCell align="right">{item.total_quantity}</TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={`${(item.profit_margin ?? 0).toFixed(1)}%`}
                            color={(item.profit_margin ?? 0) >= 20 ? 'success' : 'default'}
                            sx={{ fontSize: 11 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableCard>
          </Grid>

          {/* 6. Category Performance */}
          <Grid item xs={12} md={6}>
            <ChartCard
              title="Category Performance"
              subtitle="Revenue share by product category"
              loading={categoryLoading}
            >
              {categories.length > 0
                ? <ReactApexChart
                    type="donut"
                    height={260}
                    series={categoryDonut.series}
                    options={categoryDonut.options}
                  />
                : <Box display="flex" justifyContent="center" alignItems="center" height={260}>
                    <Typography variant="body2" color="text.secondary">No category data</Typography>
                  </Box>}
            </ChartCard>
          </Grid>

          {/* 7. Payment Method Analysis */}
          <Grid item xs={12} md={4}>
            <ChartCard
              title="Payment Methods"
              subtitle="Revenue split by payment type"
              loading={salesByPaymentMethodLoading}
            >
              {(salesByPaymentMethod || []).length > 0
                ? <ReactApexChart
                    type="donut"
                    height={260}
                    series={paymentDonut.series}
                    options={paymentDonut.options}
                  />
                : <Box display="flex" justifyContent="center" alignItems="center" height={260}>
                    <Typography variant="body2" color="text.secondary">No payment data</Typography>
                  </Box>}
            </ChartCard>
          </Grid>

          {/* 8. Expense Breakdown */}
          <Grid item xs={12} md={4}>
            <ChartCard
              title="Expense Breakdown"
              subtitle="Operating expenses by category"
              loading={expensesLoading}
            >
              {(expenses?.categories || []).length > 0
                ? <ReactApexChart
                    type="donut"
                    height={260}
                    series={expenseDonut.series}
                    options={expenseDonut.options}
                  />
                : <Box display="flex" justifyContent="center" alignItems="center" height={260}>
                    <Typography variant="body2" color="text.secondary">No expense data</Typography>
                  </Box>}
            </ChartCard>
          </Grid>

          {/* 9. Daily Sales Pattern */}
          <Grid item xs={12} md={4}>
            <ChartCard
              title="Daily Sales Pattern"
              subtitle="Revenue per day in selected period"
              loading={trendLoading}
            >
              {trend.length > 0
                ? <ReactApexChart
                    type="bar"
                    height={260}
                    series={salesPatternBar.series}
                    options={salesPatternBar.options}
                  />
                : <Box display="flex" justifyContent="center" alignItems="center" height={260}>
                    <Typography variant="body2" color="text.secondary">No trend data</Typography>
                  </Box>}
            </ChartCard>
          </Grid>

          {/* 10. Cash Flow Summary */}
          <Grid item xs={12} md={6}>
            <TableCard
              title="Cash Flow Summary"
              subtitle="Operating cash movement for selected period"
            >
              <Table size="small">
                <TableBody>
                  {cashFlowItems.map((item) => (
                    <TableRow key={item.label}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Iconify
                            icon={item.type === 'in' ? 'solar:arrow-down-bold' : 'solar:arrow-up-bold'}
                            width={16}
                            sx={{ color: item.type === 'in' ? 'success.main' : 'error.main' }}
                          />
                          <Typography variant="body2">{item.label}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2" fontWeight={600}
                          color={item.type === 'in' ? 'success.main' : 'error.main'}
                        >
                          {item.type === 'in' ? '+' : '-'}{fCurrency(item.value)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Net Cash Flow</TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body1" fontWeight={700}
                        color={netCashFlow >= 0 ? 'success.main' : 'error.main'}
                      >
                        {netCashFlow >= 0 ? '+' : ''}{fCurrency(netCashFlow)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Divider sx={{ my: 2 }} />

              {/* Profit margin bars */}
              <Stack spacing={1.5} pb={1}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">Gross Profit Margin</Typography>
                    <Typography variant="caption" fontWeight={700}>
                      {fPercent(profitLoss?.gross_profit_margin ?? 0)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(profitLoss?.gross_profit_margin ?? 0, 100)}
                    color="success"
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">Net Profit Margin</Typography>
                    <Typography variant="caption" fontWeight={700}>
                      {fPercent(profitLoss?.net_profit_margin ?? 0)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Math.max(profitLoss?.net_profit_margin ?? 0, 0), 100)}
                    color="primary"
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              </Stack>
            </TableCard>
          </Grid>

          {/* Items sold breakdown by type */}
          <Grid item xs={12} md={6}>
            <TableCard
              title="Sales Performance Breakdown"
              subtitle="Best items by profit and volume"
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Profit</TableCell>
                    <TableCell align="right">Margin</TableCell>
                    <TableCell align="right">Qty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statsLoading
                    ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                          <CircularProgress size={22} />
                        </TableCell>
                      </TableRow>
                    )
                    : (stats?.best_by_profit || []).slice(0, 7).map((item) => (
                      <TableRow key={`p-${item.id}`} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} noWrap>{item.name}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="success.main" fontWeight={600}>
                            {fCurrency(item.total_profit ?? 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption">{(item.profit_margin ?? 0).toFixed(1)}%</Typography>
                        </TableCell>
                        <TableCell align="right">{item.total_quantity}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableCard>
          </Grid>

        </Grid>

        <Divider sx={{ mb: 4 }} />

        {/* ── SECTION 3: Forecasts ── */}
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={700}>Forecasts</Typography>
            <Typography variant="body2" color="text.secondary">
              Projections based on linear trend analysis of the past 60 days
            </Typography>
          </Box>
          {forecast && <TrendBadge direction={forecast.trend_direction} />}
        </Stack>

        {/* Forecast summary KPIs */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              icon="solar:calendar-bold"
              label="7-Day Revenue Forecast"
              color="info.main"
              loading={forecastLoading}
              value={fCurrency(forecast?.forecast_revenue_7d_total ?? 0)}
              sub="Projected next 7 days"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              icon="solar:calendar-mark-bold"
              label="30-Day Revenue Forecast"
              color="primary.main"
              loading={forecastLoading}
              value={fCurrency(forecast?.forecast_revenue_30d_total ?? 0)}
              sub="Projected next 30 days"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              icon="solar:graph-up-bold"
              label="30-Day Profit Forecast"
              color={
                (forecast?.forecast_profit_30d_total ?? 0) >= 0 ? 'success.main' : 'error.main'
              }
              loading={forecastLoading}
              value={fCurrency(forecast?.forecast_profit_30d_total ?? 0)}
              sub="Projected next 30 days"
              chip={
                (forecast?.forecast_profit_30d_total ?? 0) >= 0
                  ? { label: 'Profitable', color: 'success' }
                  : { label: 'Loss Expected', color: 'error' }
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              icon="solar:arrow-right-up-bold"
              label="Daily Avg Revenue (Historical)"
              color="warning.main"
              loading={forecastLoading}
              value={fCurrency(forecast?.historical_avg_daily_revenue ?? 0)}
              sub="Based on last 60 days"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* 11. Weekly Forecast */}
          <Grid item xs={12} md={6}>
            <ChartCard
              title="Weekly Sales Forecast"
              subtitle="Projected revenue for the next 7 days"
              loading={forecastLoading}
            >
              {(forecast?.week_forecast || []).length > 0
                ? <ReactApexChart
                    type="bar"
                    height={280}
                    series={weekForecastBar.series}
                    options={weekForecastBar.options}
                  />
                : <Box display="flex" justifyContent="center" alignItems="center" height={280}>
                    <Typography variant="body2" color="text.secondary">No forecast data</Typography>
                  </Box>}
            </ChartCard>
          </Grid>

          {/* 12. Monthly Revenue Forecast */}
          <Grid item xs={12} md={6}>
            <ChartCard
              title="Monthly Revenue Forecast"
              subtitle="Projected revenue over the next 30 days"
              loading={forecastLoading}
            >
              {(forecast?.month_forecast || []).length > 0
                ? <ReactApexChart
                    type="area"
                    height={280}
                    series={monthForecastArea.series}
                    options={monthForecastArea.options}
                  />
                : <Box display="flex" justifyContent="center" alignItems="center" height={280}>
                    <Typography variant="body2" color="text.secondary">No forecast data</Typography>
                  </Box>}
            </ChartCard>
          </Grid>

          {/* 13. Profit Forecast */}
          <Grid item xs={12} md={6}>
            <ChartCard
              title="Profit Forecast"
              subtitle="Projected profit/loss trend over the next 30 days"
              loading={forecastLoading}
            >
              {(forecast?.profit_forecast || []).length > 0
                ? <ReactApexChart
                    type="area"
                    height={280}
                    series={profitForecastArea.series}
                    options={profitForecastArea.options}
                  />
                : <Box display="flex" justifyContent="center" alignItems="center" height={280}>
                    <Typography variant="body2" color="text.secondary">No forecast data</Typography>
                  </Box>}
            </ChartCard>
          </Grid>

          {/* 14. Revenue Forecast – Historical + Projected */}
          <Grid item xs={12} md={6}>
            <ChartCard
              title="Revenue Trend & Forecast"
              subtitle="Historical revenue (solid) vs projected revenue (dashed)"
              loading={trendLoading || forecastLoading}
            >
              {allRevDates.length > 0
                ? <ReactApexChart
                    type="line"
                    height={280}
                    series={revForecastLine.series}
                    options={revForecastLine.options}
                  />
                : <Box display="flex" justifyContent="center" alignItems="center" height={280}>
                    <Typography variant="body2" color="text.secondary">No data available</Typography>
                  </Box>}
            </ChartCard>
          </Grid>
        </Grid>

      </DashboardContent>
    </>
  );
}
