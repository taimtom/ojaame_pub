import { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Helmet } from 'react-helmet-async';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
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
import Avatar from '@mui/material/Avatar';

import { fCurrency } from 'src/utils/format-number';
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { ReportViewToggle } from 'src/components/report-view-toggle';
import { ReportPeriodSelector } from 'src/components/report-period-selector';
import { useAuthContext } from 'src/auth/hooks';
import { useCompanySummary, useCompanyStoreComparison } from 'src/actions/dashboard';
import { useCompanyProfitLoss, useCompanyRevenueTrend } from 'src/actions/reports';

// ── helpers ───────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, color = 'primary.main', loading }) {
  return (
    <Card sx={{ flex: 1 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ width: 44, height: 44, borderRadius: 1.5, bgcolor: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Iconify icon={icon} width={24} sx={{ color }} />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
            {loading
              ? <CircularProgress size={16} sx={{ mt: 0.5 }} />
              : <Typography variant="h5" fontWeight={700}>{value}</Typography>}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}


const METRICS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'items_sold', label: 'Items Sold' },
];

const CHART_COLORS = ['#00A76F', '#003768', '#FFAB00', '#FF5630', '#00B8D9', '#8E33FF'];

const metricLabel = (m, v) => {
  if (m === 'revenue') return fCurrency(v);
  return (v ?? 0).toLocaleString();
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CompanyReportsPage() {
  const { user } = useAuthContext();
  const companyId = user?.company_id;
  const [periodState, setPeriodState] = useState({ period: 'this_month', month: null, year: null, date: null });
  const { period, month, year, date } = periodState;
  const [metric, setMetric] = useState('revenue');
  const [storesMode, setStoresMode] = useState('list');
  const [plMode, setPlMode] = useState('list');

  const { companySummary, companySummaryLoading } = useCompanySummary(companyId);
  const { storeComparison, storeComparisonLoading } = useCompanyStoreComparison(companyId);
  const { profitLoss, profitLossLoading } = useCompanyProfitLoss(companyId, period, month, year, date);
  const { revenueTrend, revenueTrendLoading } = useCompanyRevenueTrend(companyId, 'this_year', 'month');

  // Sort stores by selected metric (client-side)
  const rawStores = storeComparison?.stores || [];
  const stores = [...rawStores].sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0));

  const totalRevenue = stores.reduce((s, st) => s + (st.revenue || 0), 0);
  const totalTxn = stores.reduce((s, st) => s + (st.transactions || 0), 0);
  const totalItems = stores.reduce((s, st) => s + (st.items_sold || 0), 0);

  // ── Chart configs ──────────────────────────────────────────────────────────

  const currentMetricObj = METRICS.find((m) => m.value === metric) || METRICS[0];

  const storesBarOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: '55%', borderRadius: 4, distributed: true } },
    xaxis: { categories: stores.map((s) => s.store_name), labels: { style: { fontSize: '11px' } } },
    yaxis: { labels: { formatter: (v) => metric === 'revenue' ? fCurrency(v) : Math.round(v).toLocaleString() } },
    tooltip: { y: { formatter: (v) => metricLabel(metric, v) } },
    colors: CHART_COLORS,
    dataLabels: { enabled: false },
    legend: { show: false },
    title: { text: currentMetricObj.label, align: 'left', style: { fontSize: '13px' } },
  };

  const storesBarSeries = [{
    name: currentMetricObj.label,
    data: stores.map((s) => s[metric] ?? 0),
  }];

  // P&L bar chart
  const plBarValues = profitLoss
    ? [profitLoss.gross_sales, profitLoss.net_sales, profitLoss.gross_profit, profitLoss.total_costs, profitLoss.net_profit]
    : [0, 0, 0, 0, 0];
  const plBarColors = plBarValues.map((v, i) => i === 3 ? '#FF5630' : v >= 0 ? '#00A76F' : '#FF5630');

  const plBarOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: '55%', borderRadius: 4, distributed: true } },
    xaxis: {
      categories: ['Gross Sales', 'Net Sales', 'Gross Profit', 'Total Costs', 'Net Profit'],
      labels: { style: { fontSize: '11px' } },
    },
    yaxis: { labels: { formatter: (v) => fCurrency(v) } },
    tooltip: { y: { formatter: (v) => fCurrency(v) } },
    colors: plBarColors,
    dataLabels: { enabled: false },
    legend: { show: false },
  };
  const plBarSeries = [{ name: 'Amount', data: plBarValues }];

  // Revenue trend line
  const trendLineOptions = {
    chart: { type: 'line', toolbar: { show: false }, zoom: { enabled: false } },
    stroke: { width: [3, 2], curve: 'smooth', dashArray: [0, 5] },
    xaxis: {
      categories: revenueTrend.map((t) => {
        const d = t.date || '';
        return d.slice(0, 7); // YYYY-MM
      }),
      labels: { rotate: -45, style: { fontSize: '11px' } },
    },
    yaxis: [
      { title: { text: 'Revenue' }, labels: { formatter: (v) => fCurrency(v) } },
      { opposite: true, title: { text: 'Transactions' }, labels: { formatter: (v) => Math.round(v) } },
    ],
    tooltip: {
      shared: true,
      y: [{ formatter: (v) => fCurrency(v) }, { formatter: (v) => `${v} txns` }],
    },
    legend: { position: 'top' },
    colors: ['#00A76F', '#003768'],
    dataLabels: { enabled: false },
  };
  const trendLineSeries = [
    { name: 'Revenue', data: revenueTrend.map((t) => t.revenue || 0) },
    { name: 'Transactions', data: revenueTrend.map((t) => t.transactions || 0) },
  ];

  return (
    <>
      <Helmet><title>Company Reports | Dashboard</title></Helmet>
      <DashboardContent maxWidth="xl">

        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Company Reports</Typography>
            <Typography variant="body2" color="text.secondary">Cross-store performance summary</Typography>
          </Box>
          <ReportPeriodSelector period={period} onChange={setPeriodState} />
        </Stack>

        {/* KPI row */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
          <KpiCard icon="solar:buildings-bold" label="Total Stores" value={stores.length || companySummary?.total_stores || '—'} color="info.main" loading={storeComparisonLoading} />
          <KpiCard icon="solar:dollar-minimalistic-bold" label="Total Revenue" value={fCurrency(totalRevenue)} color="success.main" loading={storeComparisonLoading} />
          <KpiCard icon="solar:cart-large-bold" label="Total Transactions" value={totalTxn.toLocaleString()} color="primary.main" loading={storeComparisonLoading} />
          <KpiCard icon="solar:box-bold" label="Total Items Sold" value={totalItems.toLocaleString()} color="warning.main" loading={storeComparisonLoading} />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>

          {/* Store comparison */}
          <Card sx={{ flex: 2 }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={700}>Store Comparison</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FormControl size="small" sx={{ width: 150 }}>
                  <InputLabel>Metric</InputLabel>
                  <Select value={metric} label="Metric" onChange={(e) => setMetric(e.target.value)}>
                    {METRICS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <ReportViewToggle value={storesMode} onChange={setStoresMode} />
              </Stack>
            </Box>

            {storeComparisonLoading
              ? <LinearProgress />
              : storesMode === 'list'
                ? (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Store</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Transactions</TableCell>
                        <TableCell align="right">Items Sold</TableCell>
                        <TableCell sx={{ width: 120 }}>Share</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stores.length === 0
                        ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.disabled' }}>No store data available</TableCell></TableRow>
                        : stores.map((store, idx) => {
                            const shareWidth = totalRevenue > 0 ? (store.revenue / totalRevenue) * 100 : 0;
                            return (
                              <TableRow key={store.store_id} hover>
                                <TableCell>
                                  <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.lighter', color: 'primary.main', fontSize: 13, fontWeight: 700 }}>
                                      {store.store_name?.substring(0, 2)?.toUpperCase()}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body2" fontWeight={600}>{store.store_name}</Typography>
                                      {idx === 0 && <Chip size="small" label="Top" color="success" sx={{ height: 16, fontSize: 10 }} />}
                                    </Box>
                                  </Stack>
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: metric === 'revenue' ? 700 : 400, color: metric === 'revenue' ? 'primary.main' : 'text.primary' }}>{fCurrency(store.revenue)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: metric === 'transactions' ? 700 : 400, color: metric === 'transactions' ? 'primary.main' : 'text.primary' }}>{store.transactions?.toLocaleString()}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: metric === 'items_sold' ? 700 : 400, color: metric === 'items_sold' ? 'primary.main' : 'text.primary' }}>{store.items_sold?.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Stack spacing={0.5}>
                                    <Box sx={{ height: 6, borderRadius: 1, bgcolor: 'action.hover', overflow: 'hidden' }}>
                                      <Box sx={{ height: '100%', width: `${shareWidth}%`, bgcolor: 'primary.main', borderRadius: 1 }} />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">{shareWidth.toFixed(1)}%</Typography>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                    </TableBody>
                  </Table>
                )
                : stores.length === 0
                  ? <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}><Typography variant="body2">No store data available</Typography></Box>
                  : <Box sx={{ p: 2 }}>
                      <ReactApexChart type="bar" series={storesBarSeries} options={storesBarOptions} height={280} />
                    </Box>
            }
          </Card>

          {/* P&L Summary */}
          <Card sx={{ flex: 1 }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Company P&amp;L Summary</Typography>
                <Typography variant="caption" color="text.secondary">{period.replace(/_/g, ' ')}</Typography>
              </Box>
              {profitLoss && <ReportViewToggle value={plMode} onChange={setPlMode} />}
            </Box>

            {profitLossLoading
              ? <LinearProgress />
              : profitLoss
                ? plMode === 'list'
                  ? (
                    <Box sx={{ p: 2.5 }}>
                      {[
                        { label: 'Gross Sales', value: profitLoss.gross_sales, color: 'text.primary' },
                        { label: 'Discounts', value: -Math.abs(profitLoss.discounts), color: 'error.main' },
                        { label: 'Net Sales', value: profitLoss.net_sales, bold: true },
                        { label: 'Cost of Goods', value: -Math.abs(profitLoss.cost_of_goods_sold), color: 'error.main' },
                        { label: 'Gross Profit', value: profitLoss.gross_profit, bold: true, color: profitLoss.gross_profit >= 0 ? 'success.main' : 'error.main' },
                        { label: 'Expenses', value: -Math.abs(profitLoss.operating_expenses), color: 'error.main' },
                        { label: 'Net Profit', value: profitLoss.net_profit, bold: true, color: profitLoss.net_profit >= 0 ? 'success.main' : 'error.main' },
                      ].map(({ label, value, bold, color }) => (
                        <Stack key={label} direction="row" justifyContent="space-between" py={0.75}
                          sx={{ borderBottom: bold ? '1px solid' : 'none', borderColor: 'divider' }}>
                          <Typography variant="body2" fontWeight={bold ? 700 : 400} color={color || 'text.primary'}>{label}</Typography>
                          <Typography variant="body2" fontWeight={bold ? 700 : 400} color={color || 'text.primary'}>{fCurrency(value)}</Typography>
                        </Stack>
                      ))}
                      <Stack direction="row" justifyContent="space-between" pt={1}>
                        <Typography variant="caption" color="text.secondary">Net Margin</Typography>
                        <Chip size="small"
                          label={`${profitLoss.net_profit_margin?.toFixed(1)}%`}
                          color={profitLoss.net_profit >= 0 ? 'success' : 'error'}
                          sx={{ height: 20, fontSize: 11 }} />
                      </Stack>
                    </Box>
                  )
                  : (
                    <Box sx={{ p: 2 }}>
                      <ReactApexChart type="bar" series={plBarSeries} options={plBarOptions} height={280} />
                    </Box>
                  )
                : (
                  <Box sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>
                    <Iconify icon="solar:chart-2-bold" width={40} sx={{ mb: 1 }} />
                    <Typography variant="body2">P&amp;L data not available</Typography>
                  </Box>
                )
            }
          </Card>

        </Stack>

        {/* Revenue trend line chart */}
        <Card>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={700}>Company Revenue Trend (Last 12 months)</Typography>
            <Typography variant="caption" color="text.secondary">Monthly revenue and transaction volume</Typography>
          </Box>
          {revenueTrendLoading
            ? <LinearProgress />
            : revenueTrend.length === 0
              ? <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}><Typography variant="body2">No trend data available</Typography></Box>
              : <Box sx={{ p: 2 }}>
                  <ReactApexChart type="line" series={trendLineSeries} options={trendLineOptions} height={260} />
                </Box>
          }
        </Card>

      </DashboardContent>
    </>
  );
}
