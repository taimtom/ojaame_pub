import React, { useState, useEffect, useCallback} from 'react';

// import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';

import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { SeoIllustration } from 'src/assets/illustrations';
import {
  // _appAuthors,
  // _appRelated,
  _appFeatured,
  // _appInvoices,
  // _appInstalled
} from 'src/_mock';
import {
  useStoreExpenses,
  useStoreDailySales,
  useStoreYearlySales,
  useStoreTopProducts,
  useStoreWeeklySales,
  useStoreTopCashiers,
  useStorePerformance,
  useStoreMonthlySales,
  useStoreRecentInvoices,
  useStoreSalesByPaymentMethod
} from 'src/actions/dashboard';

import { Iconify } from 'src/components/iconify';
// import { svgColorClasses } from 'src/components/svg-color';

import { useAuthContext } from 'src/auth/hooks';

// import { AppWidget } from '../app-widget';
import { AppWelcome } from '../app-welcome';
import { AppFeatured } from '../app-featured';
import { AppNewInvoice } from '../app-new-invoice';
import { AppNewProduct } from '../app-new-product';
// import { AppTopAuthors } from '../app-top-authors';
// import { AppTopRelated } from '../app-top-related';
import { AppPerformance } from '../app-performance';
import { AppTopCashiers } from '../app-top-cashiers';
import { AppYearlySales } from '../app-yearly-sales';
// import { AppAreaInstalled } from '../app-area-installed';
import { AppWidgetSummary } from '../app-widget-summary';
import { AppCurrentDownload } from '../app-current-download';
import { AppExpenseCategories } from '../app-expense-categories';
// import { AppTopInstalledCountries } from '../app-top-installed-countries';

