import React, { useState, useCallback, useMemo } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { fCurrency, fPercent } from 'src/utils/format-number';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { SeoIllustration } from 'src/assets/illustrations';
import {
  useStoreExpenses,
  useStoreDailySales,
  useStoreYearlySales,
  useStoreTopProducts,
  useStoreWeeklySales,
  useStoreTopCashiers,
  useStorePerformance,
  useStoreMonthlySales,
  useStoreFeatured,
  useStoreRecentInvoices,
  useStoreSalesByPaymentMethod,
} from 'src/actions/dashboard';

import { Iconify } from 'src/components/iconify';
import { useAuthContext } from 'src/auth/hooks';

import { AppWelcome } from '../app-welcome';
import { AppFeatured } from '../app-featured';
import { AppNewInvoice } from '../app-new-invoice';
import { AppNewProduct } from '../app-new-product';
import { AppPerformance } from '../app-performance';
import { AppTopCashiers } from '../app-top-cashiers';
import { AppYearlySales } from '../app-yearly-sales';
import { AppWidgetSummary } from '../app-widget-summary';
import { AppCurrentDownload } from '../app-current-download';
import { AppExpenseCategories } from '../app-expense-categories';

// ----------------------------------------------------------------------

// Reads active store name from localStorage
function getStoreName() {
  try {
    const raw = localStorage.getItem('activeWorkspace');
    if (raw) {
      const { storeName } = JSON.parse(raw);
      return storeName || null;
    }
  } catch {
    // ignore
  }
  return null;
}

// Normalize raw metric values to 0–100 relative to their max so the radar renders sensibly
function normalizeRadarValues(rawValues) {
  const max = Math.max(...rawValues, 1);
  return rawValues.map((v) => Math.round((v / max) * 100));
}

// ----------------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear();

