import React, {useState, useEffect, useCallback } from 'react';

import Grid from '@mui/material/Unstable_Grid2';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  _analyticTasks,
  // _analyticPosts,
  _analyticTraffic,
  // _analyticOrderTimeline,
} from 'src/_mock';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';       // to grab company_id
import {
  useCompanyYearlySales,
  useDashboardWeeklySales,
  useDashboardMonthlySales,
  useDashboardOrderTimeline,
  useDashboardCurrentVisits,
  // useDashboardExpenseSummary,
  useDashboardCompanySummary,
  useDashboardPurchaseOrders,
  useDashboardYearlyStoreSales,
  useDashboardStorePerformance,
  useDashboardSalesAccumulation,
  useDashboardStoreLocationSales,
  useDashboardSalesByPaymentMethod,
 } from 'src/actions/dashboard';

// import { AnalyticsNews } from '../analytics-news';
import { AnalyticsTasks } from '../analytics-tasks';
// import { AnalyticsOverview } from '../analytics-overview';
import { AnalyticsSalesOverview } from '../analytics-summary';
import { AnalyticsYearlySales } from '../analytics-yearly-sales';
import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsOrderTimeline } from '../analytics-order-timeline';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsTrafficBySite } from '../analytics-traffic-by-site';
import { AnalyticsCurrentSubject } from '../analytics-current-subject';
// import { AnalyticsConversionRates } from '../analytics-conversion-rates';
import { AnalyticsPaymentCategories } from '../analytics-payment-categories';


