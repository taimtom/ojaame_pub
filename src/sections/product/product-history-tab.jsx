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
import { effectiveSaleLineQuantity, formatSaleQtyDisplay } from 'src/utils/sale-line-quantity';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import Link from '@mui/material/Link';

import { Chart, useChart } from 'src/components/chart';
import { EmptyContent } from 'src/components/empty-content';
import { useGetProductMovements, useGetProductSalesHistory } from 'src/actions/product';

// Status colours matching the existing product history table
const STATUS_COLORS = {
  received: 'success',
  adjust: 'warning',
  'stock edited': 'info',
  sold: 'error',
  voidsales: 'default',
  paid: 'success',
  partially_paid: 'warning',
  draft: 'default',
  cancelled: 'error',
  // Stock loss / waste statuses
  damaged: 'error',
  wasted: 'warning',
  expired: 'warning',
  stolen: 'error',
  lost: 'default',
};

// Which movement statuses count as "purchase" (stock additions)
const PURCHASE_STATUSES = ['received', 'adjust', 'stock edited'];
// Which movement statuses count as "sale"
const SALE_STATUSES = ['sold', 'voidsales'];

// ─── Helpers ────────────────────────────────────────────────────────────────

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
  const sorted = Object.entries(map).sort(
    (a, b) => new Date(a[0]) - new Date(b[0])
  );
  return {
    categories: sorted.map(([d]) => d),
    series: sorted.map(([, v]) => v),
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PurchaseListView({ rows, loading }) {
  const columns = [
    {
      field: 'created_at',
      headerName: 'Date',
      width: 160,
      renderCell: ({ value }) => (
        <Typography variant="body2">{value ? fDateTime(value) : '—'}</Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Type',
      width: 140,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          label={value || '—'}
          color={STATUS_COLORS[value] || 'default'}
          variant="soft"
        />
      ),
    },
    {
      field: 'previous_quantity',
      headerName: 'Stock Before',
      width: 130,
      type: 'number',
      headerAlign: 'left',
      align: 'left',
    },
    {
      field: 'quantity',
      headerName: 'Qty Changed',
      width: 130,
      type: 'number',
      headerAlign: 'left',
      align: 'left',
      renderCell: ({ value }) => (
        <Typography variant="body2" sx={{ color: value > 0 ? 'success.main' : 'error.main' }}>
          {value > 0 ? `+${value}` : value}
        </Typography>
      ),
    },
    {
      field: 'updated_quantity',
      headerName: 'Stock After',
      width: 130,
      type: 'number',
      headerAlign: 'left',
      align: 'left',
    },
    {
      field: 'user_name',
      headerName: 'Updated By',
      flex: 1,
      minWidth: 140,
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
          noRowsOverlay: () => <EmptyContent title="No purchase history yet" />,
          noResultsOverlay: () => <EmptyContent title="No results found" />,
        }}
        sx={{ [`& .${gridClasses.cell}`]: { alignItems: 'center', display: 'inline-flex' } }}
      />
    </Box>
  );
}

function SaleListView({ rows, loading, storeSlug }) {
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
      width: 180,
      renderCell: ({ row, value }) => {
        const label = value || '—';
        const saleId = row.sale_id;
        if (storeSlug && saleId != null && label !== '—') {
          return (
            <Link
              component={RouterLink}
              href={paths.dashboard.invoice.details(storeSlug, saleId)}
              variant="body2"
              color="primary"
              underline="hover"
              onClick={(e) => e.stopPropagation()}
            >
              {label}
            </Link>
          );
        }
        return <Typography variant="body2">{label}</Typography>;
      },
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
      width: 110,
      headerAlign: 'left',
      align: 'left',
      renderCell: ({ row }) => (
        <Typography variant="body2">{formatSaleQtyDisplay(row.quantity)}</Typography>
      ),
    },
    {
      field: 'price',
      headerName: 'Unit Price',
      width: 120,
      renderCell: ({ value }) => (
        <Typography variant="body2">{fCurrency(value)}</Typography>
      ),
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
          noRowsOverlay: () => <EmptyContent title="No sale history yet" />,
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

// ─── Main export ─────────────────────────────────────────────────────────────

export function ProductPurchaseHistoryTab({ storeId, productId }) {
  const [subTab, setSubTab] = useState('list');
  const { productMovements, productMovementsLoading } = useGetProductMovements(storeId, productId);
  const theme = useTheme();

  const rows = useMemo(
    () => productMovements.filter((r) => PURCHASE_STATUSES.includes(r.status)),
    [productMovements]
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

      {subTab === 'list' && <PurchaseListView rows={rows} loading={productMovementsLoading} />}
      {subTab === 'chart' && (
        <HistoryLineChart
          rows={rows}
          dateKey="created_at"
          valueKey="quantity"
          seriesName="Qty Received"
          color={theme.palette.success.main}
        />
      )}
    </Box>
  );
}

export function ProductSaleHistoryTab({ storeId, storeSlug, productId }) {
  const [subTab, setSubTab] = useState('list');
  const { productSalesHistory, productSalesHistoryLoading } = useGetProductSalesHistory(
    storeId,
    productId
  );
  const theme = useTheme();

  const saleRowsNormalized = useMemo(
    () =>
      productSalesHistory.map((r) => ({
        ...r,
        quantity: effectiveSaleLineQuantity(r),
      })),
    [productSalesHistory]
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
        <SaleListView
          rows={saleRowsNormalized}
          loading={productSalesHistoryLoading}
          storeSlug={storeSlug}
        />
      )}
      {subTab === 'chart' && (
        <HistoryLineChart
          rows={saleRowsNormalized}
          dateKey="sale_date"
          valueKey="quantity"
          seriesName="Qty Sold"
          color={theme.palette.error.main}
        />
      )}
    </Box>
  );
}
