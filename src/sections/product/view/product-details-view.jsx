import { useState, useMemo, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { isUsageHistoryMovement } from 'src/utils/product-movement-usage';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTabs } from 'src/hooks/use-tabs';

import { fCurrency } from 'src/utils/format-number';
import { effectiveSaleLineQuantity } from 'src/utils/sale-line-quantity';

import { varAlpha } from 'src/theme/styles';
import { PRODUCT_PUBLISH_OPTIONS } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { Chart, useChart } from 'src/components/chart';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { useGetProductMovements, useGetProductSalesHistory } from 'src/actions/product';

import { ProductDetailsSkeleton } from '../product-skeleton';
import { ProductDetailsToolbar } from '../product-details-toolbar';
import { ProductDetailsCarousel } from '../product-details-carousel';
import { ProductDetailsDescription } from '../product-details-description';
import { ProductDashboardSummary } from '../product-dashboard-summary';
import {
  ProductPurchaseHistoryTab,
  ProductSaleHistoryTab,
  ProductUsageHistoryTab,
} from '../product-history-tab';

// ----------------------------------------------------------------------

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
  return { categories: sorted.map(([d]) => d), series: sorted.map(([, v]) => v) };
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StockStatCard({ icon, label, value, color = 'primary', sub }) {
  return (
    <Card sx={{ p: 3, flex: 1 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack spacing={0.5}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ color: `${color}.main` }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {sub}
            </Typography>
          )}
        </Stack>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => varAlpha(theme.vars.palette[color].mainChannel, 0.12),
          }}
        >
          <Iconify icon={icon} width={24} sx={{ color: `${color}.main` }} />
        </Box>
      </Stack>
    </Card>
  );
}

// ─── Combined stock chart ─────────────────────────────────────────────────────

