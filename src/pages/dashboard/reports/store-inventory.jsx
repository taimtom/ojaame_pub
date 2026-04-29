import { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrency } from 'src/utils/format-number';
import { paramCase } from 'src/utils/change-case';
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { ReportViewToggle } from 'src/components/report-view-toggle';
import { ReportPeriodSelector } from 'src/components/report-period-selector';
import {
  useStoreDashboardStats,
  useStoreInventoryAlerts,
  useStoreCategoryPerformance,
} from 'src/actions/reports';

// ── helpers ───────────────────────────────────────────────────────────────────

function getStoreId(storeParam) {
  if (storeParam) return storeParam.split('-').pop();
  try {
    const raw = localStorage.getItem('activeWorkspace');
    if (raw) {
      const { storeName, id } = JSON.parse(raw);
      if (storeName && id) {
        const slug = `${paramCase(storeName)}-${id}`;
        return slug.split('-').pop();
      }
    }
  } catch { /* ignore */ }
  return null;
}

function StatCard({ icon, label, value, color = 'primary.main', loading }) {
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


const DONUT_COLORS = ['#00A76F', '#003768', '#FFAB00', '#FF5630', '#00B8D9', '#8E33FF', '#22C55E', '#FF3030'];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StoreInventoryReportPage() {
  const { storeParam } = useParams();
  const storeId = getStoreId(storeParam);
  const [periodState, setPeriodState] = useState({ period: 'this_month', month: null, year: null, date: null });
  const { period, month, year, date } = periodState;
  const [topMode, setTopMode] = useState('list');
  const [alertsMode, setAlertsMode] = useState('list');

  const { stats, statsLoading } = useStoreDashboardStats(storeId, period, month, year, date);
  const { alerts, alertsLoading } = useStoreInventoryAlerts(storeId);
  const { categories, categoryLoading } = useStoreCategoryPerformance(storeId, period, month, year, date);

  const topByVolume = stats?.best_by_volume || [];
  const outOfStock = alerts.filter((a) => a.status === 'out_of_stock');
  const lowStock = alerts.filter((a) => a.status === 'low_stock');

  // ── Chart configs ──────────────────────────────────────────────────────────

  const topSellersOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 4 } },
    xaxis: { labels: { formatter: (v) => fCurrency(v) } },
    yaxis: { labels: { style: { fontSize: '11px' }, maxWidth: 130 } },
    tooltip: { y: { formatter: (v) => fCurrency(v) } },
    colors: ['#00A76F'],
    dataLabels: { enabled: false },
    legend: { show: false },
  };

  const topSellersSeries = [{
    name: 'Revenue',
    data: topByVolume.slice(0, 8).map((item) => ({ x: item.name, y: item.total_revenue })),
  }];

  const stockAlertsOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 4 } },
    xaxis: { labels: { formatter: (v) => Math.round(v) } },
    yaxis: { labels: { style: { fontSize: '11px' }, maxWidth: 130 } },
    tooltip: { shared: true },
    legend: { position: 'top' },
    colors: ['#003768', '#FF5630'],
    dataLabels: { enabled: false },
  };

  const stockAlertsSeries = [
    { name: 'Current Stock', data: alerts.map((a) => ({ x: a.product_name, y: a.current_stock })) },
    { name: 'Reorder Level', data: alerts.map((a) => ({ x: a.product_name, y: a.reorder_level || 0 })) },
  ];

  const categoryDonutOptions = {
    chart: { type: 'donut' },
    labels: categories.map((c) => c.category),
    legend: { position: 'bottom' },
    tooltip: { y: { formatter: (v) => fCurrency(v) } },
    colors: DONUT_COLORS,
    dataLabels: { formatter: (v) => `${v.toFixed(1)}%` },
    plotOptions: { pie: { donut: { size: '65%' } } },
  };
  const categoryDonutSeries = categories.map((c) => c.revenue);

  return (
    <>
      <Helmet><title>Inventory Report | Dashboard</title></Helmet>
      <DashboardContent maxWidth="xl">

        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Inventory Report</Typography>
            <Typography variant="body2" color="text.secondary">
              Stock levels, top-selling items &amp; alerts
            </Typography>
          </Box>
          <ReportPeriodSelector period={period} onChange={setPeriodState} />
        </Stack>

        {/* KPI cards */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
          <StatCard icon="solar:box-bold" label="Total Items Sold" value={stats?.total_items_sold?.toLocaleString() ?? '—'} color="info.main" loading={statsLoading} />
          <StatCard icon="solar:dollar-minimalistic-bold" label="Total Revenue" value={fCurrency(stats?.total_revenue ?? 0)} color="success.main" loading={statsLoading} />
          <StatCard icon="solar:danger-triangle-bold" label="Low Stock Alerts" value={lowStock.length} color="warning.main" loading={alertsLoading} />
          <StatCard icon="solar:close-circle-bold" label="Out of Stock" value={outOfStock.length} color="error.main" loading={alertsLoading} />
        </Stack>

        {/* Top products by volume */}
        <Card sx={{ mb: 3 }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" fontWeight={700}>Top Selling Items (by Quantity)</Typography>
            <ReportViewToggle value={topMode} onChange={setTopMode} />
          </Box>
          {statsLoading
            ? <LinearProgress />
            : topMode === 'list'
              ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Item</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Qty Sold</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Avg Price</TableCell>
                      <TableCell align="right">Profit Margin</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topByVolume.length === 0
                      ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.disabled' }}>No sales data for this period</TableCell></TableRow>
                      : topByVolume.map((item, idx) => (
                        <TableRow key={item.id} hover>
                          <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                          <TableCell><Typography variant="body2" fontWeight={600}>{item.name}</Typography></TableCell>
                          <TableCell>
                            <Chip size="small" label={item.type} color={item.type === 'product' ? 'info' : 'warning'} sx={{ height: 20, fontSize: 11 }} />
                          </TableCell>
                          <TableCell align="right">{item.total_quantity?.toLocaleString()}</TableCell>
                          <TableCell align="right">{fCurrency(item.total_revenue)}</TableCell>
                          <TableCell align="right">{fCurrency(item.avg_price)}</TableCell>
                          <TableCell align="right">
                            <Chip size="small" label={`${item.profit_margin?.toFixed(1)}%`}
                              color={item.profit_margin >= 20 ? 'success' : item.profit_margin >= 5 ? 'warning' : 'error'}
                              sx={{ height: 20, fontSize: 11 }} />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )
              : topByVolume.length === 0
                ? <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}><Typography variant="body2">No sales data for this period</Typography></Box>
                : <Box sx={{ p: 2 }}>
                    <ReactApexChart type="bar" series={topSellersSeries} options={topSellersOptions} height={Math.max(200, topByVolume.slice(0, 8).length * 36)} />
                  </Box>
          }
        </Card>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>

          {/* Stock alerts */}
          {alerts.length > 0 && (
            <Card sx={{ flex: 1 }}>
              <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight={700}>Stock Alerts</Typography>
                <ReportViewToggle value={alertsMode} onChange={setAlertsMode} />
              </Box>
              {alertsLoading
                ? <LinearProgress />
                : alertsMode === 'list'
                  ? (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Current Stock</TableCell>
                          <TableCell align="right">Reorder Level</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {alerts.map((a) => (
                          <TableRow key={a.product_id} hover>
                            <TableCell><Typography variant="body2" fontWeight={600}>{a.product_name}</Typography></TableCell>
                            <TableCell align="right">{a.current_stock}</TableCell>
                            <TableCell align="right">{a.reorder_level}</TableCell>
                            <TableCell>
                              <Chip size="small"
                                label={a.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                                color={a.status === 'out_of_stock' ? 'error' : 'warning'}
                                sx={{ height: 20, fontSize: 11 }} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )
                  : <Box sx={{ p: 2 }}>
                      <ReactApexChart type="bar" series={stockAlertsSeries} options={stockAlertsOptions} height={Math.max(200, alerts.length * 40)} />
                    </Box>
              }
            </Card>
          )}

          {/* Category performance donut */}
          {(categoryLoading || categories.length > 0) && (
            <Card sx={{ flex: 1 }}>
              <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight={700}>Revenue by Category</Typography>
                <Typography variant="caption" color="text.secondary">Product category distribution</Typography>
              </Box>
              {categoryLoading
                ? <LinearProgress />
                : categories.length === 0
                  ? <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}><Typography variant="body2">No category data</Typography></Box>
                  : <Box sx={{ p: 2 }}>
                      <ReactApexChart type="donut" series={categoryDonutSeries} options={categoryDonutOptions} height={300} />
                    </Box>
              }
            </Card>
          )}

        </Stack>

      </DashboardContent>
    </>
  );
}
