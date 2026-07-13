import React, { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fPercent, fCurrency } from 'src/utils/format-number';
import { fToNow } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useStoreExpenses,
  useStoreFeatured,
  useStoreDailySales,
  useStoreYearlySales,
  useStoreTopProducts,
  useStoreWeeklySales,
  useStorePerformance,
  useStoreMonthlySales,
  useStoreRecentInvoices,
  useStoreSalesByPaymentMethod,
} from 'src/actions/dashboard';

import { Iconify } from 'src/components/iconify';
import { WelcomeGuidePopup } from 'src/components/onboarding/welcome-guide-popup';

import { useAuthContext } from 'src/auth/hooks';
import { useBusinessType } from 'src/hooks/use-business-type';
import { useDashboardShortcuts } from 'src/hooks/use-dashboard-shortcuts';

import { AppFeatured } from '../app-featured';
import { AppHeroMetric } from '../app-hero-metric';
import { AppQuickActions } from '../app-quick-actions';
import { AppRecentActivity } from '../app-recent-activity';
import { AppDashboardHeader } from '../app-dashboard-header';
import { AppDashboardLauncher } from '../app-dashboard-launcher';
import { AppNewInvoice } from '../app-new-invoice';
import { AppNewProduct } from '../app-new-product';
import { AppPerformance } from '../app-performance';
import { AppTopCashiers } from '../app-top-cashiers';
import { AppYearlySales } from '../app-yearly-sales';
import { AppWidgetSummary } from '../app-widget-summary';
import { AppCurrentDownload } from '../app-current-download';
import { AppExpenseCategories } from '../app-expense-categories';

// ----------------------------------------------------------------------

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

function normalizeRadarValues(rawValues) {
  const max = Math.max(...rawValues, 1);
  return rawValues.map((v) => Math.round((v / max) * 100));
}

function SectionLabel({ children }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1.2 }}>
        {children}
      </Typography>
      <Divider sx={{ mt: 1 }} />
    </Box>
  );
}

// ----------------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear();

