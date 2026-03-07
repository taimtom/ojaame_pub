import { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';

import { fCurrency } from 'src/utils/format-number';
import { paramCase } from 'src/utils/change-case';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuthContext } from 'src/auth/hooks';
import { ReportViewToggle } from 'src/components/report-view-toggle';
import { useStoreProfitLoss } from 'src/actions/reports';

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

const PERIODS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
];

function PLRow({ label, value, indent = false, bold = false, color }) {
  return (
    <TableRow>
      <TableCell sx={{ pl: indent ? 4 : 2, fontWeight: bold ? 700 : 400, color: color || 'text.primary' }}>
        {label}
      </TableCell>
      <TableCell align="right" sx={{ fontWeight: bold ? 700 : 400, color: color || 'text.primary' }}>
        {fCurrency(value ?? 0)}
      </TableCell>
    </TableRow>
  );
}

function SectionHeader({ label }) {
  return (
    <TableRow sx={{ bgcolor: 'action.hover' }}>
      <TableCell colSpan={2} sx={{ fontWeight: 700, py: 1, textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.5, color: 'text.secondary' }}>
        {label}
      </TableCell>
    </TableRow>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StoreProfitLossReportPage() {
  const { storeParam } = useParams();
  const storeId = getStoreId(storeParam);
  const { user } = useAuthContext();
  const companyId = user?.company_id;
  const [period, setPeriod] = useState('30d');
  const [plMode, setPlMode] = useState('list');
  const [breakdownMode, setBreakdownMode] = useState('list');

  const { profitLoss, profitLossLoading, profitLossError } = useStoreProfitLoss(companyId, storeId, period);

  const isProfit = (profitLoss?.net_profit ?? 0) >= 0;

  // ── Chart configs ──────────────────────────────────────────────────────────

  const plBarCategories = ['Gross Sales', 'Net Sales', 'Gross Profit', 'Total Costs', 'Net Profit'];
  const plBarValues = profitLoss
    ? [
        profitLoss.gross_sales,
        profitLoss.net_sales,
        profitLoss.gross_profit,
        profitLoss.total_costs,
        profitLoss.net_profit,
      ]
    : [0, 0, 0, 0, 0];

  const plBarColors = plBarValues.map((v, i) =>
    i === 3 ? '#FF5630' : v >= 0 ? '#00A76F' : '#FF5630'
  );

  const plBarOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: {
      bar: {
        columnWidth: '55%',
        borderRadius: 4,
        distributed: true,
      },
    },
    xaxis: { categories: plBarCategories, labels: { style: { fontSize: '11px' } } },
    yaxis: { labels: { formatter: (v) => fCurrency(v) } },
    tooltip: { y: { formatter: (v) => fCurrency(v) } },
    colors: plBarColors,
    dataLabels: { enabled: false },
    legend: { show: false },
  };

  const plBarSeries = [{ name: 'Amount', data: plBarValues }];

  const breakdownStores = profitLoss?.store_breakdown || [];
  const breakdownOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
    xaxis: { categories: breakdownStores.map((s) => s.store_name) },
    yaxis: { labels: { formatter: (v) => fCurrency(v) } },
    tooltip: { y: { formatter: (v) => fCurrency(v) } },
    legend: { position: 'top' },
    colors: ['#00A76F', '#003768'],
    dataLabels: { enabled: false },
  };

  const breakdownSeries = [
    { name: 'Revenue', data: breakdownStores.map((s) => s.revenue) },
    { name: 'Profit', data: breakdownStores.map((s) => s.profit) },
  ];

  return (
    <>
      <Helmet><title>Profit &amp; Loss | Dashboard</title></Helmet>
      <DashboardContent maxWidth="lg">

        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Profit &amp; Loss</Typography>
            <Typography variant="body2" color="text.secondary">
              {profitLoss ? `${profitLoss.start_date?.slice(0, 10)} → ${profitLoss.end_date?.slice(0, 10)}` : 'Income statement for selected period'}
            </Typography>
          </Box>
          <FormControl size="small" sx={{ width: 160 }}>
            <InputLabel>Period</InputLabel>
            <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
              {PERIODS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>

        {profitLossError && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
            <Typography color="error" variant="body2">Could not load report. {profitLossError?.message || 'Please try again.'}</Typography>
          </Box>
        )}

        {/* Summary chips */}
        {profitLoss && (
          <Stack direction="row" spacing={1.5} mb={3} flexWrap="wrap">
            <Chip label={`Net Sales ${fCurrency(profitLoss.net_sales)}`} color="info" variant="outlined" />
            <Chip label={`COGS ${fCurrency(profitLoss.cost_of_goods_sold)}`} color="warning" variant="outlined" />
            <Chip
              label={`Net Profit ${fCurrency(profitLoss.net_profit)} (${profitLoss.net_profit_margin?.toFixed(1)}%)`}
              color={isProfit ? 'success' : 'error'}
            />
          </Stack>
        )}

        {/* P&L Statement */}
        <Card sx={{ mb: 3 }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" fontWeight={700}>Income Statement</Typography>
            {profitLoss && <ReportViewToggle value={plMode} onChange={setPlMode} />}
          </Box>

          {profitLossLoading && <LinearProgress />}

          {!profitLoss && !profitLossLoading && (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}>
              <Typography variant="body2">No data available for this period</Typography>
            </Box>
          )}

          {profitLoss && plMode === 'list' && (
            <Table>
              <TableBody>
                <SectionHeader label="Revenue" />
                <PLRow label="Gross Sales" value={profitLoss.gross_sales} indent />
                <PLRow label="Discounts" value={-Math.abs(profitLoss.discounts)} indent color="error.main" />
                <PLRow label="Net Sales" value={profitLoss.net_sales} bold />

                <TableRow><TableCell colSpan={2}><Divider /></TableCell></TableRow>

                <SectionHeader label="Cost of Goods Sold" />
                <PLRow label="Cost of Goods Sold" value={profitLoss.cost_of_goods_sold} indent color="error.main" />
                <PLRow label="Gross Profit" value={profitLoss.gross_profit} bold color={profitLoss.gross_profit >= 0 ? 'success.main' : 'error.main'} />
                <TableRow>
                  <TableCell sx={{ pl: 2, color: 'text.secondary', fontSize: 12 }}>Gross Margin</TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontSize: 12 }}>{profitLoss.gross_profit_margin?.toFixed(1)}%</TableCell>
                </TableRow>

                <TableRow><TableCell colSpan={2}><Divider /></TableCell></TableRow>

                <SectionHeader label="Operating Expenses" />
                <PLRow label="Operating Expenses" value={profitLoss.operating_expenses} indent color="error.main" />
                <PLRow label="Total Costs" value={profitLoss.total_costs} bold color="error.main" />

                <TableRow><TableCell colSpan={2}><Divider /></TableCell></TableRow>

                <SectionHeader label="Net Profit" />
                <PLRow label="Net Profit / (Loss)" value={profitLoss.net_profit} bold color={isProfit ? 'success.main' : 'error.main'} />
                <TableRow>
                  <TableCell sx={{ pl: 2, color: 'text.secondary', fontSize: 12 }}>Net Profit Margin</TableCell>
                  <TableCell align="right" sx={{ color: isProfit ? 'success.main' : 'error.main', fontSize: 12, fontWeight: 600 }}>{profitLoss.net_profit_margin?.toFixed(1)}%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          {profitLoss && plMode === 'chart' && (
            <Box sx={{ p: 2 }}>
              <ReactApexChart type="bar" series={plBarSeries} options={plBarOptions} height={300} />
            </Box>
          )}
        </Card>

        {/* Store breakdown */}
        {breakdownStores.length > 1 && (
          <Card>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" fontWeight={700}>Store Breakdown</Typography>
              <ReportViewToggle value={breakdownMode} onChange={setBreakdownMode} />
            </Box>

            {breakdownMode === 'list'
              ? (
                <Table size="small">
                  <TableBody>
                    {breakdownStores.map((s) => (
                      <TableRow key={s.store_id} hover>
                        <TableCell>{s.store_name}</TableCell>
                        <TableCell align="right">{fCurrency(s.revenue)}</TableCell>
                        <TableCell align="right">{fCurrency(s.profit)}</TableCell>
                        <TableCell align="right">
                          <Chip size="small" label={`${s.profit_margin?.toFixed(1)}%`}
                            color={s.profit_margin >= 0 ? 'success' : 'error'} sx={{ height: 20, fontSize: 11 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
              : (
                <Box sx={{ p: 2 }}>
                  <ReactApexChart type="bar" series={breakdownSeries} options={breakdownOptions} height={260} />
                </Box>
              )
            }
          </Card>
        )}

      </DashboardContent>
    </>
  );
}
