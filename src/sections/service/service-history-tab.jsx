import { useState, useMemo } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { DataGrid, gridClasses } from '@mui/x-data-grid';

import { fDateTime } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Chart, useChart } from 'src/components/chart';
import { EmptyContent } from 'src/components/empty-content';
import { useGetServiceSaleHistory } from 'src/actions/service';

const STATUS_COLORS = {
  paid: 'success',
  partially_paid: 'warning',
  draft: 'default',
  cancelled: 'error',
  unknown: 'default',
};

function groupByDate(rows, dateKey, valueKey) {
  const map = {};
  rows.forEach((row) => {
    const raw = row[dateKey];
    if (!raw) return;
    const day = new Date(raw).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    map[day] = (map[day] || 0) + (Number(row[valueKey]) || 0);
  });
  const sorted = Object.entries(map).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  return {
    categories: sorted.map(([d]) => d),
    series: sorted.map(([, v]) => v),
  };
}

function SaleListView({ rows, loading }) {
  const columns = [
    {
      field: 'sale_date',
      headerName: 'Date',
      width: 160,
      renderCell: ({ value }) => (
        <Typography variant="body2">{value ? fDateTime(value) : '—'}</Typography>
      ),
    },
    {
      field: 'invoice_number',
      headerName: 'Invoice',
      width: 160,
    },
    {
      field: 'customer_name',
      headerName: 'Customer',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'quantity',
      headerName: 'Qty',
      width: 90,
      type: 'number',
      headerAlign: 'left',
      align: 'left',
    },
    {
      field: 'price',
      headerName: 'Unit Price',
      width: 120,
      renderCell: ({ value }) => <Typography variant="body2">{fCurrency(value)}</Typography>,
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 120,
      renderCell: ({ value }) => (
        <Typography variant="body2" fontWeight="medium">
          {fCurrency(value)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          label={value || '—'}
          color={STATUS_COLORS[value] || 'default'}
          variant="soft"
        />
      ),
    },
  ];

  return (
    <Box sx={{ height: 420 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        getRowHeight={() => 'auto'}
        pageSizeOptions={[5, 10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        disableRowSelectionOnClick
        slots={{
          noRowsOverlay: () => <EmptyContent title="No history yet" />,
          noResultsOverlay: () => <EmptyContent title="No results found" />,
        }}
        sx={{ [`& .${gridClasses.cell}`]: { alignItems: 'center', display: 'inline-flex' } }}
      />
    </Box>
  );
}

function HistoryLineChart({ rows, dateKey, valueKey, seriesName, color }) {
  const theme = useTheme();
  const { categories, series } = useMemo(
    () => groupByDate(rows, dateKey, valueKey),
    [rows, dateKey, valueKey]
  );

  const chartOptions = useChart({
    colors: [color || theme.palette.primary.main],
    xaxis: { categories },
    yaxis: { title: { text: 'Quantity' } },
    tooltip: { y: { formatter: (v) => `${v} units` } },
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 4 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 },
    },
  });

  if (!categories.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <EmptyContent title="No chart data available" />
      </Box>
    );
  }

  return (
    <Chart
      type="area"
      series={[{ name: seriesName, data: series }]}
      options={chartOptions}
      height={300}
    />
  );
}

// ─── Purchase History ────────────────────────────────────────────────────────
// Services don't have stock-in cycles; this tab notes that purchase history
// is not applicable and displays service session/booking info if available.

export function ServicePurchaseHistoryTab({ storeId, serviceId }) {
  const [subTab, setSubTab] = useState('list');
  const { serviceSaleHistory, serviceSaleHistoryLoading } = useGetServiceSaleHistory(
    storeId,
    serviceId
  );
  const theme = useTheme();

  // Purchase = bookings in non-completed states (draft / pending)
  const rows = useMemo(
    () => serviceSaleHistory.filter((r) => ['draft', 'partially_paid'].includes(r.status)),
    [serviceSaleHistory]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Purchase History</Typography>
        <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} sx={{ minHeight: 36 }}>
          <Tab value="list" label="List" sx={{ minHeight: 36, py: 0 }} />
          <Tab value="chart" label="Chart" sx={{ minHeight: 36, py: 0 }} />
        </Tabs>
      </Stack>

      {subTab === 'list' && <SaleListView rows={rows} loading={serviceSaleHistoryLoading} />}
      {subTab === 'chart' && (
        <HistoryLineChart
          rows={rows}
          dateKey="sale_date"
          valueKey="quantity"
          seriesName="Sessions Booked"
          color={theme.palette.warning.main}
        />
      )}
    </Box>
  );
}

// ─── Sale History ────────────────────────────────────────────────────────────

export function ServiceSaleHistoryTab({ storeId, serviceId }) {
  const [subTab, setSubTab] = useState('list');
  const { serviceSaleHistory, serviceSaleHistoryLoading } = useGetServiceSaleHistory(
    storeId,
    serviceId
  );
  const theme = useTheme();

  const rows = useMemo(
    () => serviceSaleHistory.filter((r) => ['paid', 'partially_paid'].includes(r.status)),
    [serviceSaleHistory]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Sale History</Typography>
        <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} sx={{ minHeight: 36 }}>
          <Tab value="list" label="List" sx={{ minHeight: 36, py: 0 }} />
          <Tab value="chart" label="Chart" sx={{ minHeight: 36, py: 0 }} />
        </Tabs>
      </Stack>

      {subTab === 'list' && (
        <SaleListView rows={rows} loading={serviceSaleHistoryLoading} />
      )}
      {subTab === 'chart' && (
        <HistoryLineChart
          rows={rows}
          dateKey="sale_date"
          valueKey="quantity"
          seriesName="Sessions Sold"
          color={theme.palette.error.main}
        />
      )}
    </Box>
  );
}