export function OverviewAppView({ storeId }) {
  const { user } = useAuthContext();
  const { t, tp, tPhrase, getNavLabel } = useBusinessType();
  const { shortcuts, currentStore } = useDashboardShortcuts();
  const theme = useTheme();

  const [period, setPeriod]               = useState('month');
  const [limit, setLimit]                 = useState(10);
  const [invStatus, setInvStatus]         = useState('paid');
  const [invLimit, setInvLimit]           = useState(5);
  const [paymentPeriod, setPaymentPeriod] = useState('month');
  const [selectedYear, setSelectedYear]   = useState(CURRENT_YEAR);

  const { recentInvoices: activityInvoices, recentInvoicesLoading: activityLoading } =
    useStoreRecentInvoices(storeId, { limit: 3, status_filter: 'all' });

  const { salesByPaymentMethod, salesByPaymentMethodLoading } =
    useStoreSalesByPaymentMethod(storeId, paymentPeriod);

  const {
    dailySales = {
      total_sales: 0,
      total_paid: 0,
      total_debt: 0,
      change_percentage: 0,
      period: 'last 7 days',
      hourly_data: [],
    },
    dailySalesLoading,
  } = useStoreDailySales(storeId);

  const { weeklySales,      weeklySalesLoading  } = useStoreWeeklySales(storeId);
  const { monthlySales,     monthlySalesLoading } = useStoreMonthlySales(storeId);
  const { expenses,         expensesLoading     } = useStoreExpenses(storeId, period);
  const { topProducts,      topProductsLoading  } = useStoreTopProducts(storeId, period, limit);
  const { performance,      performanceLoading  } = useStorePerformance(storeId);
  const { data: yearlySalesData                 } = useStoreYearlySales(storeId, selectedYear);
  const { featuredProducts, featuredLoading     } = useStoreFeatured(storeId, 3);

  const hourly  = dailySales.hourly_data || [];
  const hours   = hourly.map((h) => String(h.hour).padStart(2, '0'));
  const amounts = hourly.map((h) => h.amount);

  const weeklyDailyData  = weeklySales?.daily_data || [];
  const weeklyCategories = weeklyDailyData.map((d) => d.day);
  const weeklyAmounts    = weeklyDailyData.map((d) => d.amount);

  const monthlyDailyData  = monthlySales?.daily_data || [];
  const monthlyCategories = monthlyDailyData.map((d) => d.day);
  const monthlyAmounts    = monthlyDailyData.map((d) => d.amount);

  const weeklyTotal  = weeklySales?.total_value       ?? 0;
  const weeklyPct    = weeklySales?.change_percentage ?? 0;
  const monthlyTotal = monthlySales?.total_value       ?? 0;
  const monthlyPct   = monthlySales?.change_percentage ?? 0;

  const yoyChange = yearlySalesData?.year_over_year_change ?? null;
  const yearlySalesSubheader = useMemo(() => {
    if (yoyChange === null) return String(selectedYear);
    const sign = yoyChange >= 0 ? '+' : '';
    return `${sign}${fPercent(yoyChange)} vs last year`;
  }, [yoyChange, selectedYear]);

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

  const paymentSeries = salesByPaymentMethod.map((m) => ({
    label: m.method_type.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
    value: m.total_amount,
  }));

  const invoiceHistoryPath = currentStore
    ? paths.dashboard.invoice.history(currentStore)
    : null;

  const recentActivityItems = useMemo(
    () =>
      (activityInvoices || []).map((inv) => ({
        id: inv.invoice_id,
        title: `${t('invoice')} #${inv.invoice_number}`,
        subtitle: inv.category || inv.customer_name || '—',
        timeAgo: inv.created_at ? fToNow(inv.created_at) : null,
        amount: inv.price,
        status: inv.status,
        href: invoiceHistoryPath,
      })),
    [activityInvoices, t, invoiceHistoryPath]
  );

  const activityIsEmpty = !activityLoading && recentActivityItems.length === 0;

  const heroActionHint = useMemo(() => {
    const phrase = tPhrase('heroActionHint');
    if (phrase && phrase !== 'heroActionHint') {
      return phrase;
    }
    return `Tap to open ${getNavLabel('quickDashboard')}`;
  }, [tPhrase, getNavLabel]);

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

  const storeName  = getStoreName();
  const todayLabel = new Date().toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <DashboardContent maxWidth="xl">
      <WelcomeGuidePopup userId={user?.user_id} />

      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid xs={12}>
          <AppDashboardLauncher
            header={(
              <AppDashboardHeader
                userName={user?.displayName}
                storeName={storeName}
                dateLabel={todayLabel}
              />
            )}
            hero={(
              <AppHeroMetric
                title={tPhrase('todaySalesTitle')}
                total={dailySales.total_paid ?? dailySales.total_sales}
                percent={dailySales.change_percentage}
                secondaryLabel="Debt outside"
                secondaryValue={dailySales.total_debt ?? 0}
                actionHint={heroActionHint}
                href={paths.dashboard.quickDashboard}
                loading={dailySalesLoading}
                chart={{ categories: hours, series: amounts }}
                sx={{ minHeight: { xs: 140, md: 160 } }}
              />
            )}
            activity={{
              collapseWhenEmpty: activityIsEmpty,
              node: (
                <AppRecentActivity
                  title="Recent activity"
                  items={recentActivityItems}
                  loading={activityLoading}
                  viewAllHref={invoiceHistoryPath}
                  emptyMessage="No recent activity yet"
                  sx={{ flex: 1, width: 1 }}
                />
              ),
            }}
            shortcuts={(
              <AppQuickActions primary={shortcuts.primary} grid={shortcuts.grid} />
            )}
          />
        </Grid>

        <Grid xs={12}>
          <SectionLabel>Analytics</SectionLabel>
        </Grid>

        <Grid xs={12} md={6} id="overview-tour-kpi">
          <AppWidgetSummary
            title={tPhrase('weeklySalesTitle')}
            percent={weeklyPct}
            total={weeklyTotal}
            periodLabel={weeklySales?.period || 'last 7 days'}
            formatAsCurrency
            loading={weeklySalesLoading}
            chart={{ categories: weeklyCategories, series: weeklyAmounts }}
          />
        </Grid>

        <Grid xs={12} md={6}>
          <AppWidgetSummary
            title={tPhrase('monthlySalesTitle')}
            percent={monthlyPct}
            total={monthlyTotal}
            periodLabel={monthlySales?.period || 'last month'}
            formatAsCurrency
            loading={monthlySalesLoading}
            chart={{
              colors: [theme.vars.palette.info.main],
              categories: monthlyCategories,
              series: monthlyAmounts,
            }}
          />
        </Grid>

        <Grid xs={12} md={6} id="overview-tour-payment-method">
          <AppCurrentDownload
            title={tPhrase('salesByPaymentTitle')}
            subheader={`${t('pos')} Transactions`}
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

        <Grid xs={12} md={6} id="overview-tour-featured">
          <AppFeatured list={featuredProducts} loading={featuredLoading} />
        </Grid>

        <Grid xs={12} id="overview-tour-expenses">
          <AppExpenseCategories
            title={`Expenses (${expenses.period || period})`}
            subheader={fCurrency(expenses.total_expenses)}
            period={period}
            periodOptions={['day', 'month', 'year']}
            onPeriodChange={setPeriod}
            chart={{ series: expenseSeries, icons: expenseIcons, labels: expenseLabels }}
          />
        </Grid>

        <Grid xs={12} id="overview-tour-yearly">
          <AppYearlySales
            title={`Yearly ${tp('sale')}`}
            subheader={yearlySalesSubheader}
            storeId={storeId}
          />
        </Grid>

        <Grid xs={12} md={6} id="overview-tour-performance">
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

        <Grid xs={12} md={6} id="overview-tour-cashiers">
          <AppTopCashiers
            title="Top Cashier Staff"
            subheader="By Performance"
            storeId={storeId}
            sx={{ height: '100%' }}
          />
        </Grid>

        <Grid xs={12} lg={6} id="overview-tour-invoices">
          <AppNewInvoice
            title={`Recent ${tp('invoice')}`}
            subheader="Filter by status"
            storeId={storeId}
            headLabel={[
              { id: 'invoiceNumber', label: `${t('invoice')} #` },
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

        <Grid xs={12} lg={6} id="overview-tour-products">
          <AppNewProduct
            title={`Top Selling ${tp('product')}`}
            subheader={`${t('pos')} Top ${tp('product')}`}
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