// ----------------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear();
export function OverviewAnalyticsView() {
  const { user } = useAuthContext();
  const companyId = user?.company_id;
  const theme = useTheme();

  const [period, setPeriod] = useState('month');


  const { dashCompanySummary, dashCompanySummaryLoading, dashCompanySummaryError } =
  useDashboardCompanySummary(companyId);

  // 2) Build the array for <AnalyticsSalesOverview />
  const summaryData = [
        {
          label: 'Weekly Sales',
          totalAmount: dashCompanySummary?.weekly_sales?.total_value ?? 0,
          value:       dashCompanySummary?.weekly_sales?.change_percentage ?? 0,
        },
        {
          label: 'Monthly Sales',
          totalAmount: dashCompanySummary?.monthly_sales?.total_value ?? 0,
          value:       dashCompanySummary?.monthly_sales?.change_percentage ?? 0,
        },
        {
          label: 'Purchase Orders',
          totalAmount: dashCompanySummary?.purchase_orders?.total_value ?? 0,
          value:       dashCompanySummary?.purchase_orders?.change_percentage ?? 0,
        },
        {
          label: 'Sales Accumulation',
          totalAmount: dashCompanySummary?.sales_accumulation?.total_value ?? 0,
          value:       dashCompanySummary?.sales_accumulation?.change_percentage ?? 0,
        },
        {
          label: 'Daily Sales',
          totalAmount: dashCompanySummary?.daily_sales?.total_sales ?? 0,
          value:       dashCompanySummary?.daily_sales?.change_percentage ?? 0,
        },
      ];

  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  // For demo, last 5 years—replace with a dynamic list endpoint if available
  const yearOptions = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
// Define as many colors as you might have series:
const radarColors = [
  theme.palette.primary.main,
  theme.palette.secondary.main,
  theme.palette.error.main,
  theme.palette.warning.main,
  theme.palette.info.main,
];

const {
  companyYearlySales,
  companyYearlySalesLoading,
  error,
} = useCompanyYearlySales(companyId, selectedYear);


const {
  salesByPaymentMethod,
  salesByPaymentMethodLoading
} = useDashboardSalesByPaymentMethod(companyId, period);

  // 👇 fetch the weekly‐sales summary
  const {
    weeklySales,
    weeklySalesLoading,
  } = useDashboardWeeklySales(companyId);

  const {
    monthlySales,
    monthlySalesLoading,
  } = useDashboardMonthlySales(companyId);

  const {
    purchaseOrders,
    purchaseOrdersLoading,
  } = useDashboardPurchaseOrders(companyId);

  const {
    currentVisits,
    currentVisitsLoading,
  } = useDashboardCurrentVisits(companyId);

  const {
    yearlyStoreSales,
    yearlyStoreSalesLoading,
  } = useDashboardYearlyStoreSales(companyId);

  const {
    storeLocationSales,
    storeLocationSalesLoading,
  } = useDashboardStoreLocationSales(companyId);

  const {
    salesAccumulation,
    salesAccumulationLoading,
  } = useDashboardSalesAccumulation(companyId);

  // const {
  //   expenses,
  //   expensesLoading
  // } = useDashboardExpenseSummary(companyId);

  const { storePerformance, storePerformanceLoading } = useDashboardStorePerformance(companyId);
  const { orderTimeline, orderTimelineLoading } = useDashboardOrderTimeline(companyId);


 // 3) Build chart input when data arrives
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




  // fallback defaults while loading or if error
 const wsTotal   = weeklySales?.total_value    ?? 0;
  const wsPct     = weeklySales?.change_percentage ?? 0;
  const wsPeriod  = weeklySales?.period         ?? 'Last 7 days';

  const msTotal   = monthlySales?.total_value    ?? 0;
  const msPct     = monthlySales?.change_percentage ?? 0;
  const msPeriod  = monthlySales?.period         ?? 'Last month';

  const poTotal   = purchaseOrders?.total_value    ?? 0;
  const poPct     = purchaseOrders?.change_percentage ?? 0;
  const poPeriod  = purchaseOrders?.period         ?? 'Last month';

  const saTotal   = salesAccumulation?.total_value    ?? 0;
  const saPct     = salesAccumulation?.change_percentage ?? 0;
  const saPeriod  = salesAccumulation?.period         ?? 'Last month';

  // currentVisits is an array of { store_name, sales_amount, percentage }
  const cvSeries = (currentVisits || []).map(({ store_name, sales_amount }) => ({
    label: store_name,
    value: sales_amount,
  }));

  // yearlyStoreSales is array of { month, current_year, previous_year }
  const yssCategories = yearlyStoreSales?.map((r) => r.month) || [];
  const yssCurrent    = yearlyStoreSales?.map((r) => r.current_year) || [];
  const yssPrevious   = yearlyStoreSales?.map((r) => r.previous_year) || [];

  // storeLocationSales is array of { location, current_year_sales, previous_year_sales }
  const slsCategories = storeLocationSales?.map((r) => r.location) || [];
  const slsCurrent    = storeLocationSales?.map((r) => r.current_year_sales) || [];
  const slsPrevious   = storeLocationSales?.map((r) => r.previous_year_sales) || [];

  const sp  = storePerformance || [];
  const ot  = orderTimeline || [];

  const spCategories = ['Revenue','Transactions','Returns','New Customers','Avg. Basket','Footfall'];
  const spSeries = sp.map((s) => ({
    name: s.store_name,
    data: [
      s.revenue,
      s.transactions,
      s.returns,
      s.new_customers,
      s.avg_basket,
      s.footfall,
    ],
  }));

  const timelineList = ot.map((item) => ({
    id: item.invoice_number,
    type: 'order2',
    title: item.display_text,
    time: item.date,
    color: item.color,
  }));
  const paymentSeries = (salesByPaymentMethod || []).map((m) => ({
    label: m.method_type.replace(/_/g, ' '),
    value: m.total_amount
  }));
  const iconsMap = {
    cash: 'mdi:cash',
    pos: 'mdi:credit-card-outline',
    bank_transfer: 'mdi:bank-transfer',
    mobile_money: 'material-symbols:mobile-friendly-outline',
    check: 'mdi:checkbook',
    credit: 'mdi:credit-card-multiple',
    other: 'mdi:help-circle-outline'
  };
  const paymentIcons = (salesByPaymentMethod || []).map((m) => (
    <Iconify icon={iconsMap[m.method_type] || iconsMap.other} />
  ));

  const handlePeriodChange = useCallback((e) => {
    setPeriod(e.target.value);
  }, []);


  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, Welcome back 👋
      </Typography>

      <Grid container spacing={3}>
        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title={`Weekly sales (${wsPeriod})`}
            percent={wsPct}
            total={wsTotal}
            icon={
              <img
              alt="icon"
              src={`${CONFIG.site.basePath}/assets/icons/glass/ic-glass-bag.svg`} />
            }
            // chart={{
            //   categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            //   series: [22, 8, 35, 50, 82, 84, 77, 12],
            // }}
            chart={{ categories: [], series: [] }}
              sx={{ opacity: weeklySalesLoading ? 0.5 : 1 }}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title={`Monthly sales (${msPeriod})`}
            total={msTotal}
            percent={msPct}
            color="secondary"
            icon={
              <img
                alt="icon"
                src={`${CONFIG.site.basePath}/assets/icons/glass/ic-glass-users.svg`}
              />
            }
            // chart={{
            //   categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            //   series: [56, 47, 40, 62, 73, 30, 23, 54],
            // }}
            chart={{ categories: [], series: [] }}
              sx={{ opacity: monthlySalesLoading ? 0.5 : 1 }}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title={`Purchase orders (${poPeriod})`}
            total={poTotal}
            percent={poPct}
            color="warning"
            icon={
              <img alt="icon" src={`${CONFIG.site.basePath}/assets/icons/glass/ic-glass-buy.svg`} />
            }
            // chart={{
            //   categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            //   series: [40, 70, 50, 28, 70, 75, 7, 64],
            // }}
            chart={{ categories: [], series: [] }}
              sx={{ opacity: purchaseOrdersLoading ? 0.5 : 1 }}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title={`Sales Accumulation (${saPeriod})`}
            percent= {saPct}
            total={saTotal}
            color="error"
            icon={
              <img
                alt="icon"
                src={`${CONFIG.site.basePath}/assets/icons/glass/ic-glass-message.svg`}
              />
            }
            // chart={{
            //   categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            //   series: [56, 30, 23, 54, 47, 40, 62, 73],
            // }}
            chart={{ categories: [], series: [] }}
              sx={{ opacity: purchaseOrdersLoading ? 0.5 : 1 }}
          />
        </Grid>
        <Grid xs={12} md={6} lg={8}>
          <AnalyticsYearlySales
            title="Yearly sales"
            subheader="(+43%) than last year"
            companyId={companyId}
          />
        </Grid>
        <Grid xs={12} md={6} lg={4}>
          <AnalyticsCurrentVisits
            title="Current Store"
            // chart={{
            //   series: [
            //     // { label: 'Previous Year', value: yssPrevious },
            //     // { label: 'Current Year',  value: yssCurrent },
            //     { label: 'Store 1', value: 3500 },
            //     { label: 'Store 2', value: 2500 },
            //     { label: 'Store 3', value: 1500 },
            //     { label: 'Store 4', value: 500 },
            //   ],
            // }}
            chart={{ series: cvSeries }}
            sx={{ opacity: currentVisitsLoading ? 0.5 : 1 }}
          />
        </Grid>
         {/* <AnalyticsOverview /> */}
         <Grid xs={12} md={6} lg={6}>
  <AnalyticsPaymentCategories
    title={`Sales by Payment Method(${period})`}
    subheader="Point-of-Sale Transactions"
    period={period}
    periodOptions={['day','month','year']}
    onPeriodChange={setPeriod}
    chart={{
      series: paymentSeries,
            icons: paymentIcons
    }}
    sx={{ opacity: salesByPaymentMethodLoading ? 0.5 : 1 }}
  />
</Grid>



         <Grid xs={12} md={6} lg={6}>
  <AnalyticsCurrentSubject
    title="Store Performance Radar"
    subheader="Across Key Metrics"
    // chart={{
    //   // Axes: the KPIs you want to compare across stores
    //   categories: [
    //     'Revenue',
    //     'Transactions',
    //     'Returns',
    //     'New Customers',
    //     'Avg. Basket',
    //     'Footfall',
    //   ],
    //   // One series = one store
    //   series: [
    //     {
    //       name: 'Store A',
    //       data: [85, 75, 20, 60, 50, 90], // % of target or normalized scores
    //     },
    //     {
    //       name: 'Store B',
    //       data: [70, 65, 30, 55, 60, 80],
    //     },
    //     {
    //       name: 'Store C',
    //       data: [95, 85, 15, 70, 55, 95],
    //     },
    //   ],
    //   // Optional: override default colors
    //   colors: ['#1E88E5', '#D81B60', '#FFC107'],
    // }}
    chart={{
      categories: spCategories,
      series: spSeries,
      colors: radarColors.slice(0, spSeries.length),
    }}
    sx={{ opacity: storePerformanceLoading ? 0.5 : 1 }}
  />
</Grid>


        <Grid xs={12} md={6} lg={8}>
          <AnalyticsWebsiteVisits
            title="Yearly Store Sales"
            subheader="(+43%) than last year"
            // chart={{
            //   categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
            //   series: [
            //     { name: 'Store 1', data: [43, 33, 22, 37, 67, 68, 37, 24, 55] },
            //     { name: 'Store 2', data: [51, 70, 47, 67, 40, 37, 24, 70, 24] },
            //     { name: 'Store 3', data: [12, 70, 47, 67, 40, 37, 2, 70, 24] },
            //     { name: 'Store 4', data: [51, 70, 70, 27, 70, 87, 94, 70, 64] },
            //   ],
            // }}
            chart={{
              categories: yssCategories,
              series: [
                { name: 'Previous Year', data: yssPrevious },
                { name: 'Current Year',  data: yssCurrent },
              ],
            }}
            sx={{ opacity: yearlyStoreSalesLoading ? 0.5 : 1 }}
          />
        </Grid>

         {/* <Grid xs={12} md={6} lg={4}>
          <AnalyticsOrderTimeline title="Order timeline" list={_analyticOrderTimeline} />
        </Grid> */}
        <Grid xs={12} md={6} lg={4}>
            <AnalyticsOrderTimeline
              title="Order timeline"
              list={timelineList}
              sx={{ opacity: orderTimelineLoading ? 0.5 : 1 }}
            />
          </Grid>

        <Grid xs={12} md={6} lg={8}>
  {/* <AnalyticsConversionRates
    title="Store Location Sales"
    subheader="Current vs. Previous"
    chart={{
      categories: slsCategories,
      series: [
        { name: 'Previous', data: slsPrevious },
        { name: 'Current',  data: slsCurrent },
      ],
    }}
    sx={{ opacity: storeLocationSalesLoading ? 0.5 : 1 }}
  /> */}

<Grid xs={12} md={6} lg={8}>
          <AnalyticsSalesOverview
           title="Sales Overview"
           subheader="Latest performance metrics"
           data={summaryData}
           />
        </Grid>
</Grid>
      <Grid xs={12} md={6} lg={4}>
          <AnalyticsTrafficBySite title="Traffic by site" list={_analyticTraffic} />
        </Grid>



        {/* <Grid xs={12} md={6} lg={8}>
          <AnalyticsNews title="News" list={_analyticPosts} />
        </Grid> */}




        <Grid xs={12} md={6} lg={8}>
          <AnalyticsTasks title="Tasks" list={_analyticTasks} />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