// ----------------------------------------------------------------------
const CURRENT_YEAR = new Date().getFullYear();
export function OverviewAppView({ storeId }) {
  const { user } = useAuthContext();

  const theme = useTheme();

  const [invStatus, setInvStatus]           = useState('paid');
  const [invLimit, setInvLimit]             = useState(5);
  const [cashiersPeriod, setCashiersPeriod] = useState('year');
  const [cashiersLimit, setCashiersLimit]   = useState(5);

  // … other hooks …

  // recent invoices
  const {
    recentInvoices,
    recentInvoicesLoading,
    refetchRecentInvoices
  } = useStoreRecentInvoices(storeId, { limit: invLimit, status_filter: invStatus });

  // top cashiers
  const {
    topCashiers,
    topCashiersLoading,
    refetchTopCashiers
  } = useStoreTopCashiers(storeId, { period: cashiersPeriod, limit: cashiersLimit });



  const [paymentPeriod, setPaymentPeriod] = useState('month');
  const {
    salesByPaymentMethod,
    salesByPaymentMethodLoading
  } = useStoreSalesByPaymentMethod(storeId, paymentPeriod);

  const {
    dailySales = { total_sales: 0, change_percentage: 0, hourly_data: [] },
    dailySalesLoading
  } = useStoreDailySales(storeId);

   const hourly = dailySales.hourly_data || [];
   const hours   = hourly.map((h) => String(h.hour).padStart(2, '0'));
   const amounts = hourly.map((h) => h.amount);

  const {
    weeklySales,
    weeklySalesLoading,
  } = useStoreWeeklySales(storeId);

  const {
    monthlySales,
    monthlySalesLoading,
  } = useStoreMonthlySales(storeId);

  const [period, setPeriod] = useState('month');
  const [limit, setLimit] = useState(10);
  const {
    expenses,
    expensesLoading,
  } = useStoreExpenses(storeId, period);

  const {
    topProducts,
    topProductsLoading,
    refetchTopProducts
  } = useStoreTopProducts(storeId, period, limit);

   const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    // For demo, last 5 years—replace with a dynamic list endpoint if available
    const yearOptions = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const {
  companyYearlySales,
  companyYearlySalesLoading,
  error,
} = useStoreYearlySales(storeId, selectedYear);
const {
  performance,
  performanceLoading
} = useStorePerformance(storeId);
  // performance is a single object:
  // { store_id, store_name, revenue, transactions, returns, new_customers, avg_basket, footfall }
  const perf = performance || {};
  const radarCategories = [
    'Revenue',
    'Transactions',
    'Returns',
    'New Customers',
    'Avg. Basket',
    'Footfall'
  ];
  const radarSeries = [
    {
      name: perf.store_name || 'Store',
      data: [
        perf.revenue || 0,
        perf.transactions || 0,
        perf.returns || 0,
        perf.new_customers || 0,
        perf.avg_basket || 0,
        perf.footfall || 0
      ]
    }
  ];

  const weeklyTotal  = weeklySales?.total_value  ?? 0;
  const weeklyPct    = weeklySales?.change_percentage ?? 0;
  const monthlyTotal = monthlySales?.total_value ?? 0;
  const monthlyPct   = monthlySales?.change_percentage ?? 0;
  // const expensesTotal = expenses?.total_value ?? 0;
  // const expensesPct   = expenses?.change_percentage ?? 0;


   const [chartConfig, setChartConfig] = useState({
    categories: [],
    series: [],
  });

  useEffect(() => {
    if (!companyYearlySales) return;

    const { monthly_data = [] } = companyYearlySales;

    // categories: month names
    const categories = monthly_data.map((m) => m.month);

    // two series: Income & Expenses
    const incomeSeries = { name: 'Income', data: monthly_data.map((m) => m.income) };
    const expenseSeries = { name: 'Expenses', data: monthly_data.map((m) => m.expenses) };

    setChartConfig({ categories, series: [incomeSeries, expenseSeries] });
  }, [companyYearlySales]);

  // 4) Handle year changes
  const handleYearChange = useCallback((year) => {
    setSelectedYear(year);
  }, []);



  const expenseCats = expenses?.categories || [];
  const series = expenseCats.map((item) => ({
    label: item.category,
    value: item.amount,
  }));

  const iconMap = {
    Entertainment:    'mdi:filmstrip',                   // Entertainment
    Fuel:             'mdi:gas-station-outline',         // Fuel
    'Fast Food':      'mdi:food-drumstick-outline',      // Fast Food
    Cafe:             'mdi:coffee-outline',              // Café
    Connection:       'basil:mobile-phone-outline',      // Phone/Connection
    Healthcare:       'solar:medical-kit-bold',          // Healthcare
    Fitness:          'ic:round-fitness-center',         // Fitness
    Supermarket:      'solar:cart-3-bold',               // Grocery
    Transportation:   'mdi:bus-clock',                   // Transportation
    Utilities:        'mdi:flash',                       // Utilities / Electricity
    Education:        'mdi:school-outline',              // Education
    Shopping:         'mdi:shopping-outline',            // Shopping
    Travel:           'mdi:airplane-outline',            // Travel
    Miscellaneous:    'mdi:dots-horizontal-circle-outline', // Misc
  };


    // const ExpenseCategoriesSeries = expenses.map((item) => ({
    //   label: item.method_type.replace(/_/g, ' ').toUpperCase(),
    //   value: item.total_amount,
    // }));

    const icons = expenseCats.map((item) => (
      <Iconify
        key={item.category}
        icon={iconMap[item.category] || 'mdi:help-circle-outline'}
      />
    ));

    const labels = expenseCats.map((item) => item.category);


    const paymentSeries = salesByPaymentMethod.map((m) => ({
      label: m.method_type
        .split('_')
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' '),
      value: m.total_amount,
    }));

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <AppWelcome
            title={`Welcome back 👋 \n ${user?.displayName}`}
            description="If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything."
            img={<SeoIllustration hideBackground />}
            action={
              <Button variant="contained" color="primary">
                Go now
              </Button>
            }
          />
        </Grid>

        <Grid xs={12} md={4}>
          <AppFeatured list={_appFeatured} />
        </Grid>

        <Grid xs={12} md={4}>
          <AppWidgetSummary
           title="Today’s Sales"
           percent={dailySales.change_percentage}
           total={dailySales.total_sales}
           loading={dailySalesLoading}
           chart={{
             categories: hours,
             series: amounts,
           }}
          />
        </Grid>



        <Grid xs={12} md={4}>
          <AppWidgetSummary
            title="Total Weekly sales"
            percent={weeklyPct}
            total={weeklyTotal}
            loading={weeklySalesLoading}
            chart={{
              categories: [], // or you can fetch daily breakdown
              series: [],
            }}
          />
        </Grid>

        <Grid xs={12} md={4}>
          <AppWidgetSummary
            title="Total Monthly sales"
            percent={monthlyPct}
            total={monthlyTotal}
            loading={monthlySalesLoading}
            chart={{
              colors: [theme.vars.palette.info.main],
              categories: [],
              series: [],
            }}
          />
        </Grid>



        <Grid xs={12} md={6} lg={6}>
          <AppCurrentDownload
          //   title="Sales by Payment Method"
          //   subheader="Point-of-Sale Transactions"
          //   chart={{
          //     series: [
          //       { label: 'Cash', value: 12244 },
          //       { label: 'Credit Card', value: 53345 },
          //       { label: 'Mobile Pay', value: 44313 },
          //       { label: 'Voucher', value: 78343 },
          //     ],
          //   }}
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
        <Grid xs={12} md={6} lg={6}>
          <AppExpenseCategories
            title={`Expenses (${expenses.period})`}
            subheader={`${fCurrency(expenses.total_expenses)}`}
            period={period}
            periodOptions={['day','month','year']}
            onPeriodChange={setPeriod}
            chart={{
              series,
              icons,
              labels,
            }}
          />
        </Grid>
        <Grid xs={12} md={12} lg={12}>
          <AppYearlySales
            title="Yearly sales"
            subheader="(+43%) than last year"
            storeId={storeId}
          />
        </Grid>


        {/* <Grid xs={12} md={6} lg={8}>
          <AppAreaInstalled
            title="Monthly Revenue Trends"
            subheader="2024 vs. 2023 vs. 2022"
            chart={{
              categories: [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec',
              ],
              series: [
                {
                  name: '2022',
                  data: [
                    { name: 'WK 1', data: [12, 10, 18, 22, 20, 12, 8, 21, 20, 14, 15, 16] },
                    { name: 'WK 2', data: [12, 10, 18, 22, 20, 12, 8, 21, 20, 14, 15, 16] },
                    { name: 'WK 3', data: [12, 10, 18, 22, 20, 12, 8, 21, 20, 14, 15, 16] },
                  ],
                },
                {
                  name: '2023',
                  data: [
                    { name: 'WK 1', data: [6, 18, 14, 9, 20, 6, 22, 19, 8, 22, 8, 17] },
                    { name: 'WK 2', data: [6, 18, 14, 9, 20, 6, 22, 19, 8, 22, 8, 17] },
                    { name: 'WK 3', data: [6, 18, 14, 9, 20, 6, 22, 19, 8, 22, 8, 17] },
                  ],
                },
                {
                  name: '2024',
                  data: [
                    { name: 'WK 1', data: [6, 20, 15, 18, 7, 24, 6, 10, 12, 17, 18, 10] },
                    { name: 'WK 2', data: [6, 20, 15, 18, 7, 24, 6, 10, 12, 17, 18, 10] },
                    { name: 'WK 3', data: [6, 20, 15, 18, 7, 24, 6, 10, 12, 17, 18, 10] },
                  ],
                },
              ],
            }}
          />
        </Grid> */}
        <Grid xs={12} md={6} lg={6}>
        <AppPerformance
           title="Store Performance Radar"
           subheader="Across Key Metrics"
           chart={{
             categories: radarCategories,
             series: radarSeries,
             colors: [theme.palette.primary.main]
           }}
           sx={{ opacity: performanceLoading ? 0.5 : 1 }}
           />