function StockOverviewChart({ purchaseRows, saleRows, outboundLabel = 'Units Sold' }) {
  const theme = useTheme();

  const { categories: purchaseDates, series: purchaseQtys } = useMemo(
    () => groupByDate(purchaseRows, 'created_at', 'quantity'),
    [purchaseRows]
  );
  const { categories: saleDates, series: saleQtys } = useMemo(
    () => groupByDate(saleRows, 'sale_date', 'quantity'),
    [saleRows]
  );

  // Merge date categories from both datasets
  const allDates = useMemo(() => {
    const set = new Set([...purchaseDates, ...saleDates]);
    return [...set].sort((a, b) => new Date(a) - new Date(b));
  }, [purchaseDates, saleDates]);

  const purchaseSeries = allDates.map((d) => {
    const idx = purchaseDates.indexOf(d);
    return idx >= 0 ? purchaseQtys[idx] : 0;
  });
  const saleSeries = allDates.map((d) => {
    const idx = saleDates.indexOf(d);
    return idx >= 0 ? saleQtys[idx] : 0;
  });

  const chartOptions = useChart({
    colors: [theme.palette.success.main, theme.palette.error.main],
    xaxis: { categories: allDates },
    yaxis: { title: { text: 'Quantity' } },
    tooltip: { y: { formatter: (v) => `${v} units` } },
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 4 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 },
    },
    legend: { position: 'top', horizontalAlign: 'right' },
  });

  if (!allDates.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <EmptyContent title="No stock activity yet" />
      </Box>
    );
  }

  return (
    <Chart
      type="area"
      series={[
        { name: 'Stock In', data: purchaseSeries },
        { name: outboundLabel, data: saleSeries },
      ]}
      options={chartOptions}
      height={320}
    />
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────

export function ProductDetailsView({ product, error, loading, storeSlug, storeNameSlug, storeId }) {
  const tabs = useTabs('description');
  const theme = useTheme();

  const [publish, setPublish] = useState('');

  useEffect(() => {
    if (product) setPublish(product?.publish);
  }, [product]);

  const handleChangePublish = useCallback((newValue) => {
    setPublish(newValue);
  }, []);

  const PURCHASE_STATUSES = ['received', 'adjust', 'stock edited'];

  const { productMovements } = useGetProductMovements(storeId, product?.id);
  const { productSalesHistory } = useGetProductSalesHistory(storeId, product?.id);

  const isProductionInput = product?.product_kind === 'production_input';

  const normalizedSaleRows = useMemo(
    () =>
      productSalesHistory.map((r) => ({
        ...r,
        quantity: effectiveSaleLineQuantity(r),
      })),
    [productSalesHistory]
  );

  const usageMovementRows = useMemo(
    () => productMovements.filter(isUsageHistoryMovement),
    [productMovements]
  );

  const usageChartRows = useMemo(
    () =>
      usageMovementRows.map((r) => ({
        sale_date: r.created_at,
        quantity: r.quantity,
      })),
    [usageMovementRows]
  );

  const outboundRows = isProductionInput ? usageChartRows : normalizedSaleRows;

  const purchaseRows = useMemo(
    () => productMovements.filter((r) => PURCHASE_STATUSES.includes(r.status)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productMovements]
  );

  const totalUnitsSold = useMemo(
    () => normalizedSaleRows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0),
    [normalizedSaleRows]
  );

  const totalUnitsUsed = useMemo(
    () => usageMovementRows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0),
    [usageMovementRows]
  );

  const totalRevenue = useMemo(
    () => productSalesHistory.reduce((sum, r) => sum + (Number(r.total) || 0), 0),
    [productSalesHistory]
  );

  const totalReceived = useMemo(
    () => purchaseRows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0),
    [purchaseRows]
  );

  const stockValue = useMemo(() => {
    const qty = product?.available ?? product?.quantity ?? 0;
    const cost = product?.costPrice ?? product?.price ?? 0;
    return qty * cost;
  }, [product]);

  if (loading) {
    return (
      <DashboardContent sx={{ pt: 5 }}>
        <ProductDetailsSkeleton />
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent sx={{ pt: 5 }}>
        <EmptyContent
          filled
          title="Product not found!"
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.product.root(storeSlug)}
              startIcon={<Iconify width={16} icon="eva:arrow-ios-back-fill" />}
              sx={{ mt: 3 }}
            >
              Back to list
            </Button>
          }
          sx={{ py: 10, height: 'auto', flexGrow: 'unset' }}
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <ProductDetailsToolbar
        backLink={paths.dashboard.product.root(storeSlug)}
        editLink={paths.dashboard.product.edit(storeSlug, product?.id)}
        addQtyLink={paths.dashboard.product.addqty(storeSlug, product?.id)}
        adjustLink={paths.dashboard.product.adjust(storeSlug, product?.id)}
        changePriceLink={paths.dashboard.product.changePrice(storeSlug, product?.id)}
        publish={publish}
        onChangePublish={handleChangePublish}
        publishOptions={PRODUCT_PUBLISH_OPTIONS}
      />

      {/* Product overview: image + stock info panel */}
      <Grid container spacing={{ xs: 3, md: 5, lg: 6 }}>
        <Grid xs={12} md={6} lg={5}>
          <ProductDetailsCarousel
            coverUrl={product?.coverUrl}
            images={product?.images ?? []}
            productName={product?.name}
          />
        </Grid>

        <Grid xs={12} md={6} lg={7}>
          {product && <ProductDashboardSummary product={product} />}
        </Grid>
      </Grid>

      {product?.product_kind === 'sellable' && (
        <Card sx={{ mt: 4 }}>
          <Stack sx={{ p: 3 }} spacing={1.5}>
            <Typography variant="h6">Ingredients (per unit sold)</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Production-input products consumed when you sell one unit of this product.
            </Typography>
            {(product.sub_items || product.subItems || []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                None configured. Use <strong>Edit</strong> to add ingredients.
              </Typography>
            ) : (
              <Stack component="ul" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
                {(product.sub_items || product.subItems || []).map((row) => (
                  <Typography
                    component="li"
                    key={row.id ?? `bom-${row.component_product_id}`}
                    variant="body2"
                  >
                    <strong>{row.component_name || `Product #${row.component_product_id}`}</strong>
                    {' — '}
                    {row.quantity_per_unit} per unit sold
                  </Typography>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>
      )}

      {/* Inventory stat cards */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        flexWrap="wrap"
        useFlexGap
        sx={{ mt: 4 }}
      >
        <StockStatCard
          icon="solar:box-bold"
          label="Current Stock"
          value={product?.available ?? product?.quantity ?? 0}
          color={
            (product?.inventoryType === 'out of stock' && 'error') ||
            (product?.inventoryType === 'low stock' && 'warning') ||
            'info'
          }
          sub={product?.inventoryType}
        />
        <StockStatCard
          icon="solar:arrow-down-bold"
          label="Total Stock Received"
          value={totalReceived}
          color="success"
          sub="all time"
        />
        <StockStatCard
          icon="solar:cart-bold"
          label={isProductionInput ? 'Units used' : 'Units Sold'}
          value={isProductionInput ? totalUnitsUsed : totalUnitsSold}
          color="error"
          sub="all time"
        />
        {!isProductionInput && (
          <StockStatCard
            icon="solar:wallet-money-bold"
            label="Total Revenue"
            value={fCurrency(totalRevenue)}
            color="primary"
            sub="from sales"
          />
        )}
        {product?.costPrice != null && (
          <StockStatCard
            icon="solar:safe-square-bold"
            label="Stock Value"
            value={fCurrency(stockValue)}
            color="warning"
          sub="at cost price"
          />
        )}
      </Stack>

      {/* Combined stock overview chart */}
      <Card sx={{ mt: 4 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 3, pt: 3, pb: 1 }}
        >
          <Stack>
            <Typography variant="h6">Stock Overview</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {isProductionInput
                ? 'Stock received vs units used over time'
                : 'Stock received vs units sold over time'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: theme.palette.success.main,
                }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Stock In
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: theme.palette.error.main,
                }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {isProductionInput ? 'Units used' : 'Units Sold'}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <StockOverviewChart
          purchaseRows={purchaseRows}
          saleRows={outboundRows}
          outboundLabel={isProductionInput ? 'Units used' : 'Units Sold'}
        />
      </Card>

      {/* Detail tabs */}
      <Card sx={{ mt: 4 }}>
        <Tabs
          value={tabs.value}
          onChange={tabs.onChange}
          sx={{
            px: 3,
            boxShadow: (t) =>
              `inset 0 -2px 0 0 ${varAlpha(t.vars.palette.grey['500Channel'], 0.08)}`,
          }}
        >
          {[
            { value: 'description', label: 'Description' },
            { value: 'purchase_history', label: 'Purchase History' },
            {
              value: 'sale_history',
              label: isProductionInput ? 'Usage History' : 'Sale History',
            },
          ].map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>

        {tabs.value === 'description' && (
          <ProductDetailsDescription description={product?.description ?? ''} />
        )}

        {tabs.value === 'purchase_history' && (
          <ProductPurchaseHistoryTab storeId={storeId} productId={product?.id} />
        )}

        {tabs.value === 'sale_history' &&
          (isProductionInput ? (
            <ProductUsageHistoryTab storeId={storeId} productId={product?.id} />
          ) : (
            <ProductSaleHistoryTab
              storeId={storeId}
              storeSlug={storeSlug}
              productId={product?.id}
            />
          ))}
      </Card>
    </DashboardContent>
  );
}