export function OverviewAppView({ storeId }) {
  const { user } = useAuthContext();
  const theme = useTheme();

  // ── Shared period state (syncs Expenses + Top Products together) ───
  const [period, setPeriod]               = useState('month');
  const [limit, setLimit]                 = useState(10);
  const [invStatus, setInvStatus]         = useState('paid');
  const [invLimit, setInvLimit]           = useState(5);
  const [paymentPeriod, setPaymentPeriod] = useState('month');
  const [selectedYear, setSelectedYear]   = useState(CURRENT_YEAR);

  const handleYearChange = useCallback((year) => setSelectedYear(Number(year)), []);

  // ── Data hooks ─────────────────────────────────────────────────────
  const { recentInvoices, recentInvoicesLoading } =
    useStoreRecentInvoices(storeId, { limit: invLimit, status_filter: invStatus });

  const { salesByPaymentMethod, salesByPaymentMethodLoading } =
    useStoreSalesByPaymentMethod(storeId, paymentPeriod);

  const {
    dailySales = { total_sales: 0, change_percentage: 0, hourly_data: [] },
    dailySalesLoading,
  } = useStoreDailySales(storeId);

  const { weeklySales,      weeklySalesLoading  } = useStoreWeeklySales(storeId);
  const { monthlySales,     monthlySalesLoading } = useStoreMonthlySales(storeId);
  const { expenses,         expensesLoading     } = useStoreExpenses(storeId, period);
  const { topProducts,      topProductsLoading  } = useStoreTopProducts(storeId, period, limit);
  const { performance,      performanceLoading  } = useStorePerformance(storeId);
  const { data: yearlySalesData                 } = useStoreYearlySales(storeId, selectedYear);
  const { featuredProducts, featuredLoading     } = useStoreFeatured(storeId, 3);

  // ── Sparkline data ─────────────────────────────────────────────────

  // Today: hourly breakdown (already in API)
  const hourly  = dailySales.hourly_data || [];
  const hours   = hourly.map((h) => String(h.hour).padStart(2, '0'));
  const amounts = hourly.map((h) => h.amount);

  // Weekly: per-day breakdown now returned by the updated API
  const weeklyDailyData  = weeklySales?.daily_data || [];
  const weeklyCategories = weeklyDailyData.map((d) => d.day);
  const weeklyAmounts    = weeklyDailyData.map((d) => d.amount);

  // Monthly: per-week breakdown now returned by the updated API
  const monthlyDailyData  = monthlySales?.daily_data || [];
  const monthlyCategories = monthlyDailyData.map((d) => d.day);
  const monthlyAmounts    = monthlyDailyData.map((d) => d.amount);

  // KPI totals
  const weeklyTotal  = weeklySales?.total_value       ?? 0;
  const weeklyPct    = weeklySales?.change_percentage ?? 0;
  const monthlyTotal = monthlySales?.total_value       ?? 0;
  const monthlyPct   = monthlySales?.change_percentage ?? 0;

  // Yearly subheader — live year-over-year % from API
  const yoyChange = yearlySalesData?.year_over_year_change ?? null;
  const yearlySalesSubheader = useMemo(() => {
    if (yoyChange === null) return String(selectedYear);
    const sign = yoyChange >= 0 ? '+' : '';
    return `${sign}${fPercent(yoyChange)} vs last year`;
  }, [yoyChange, selectedYear]);

  // ── Radar: normalize all metrics to 0–100 ─────────────────────────
  const perf = performance || {};
  const radarCategories = ['Revenue', 'Transactions', 'Returns', 'New Customers', 'Avg. Basket', 'Footfall'];
  const radarSeries = [{
    name: perf.store_name || getStoreName() || 'Store',
    data: normalizeRadarValues([
      perf.revenue       || 0,
      perf.transactions  || 0,
      perf.returns       || 0,
      perf.new_customers || 0,
      perf.avg_basket    || 0,
      perf.footfall      || 0,
    ]),
  }];

  // ── Expense category chart ─────────────────────────────────────────
  const expenseCats   = expenses?.categories || [];
  const expenseSeries = expenseCats.map((item) => ({ label: item.category, value: item.amount }));
  const iconMap = {
    Entertainment: 'mdi:filmstrip',
    Fuel:          'mdi:gas-station-outline',
    'Fast Food':   'mdi:food-drumstick-outline',
    Cafe:          'mdi:coffee-outline',
    Connection:    'basil:mobile-phone-outline',
    Healthcare:    'solar:medical-kit-bold',
    Fitness:       'ic:round-fitness-center',
    Supermarket:   'solar:cart-3-bold',
    Transportation:'mdi:bus-clock',
    Utilities:     'mdi:flash',
    Education:     'mdi:school-outline',
    Shopping:      'mdi:shopping-outline',
    Travel:        'mdi:airplane-outline',
    Miscellaneous: 'mdi:dots-horizontal-circle-outline',
  };
  const expenseIcons  = expenseCats.map((item) => (
    <Iconify key={item.category} icon={iconMap[item.category] || 'mdi:help-circle-outline'} />
  ));
  const expenseLabels = expenseCats.map((item) => item.category);

  // ── Payment method donut ───────────────────────────────────────────
  const paymentSeries = salesByPaymentMethod.map((m) => ({
    label: m.method_type.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
    value: m.total_amount,
  }));

  // ── No-store guard ─────────────────────────────────────────────────
  if (!storeId) {
    return (
      <DashboardContent>
        <Box
          sx={{
            py: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 2,
          }}
        >
          <Iconify icon="solar:shop-bold-duotone" width={72} sx={{ color: 'text.disabled' }} />
          <Typography variant="h5" color="text.secondary">
            No store selected
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 360 }}>
            Select an active store to view your store dashboard, sales trends, and analytics.
          </Typography>
          <Button
            component={RouterLink}
            href={paths.dashboard.store.list}
            variant="contained"
            size="large"
            startIcon={<Iconify icon="eva:arrow-forward-fill" />}
          >
            Go to Store List
          </Button>
        </Box>
      </DashboardContent>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────
  const storeName  = getStoreName();
  const todayLabel = new Date().toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>

        {/* Welcome banner */}
        <Grid xs={12} md={8}>
          <AppWelcome
            title={`Welcome back 👋 \n ${user?.displayName}`}
            description={
              storeName
                ? `You're viewing the dashboard for ${storeName}. Here's your store performance summary for ${todayLabel}.`
                : `Here's your store performance summary for ${todayLabel}.`
            }
            img={<SeoIllustration hideBackground />}
            action={
              <Button
                component={RouterLink}
                href={paths.dashboard.quickDashboard}
                variant="contained"
                color="primary"
              >
                Quick Sale
              </Button>
            }
          />
        </Grid>

        <Grid xs={12} md={4}>
          <AppFeatured list={featuredProducts} loading={featuredLoading} />
        </Grid>

        {/* KPI summary cards */}
        <Grid xs={12} md={4}>
          <AppWidgetSummary
            title="Today's Sales"
            percent={dailySales.change_percentage}
            total={dailySales.total_sales}
            loading={dailySalesLoading}
            chart={{ categories: hours, series: amounts }}
          />
        </Grid>

        <Grid xs={12} md={4}>
          <AppWidgetSummary
            title="Total Weekly Sales"
            percent={weeklyPct}
            total={weeklyTotal}
            loading={weeklySalesLoading}
            chart={{ categories: weeklyCategories, series: weeklyAmounts }}
          />
        </Grid>

        <Grid xs={12} md={4}>
          <AppWidgetSummary
            title="Total Monthly Sales"
            percent={monthlyPct}
            total={monthlyTotal}
            loading={monthlySalesLoading}
            chart={{
              colors: [theme.vars.palette.info.main],
              categories: monthlyCategories,
              series: monthlyAmounts,
            }}
          />
        </Grid>

        {/* Payment method donut + Expense categories (share the `period` selector) */}
        <Grid xs={12} md={6}>
          <AppCurrentDownload
            title="Sales by Payment Method"
            subheader="Point-of-Sale Transactions"
            period={paymentPeriod}
            onPeriodChange={setPaymentPeriod}
            chart={{
              series: paymentSeries,
              options: { labels: paymentSeries.map((d) => d.label) },
              colors: [
                theme.palette.primary.main,
                theme.palette.warning.main,
                theme.palette.info.dark,
                theme.palette.info.main,
                theme.palette.success.main,
                theme.palette.warning.dark,
              ],
            }}
            sx={{ opacity: salesByPaymentMethodLoading ? 0.5 : 1 }}
          />
        </Grid>

        <Grid xs={12} md={6}>
          <AppExpenseCategories
            title={`Expenses (${expenses.period || period})`}
            subheader={fCurrency(expenses.total_expenses)}
            period={period}
            periodOptions={['day', 'month', 'year']}
            onPeriodChange={setPeriod}
            chart={{ series: expenseSeries, icons: expenseIcons, labels: expenseLabels }}
          />
        </Grid>

        {/* Yearly income vs expenses area chart */}
        <Grid xs={12}>
          <AppYearlySales
            title="Yearly Sales"
            subheader={yearlySalesSubheader}
            storeId={storeId}
          />
        </Grid>

        {/* Performance radar (normalised 0–100) + top cashiers */}
        <Grid xs={12} md={6}>
          <AppPerformance
            title="Store Performance"
            subheader="Normalised across key metrics (0–100 scale)"
            chart={{
              categories: radarCategories,
              series: radarSeries,
              colors: [theme.palette.primary.main],
            }}
            sx={{ opacity: performanceLoading ? 0.5 : 1 }}
          />
        </Grid>

        <Grid xs={12} md={6}>
          <AppTopCashiers
            title="Top Cashier Staff"
            subheader="By Performance"
            storeId={storeId}
            sx={{ height: '100%' }}
          />
        </Grid>

        {/* Recent invoices + top products (both driven by shared `period`) */}
        <Grid xs={12} lg={6}>
          <AppNewInvoice
            title="Recent Invoices"
            subheader="Filter by status"
            storeId={storeId}
            headLabel={[
              { id: 'invoiceNumber', label: 'Invoice #' },
              { id: 'category',     label: 'Category'  },
              { id: 'price',        label: 'Amount'    },
              { id: 'status',       label: 'Status'    },
              { id: '' },
            ]}
            status={invStatus}
            limit={invLimit}
            onStatusChange={setInvStatus}
            onLimitChange={setInvLimit}
          />
        </Grid>

        <Grid xs={12} lg={6}>
          <AppNewProduct
            title="Top Selling Products"
            subheader="Point-of-Sale Top Products"
            headLabel={[
              { id: 'invoiceNumber', label: 'Product'      },
              { id: 'category',     label: 'Qty Sold'     },
              { id: 'price',        label: 'Revenue'      },
              { id: 'status',       label: 'Transactions' },
              { id: '' },
            ]}
            storeId={storeId}
            period={period}
            limit={limit}
            onPeriodChange={setPeriod}
            onLimitChange={setLimit}
          />
        </Grid>

      </Grid>
    </DashboardContent>
  );
}