</Grid>

<Grid xs={12} md={6} lg={6}>
          <AppTopCashiers
            title="Top Cashier Staff"
            subheader="By Performance"
            storeId={storeId}
            sx={{ height: '100%' }}
          />
        </Grid>

        <Grid xs={12} lg={6}>
          <AppNewInvoice
          title="Recent Invoices"
          subheader="Filter by status"
           storeId={storeId}
           headLabel={[
              { id: 'invoiceNumber', label: 'Invoice #' },
              { id: 'category',      label: 'Category'   },
              { id: 'price',         label: 'Amount'     },
              { id: 'status',        label: 'Status'     },
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
            { id: 'invoiceNumber', label: 'Product' },
            { id: 'category',     label: 'Qty Sold' },
            { id: 'price',        label: 'Revenue' },
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

        {/* <Grid xs={12} md={6} lg={4}>
          <AppTopAuthors title="Top Cashier Staff" list={_appAuthors} />

          </Grid> */}


        {/* <Grid xs={12} md={6} lg={4}>
          <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
            <AppWidget
              title="Conversion"
              total={38566}
              icon="solar:user-rounded-bold"
              chart={{ series: 48 }}
            />

            <AppWidget
              title="Applications"
              total={55566}
              icon="fluent:mail-24-filled"
              chart={{
                series: 75,
                colors: [theme.vars.palette.info.light, theme.vars.palette.info.main],
              }}
              sx={{ bgcolor: 'info.dark', [`& .${svgColorClasses.root}`]: { color: 'info.light' } }}
            />
          </Box>
        </Grid> */}
      </Grid>
    </DashboardContent>
  );
}
