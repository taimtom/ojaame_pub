import { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

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

import { fCurrency, fPercent } from 'src/utils/format-number';
import { paramCase } from 'src/utils/change-case';
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { ReportViewToggle } from 'src/components/report-view-toggle';
import {
  useStoreDailySales,
  useStoreWeeklySales,
  useStoreMonthlySales,
} from 'src/actions/dashboard';
import { useStoreSalesTrend, useStoreDashboardStats } from 'src/actions/reports';

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

function KpiCard({ icon, label, value, trend, color = 'primary.main', loading }) {
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
                  {trend != null && (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Iconify icon={trend >= 0 ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'} width={14} sx={{ color: trend >= 0 ? 'success.main' : 'error.main' }} />
                      <Typography variant="caption" sx={{ color: trend >= 0 ? 'success.main' : 'error.main' }}>
                        {trend >= 0 ? '+' : ''}{fPercent(trend)} vs prior period
                      </Typography>
                    </Stack>
                  )}
                </>}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const TREND_PERIODS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const STAT_PERIODS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
];

const CHART_COLORS = ['#00A76F', '#003768'];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StoreSalesTrendsReportPage() {
  const { storeParam } = useParams();
  const storeId = getStoreId(storeParam);
  const [trendPeriod, setTrendPeriod] = useState('30d');
  const [statPeriod, setStatPeriod] = useState('30d');
  const [trendMode, setTrendMode] = useState('list');
  const [sellersMode, setSellersMode] = useState('list');

  const { dailySales, dailySalesLoading } = useStoreDailySales(storeId);
  const { weeklySales, weeklySalesLoading } = useStoreWeeklySales(storeId);
  const { monthlySales, monthlySalesLoading } = useStoreMonthlySales(storeId);
  const { trend, trendLoading } = useStoreSalesTrend(storeId, trendPeriod);
  const { stats, statsLoading } = useStoreDashboardStats(storeId, statPeriod);

  const totalTrendRevenue = trend.reduce((s, t) => s + (t.revenue || 0), 0);
  const totalTrendTxn = trend.reduce((s, t) => s + (t.transactions || 0), 0);
  const topSellers = (stats?.best_by_revenue || []).slice(0, 8);
  const hourlyBreakdown = dailySales?.hourly_breakdown || [];

  // ── Chart configs ──────────────────────────────────────────────────────────

  const trendChartOptions = {
    chart: { type: 'line', toolbar: { show: false }, zoom: { enabled: false } },
    stroke: { width: [0, 3], curve: 'smooth' },
    plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
    xaxis: {
      categories: trend.map((t) => t.date?.slice(5) || t.date),
      labels: { rotate: -45, style: { fontSize: '11px' } },
    },
    yaxis: [
      { title: { text: 'Transactions' }, labels: { formatter: (v) => Math.round(v) } },
      { opposite: true, title: { text: 'Revenue' }, labels: { formatter: (v) => fCurrency(v) } },
    ],
    tooltip: {
      shared: true,
      y: [
        { formatter: (v) => `${v} txns` },
        { formatter: (v) => fCurrency(v) },
      ],
    },
    legend: { position: 'top' },
    colors: CHART_COLORS,
    dataLabels: { enabled: false },
  };

  const trendChartSeries = [
    { name: 'Transactions', type: 'bar', data: trend.map((t) => t.transactions || 0) },
    { name: 'Revenue', type: 'line', data: trend.map((t) => t.revenue || 0) },
  ];

  const sellersChartOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 4 } },
    xaxis: { labels: { formatter: (v) => fCurrency(v) } },
    yaxis: { labels: { style: { fontSize: '11px' } } },
    tooltip: { y: { formatter: (v) => fCurrency(v) } },
    colors: [CHART_COLORS[0]],
    dataLabels: { enabled: false },
    legend: { show: false },
  };

  const sellersChartSeries = [{
    name: 'Revenue',
    data: topSellers.map((item) => ({ x: item.name, y: item.total_revenue })),
  }];

  const hourlyChartOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: '60%', borderRadius: 4 } },
    xaxis: { categories: hourlyBreakdown.map((h) => h.hour) },
    yaxis: { labels: { formatter: (v) => fCurrency(v) } },
    tooltip: { y: { formatter: (v) => fCurrency(v) } },
    colors: [CHART_COLORS[0]],
    dataLabels: { enabled: false },
    legend: { show: false },
  };

  const hourlyChartSeries = [{ name: 'Revenue', data: hourlyBreakdown.map((h) => h.revenue || 0) }];

  return (
    <>
      <Helmet><title>Sales Trends | Dashboard</title></Helmet>
      <DashboardContent maxWidth="xl">

        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Sales Trends</Typography>
            <Typography variant="body2" color="text.secondary">Daily, weekly and monthly performance</Typography>
          </Box>
        </Stack>

        {/* KPI row */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
          <KpiCard icon="solar:sun-bold" label="Today" value={fCurrency(dailySales?.total_sales ?? 0)} trend={dailySales?.change_percentage} color="warning.main" loading={dailySalesLoading} />
          <KpiCard icon="solar:calendar-date-bold" label="This Week" value={fCurrency(weeklySales?.total_value ?? 0)} trend={weeklySales?.change_percentage} color="info.main" loading={weeklySalesLoading} />
          <KpiCard icon="solar:calendar-bold" label="This Month" value={fCurrency(monthlySales?.total_value ?? 0)} trend={monthlySales?.change_percentage} color="success.main" loading={monthlySalesLoading} />
          <KpiCard icon="solar:cart-large-bold" label="Avg Transaction" value={fCurrency(stats?.avg_transaction_value ?? 0)} color="primary.main" loading={statsLoading} />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>

          {/* Daily trend */}
          <Card sx={{ flex: 2 }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Sales Trend</Typography>
                <Typography variant="caption" color="text.secondary">
                  {totalTrendTxn} transactions · {fCurrency(totalTrendRevenue)} total
                </Typography>
              </Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FormControl size="small" sx={{ width: 140 }}>
                  <InputLabel>Period</InputLabel>
                  <Select value={trendPeriod} label="Period" onChange={(e) => setTrendPeriod(e.target.value)}>
                    {TREND_PERIODS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <ReportViewToggle value={trendMode} onChange={setTrendMode} />
              </Stack>
            </Box>

            {trendLoading
              ? <LinearProgress />
              : trendMode === 'list'
                ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Transactions</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Avg/Txn</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trend.length === 0
                        ? <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.disabled' }}>No data for this period</TableCell></TableRow>
                        : trend.map((t, i) => (
                            <TableRow key={i} hover>
                              <TableCell>{t.date}</TableCell>
                              <TableCell align="right">{t.transactions}</TableCell>
                              <TableCell align="right">{fCurrency(t.revenue)}</TableCell>
                              <TableCell align="right">{t.transactions > 0 ? fCurrency(t.revenue / t.transactions) : '—'}</TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                )
                : trend.length === 0
                  ? <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}><Typography variant="body2">No data for this period</Typography></Box>
                  : <Box sx={{ p: 2 }}>
                      <ReactApexChart type="line" series={trendChartSeries} options={trendChartOptions} height={280} />
                    </Box>
            }
          </Card>

          {/* Top sellers */}
          <Card sx={{ flex: 1 }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={700}>Top Sellers</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FormControl size="small" sx={{ width: 130 }}>
                  <InputLabel>Period</InputLabel>
                  <Select value={statPeriod} label="Period" onChange={(e) => setStatPeriod(e.target.value)}>
                    {STAT_PERIODS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <ReportViewToggle value={sellersMode} onChange={setSellersMode} />
              </Stack>
            </Box>

            {statsLoading
              ? <LinearProgress />
              : sellersMode === 'list'
                ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topSellers.length === 0
                        ? <TableRow><TableCell colSpan={2} align="center" sx={{ py: 4, color: 'text.disabled' }}>No data</TableCell></TableRow>
                        : topSellers.map((item) => (
                            <TableRow key={item.id} hover>
                              <TableCell>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Chip size="small" label={item.type} color={item.type === 'product' ? 'info' : 'warning'} sx={{ height: 18, fontSize: 10 }} />
                                  <Typography variant="body2" noWrap sx={{ maxWidth: 110 }}>{item.name}</Typography>
                                </Stack>
                              </TableCell>
                              <TableCell align="right">{fCurrency(item.total_revenue)}</TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                )
                : topSellers.length === 0
                  ? <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}><Typography variant="body2">No data</Typography></Box>
                  : <Box sx={{ p: 2 }}>
                      <ReactApexChart type="bar" series={sellersChartSeries} options={sellersChartOptions} height={280} />
                    </Box>
            }
          </Card>

        </Stack>

        {/* Hourly breakdown */}
        {hourlyBreakdown.length > 0 && (
          <Card>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={700}>Today&apos;s Hourly Breakdown</Typography>
              <Typography variant="caption" color="text.secondary">
                Peak hour: {dailySales?.peak_hour ?? '—'}
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <ReactApexChart type="bar" series={hourlyChartSeries} options={hourlyChartOptions} height={200} />
            </Box>
          </Card>
        )}

      </DashboardContent>
    </>
  );
}
