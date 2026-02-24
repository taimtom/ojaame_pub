/* src/utils/dashboard.js */
import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

// common SWR options
const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true
};

// hook factory for static/company-level endpoints (uses query param)
function createUseDashboard(endpointKey, dataKey) {
  return function useHook(companyId) {
    const url = endpoints.dashboard[endpointKey];
    const args = companyId
      ? [url, { params: { company_id: companyId } }]
      : [url];

    const { data, error, isLoading, isValidating, mutate } = useSWR(
      args,
      fetcher,
      { ...swrOptions, keepPreviousData: true }
    );

    return useMemo(
      () => ({
        [dataKey]: data || [],
        [`${dataKey}Loading`]: isLoading,
        [`${dataKey}Error`]: error,
        [`${dataKey}Validating`]: isValidating,
        refetch: mutate
      }),
      [data, error, isLoading, isValidating, mutate]
    );
  };
}

// hook factory for dynamic company-level endpoints (path params)
function createUseCompanyDashboard(endpointKey, dataKey) {
  return function useHook(companyId) {
    const swrKey = companyId
      ? [endpoints.dashboard.company[endpointKey](companyId)]
      : null;

    const { data, error, isLoading, isValidating, mutate } = useSWR(
      swrKey,
      fetcher,
      { ...swrOptions, keepPreviousData: true }
    );

    return useMemo(
      () => ({
        [dataKey]: data || [],
        [`${dataKey}Loading`]: isLoading,
        [`${dataKey}Error`]: error,
        [`${dataKey}Validating`]: isValidating,
        refetch: mutate
      }),
      [data, error, isLoading, isValidating, mutate]
    );
  };
}

// hook factory for dynamic store-level endpoints (path params)
function createUseStoreDashboard(endpointKey, dataKey) {
  return function useHook(storeId, params = {}) {
    const swrKey = storeId
      ? [endpoints.dashboard.store[endpointKey](storeId), { params }]
      : null;

    const { data, error, isLoading, isValidating, mutate } = useSWR(
      swrKey,
      fetcher,
      { ...swrOptions, keepPreviousData: true }
    );

    return useMemo(
      () => ({
        [dataKey]: data || {},
        [`${dataKey}Loading`]: isLoading,
        [`${dataKey}Error`]: error,
        [`${dataKey}Validating`]: isValidating,
        [`refetch${dataKey.charAt(0).toUpperCase()+dataKey.slice(1)}`]: mutate,
      }),
      [data, error, isLoading, isValidating, mutate]
    );
  };
}


// static/company-level hooks
export const useDashboardSummary = createUseDashboard('summary', 'summary');
export const useDashboardWeeklySales = createUseDashboard('weeklySales', 'weeklySales');
export const useDashboardMonthlySales = createUseDashboard('monthlySales', 'monthlySales');
export const useDashboardPurchaseOrders = createUseDashboard('purchaseOrders', 'purchaseOrders');
export const useDashboardSalesAccumulation = createUseDashboard('salesAccumulation', 'salesAccumulation');
export const useDashboardCurrentVisits = createUseDashboard('currentVisits', 'currentVisits');
export const useDashboardYearlyStoreSales = createUseDashboard('yearlyStoreSales', 'yearlyStoreSales');
export const useDashboardStoreLocationSales = createUseDashboard('storeLocationSales', 'storeLocationSales');
export const useDashboardStorePerformance = createUseDashboard('storePerformance', 'storePerformance');
export const useDashboardMonthlyRevenueTrends = createUseDashboard('monthlyRevenueTrends', 'monthlyRevenueTrends');
export const useDashboardTopSellingProducts = createUseDashboard('topSellingProducts', 'topSellingProducts');
export const useDashboardTopStaff = createUseDashboard('topStaff', 'topStaff');
export const useDashboardRecentInvoices = createUseDashboard('recentInvoices', 'recentInvoices');
export const useDashboardExpenseSummary = createUseDashboard('expenseSummary', 'expenseSummary');
export const useDashboardOrderTimeline = createUseDashboard('orderTimeline', 'orderTimeline');
export const useDashboardDailySales = createUseDashboard('dailySales', 'dailySales');
export const useDashboardConversionMetrics = createUseDashboard('conversionMetrics', 'conversionMetrics');
// export const useDashboardSalesByPaymentMethod = createUseDashboard('salesByPaymentMethod', 'salesByPaymentMethod');
export const useDashboardRelatedApplications = createUseDashboard('relatedApplications', 'relatedApplications');
export const useDashboardSearch = createUseDashboard('search', 'searchResults');
export const useDashboardCompanySummary = createUseDashboard('companySummary', 'dashCompanySummary');

// dynamic company-level hooks
export const useCompanySummary = createUseCompanyDashboard('summary', 'companySummary');
export const useCompanyStoreComparison = createUseCompanyDashboard('storeComparison', 'storeComparison');
// export const useCompanyYearlySales = createUseCompanyDashboard('yearlySales', 'companyYearlySales');

// dynamic store-level hooks
export const useStoreDailySales = createUseStoreDashboard('dailySales', 'dailySales');
// export const useStoreSal/esByPaymentMethod = createUseStoreDashboard('salesByPaymentMethod', 'salesByPaymentMethod');
// export const useStoreTopCashiers = createUseStoreDashboard('topCahier', 'topCashiers');
// export const useStoreRecentInvoices = createUseStoreDashboard('recentInvoices', 'recentInvoices');

export const useStoreWeeklySales = createUseStoreDashboard('weeklySales', 'weeklySales');
export const useStoreMonthlySales = createUseStoreDashboard('monthlySales', 'monthlySales');
export const useStorePerformance = createUseStoreDashboard('performance', 'performance');
// export const useStoreTopProducts = createUseStoreDashboard('topProducts', 'topProducts');
// export const useStoreExpenses      = createUseStoreDashboard('expenses',      'expenses');
// export const useStoreYearlySales = createUseStoreDashboard('yearlySales', 'yearlySales');
export const useStoreVerify = createUseStoreDashboard('verify', 'verifyStatus');
export function useStoreRecentInvoices(storeId, params = {}) {
  const key = storeId
    ? [endpoints.dashboard.store.recentInvoices(storeId), { params }]
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      recentInvoices: Array.isArray(data) ? data : [],
      recentInvoicesLoading: isLoading,
      recentInvoicesError:   error,
      refetchRecentInvoices: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

// after your existing createUseStoreDashboard...
export function useStoreTopCashiers(storeId, params = { period: 'year', limit: 10 }) {
  const key = storeId
    ? [endpoints.dashboard.store.topCahier(storeId), { params }]
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    fetcher,
    { ...swrOptions, keepPreviousData: true }
  );

  return useMemo(
    () => ({
      topCashiers: Array.isArray(data) ? data : [],
      topCashiersLoading: isLoading,
      topCashiersError:   error,
      refetchTopCashiers: mutate
    }),
    [data, error, isLoading, mutate]
  );
}


export function useDashboardSalesByPaymentMethod(companyId, period = 'month') {
  // Build SWR key only when we have a companyId
  const key = companyId
    ? [
        endpoints.dashboard.salesByPaymentMethod,
        { params: { company_id: companyId, period } }
      ]
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    fetcher,
    { ...swrOptions, keepPreviousData: true }
  );

  return useMemo(
    () => ({
      salesByPaymentMethod: data || [],
      salesByPaymentMethodLoading: isLoading,
      salesByPaymentMethodError: error,
      salesByPaymentMethodValidating: isValidating,
      refetchSalesByPaymentMethod: mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useStoreSalesByPaymentMethod(storeId, period = 'month') {
  const key = storeId
    ? [endpoints.dashboard.store.salesByPaymentMethod(storeId), { params: { period } }]
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      salesByPaymentMethod: data || [],
      salesByPaymentMethodLoading: isLoading,
      salesByPaymentMethodError: error,
      refetchSalesByPaymentMethod: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export function useStoreTopProducts(storeId, period = 'year', limit = 10) {
  const key = storeId
    ? [endpoints.dashboard.store.topProducts(storeId), { params: { period, limit } }]
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    fetcher,
    { ...swrOptions, keepPreviousData: true }
  );

  return useMemo(
    () => ({
      topProducts: data || [],
      topProductsLoading: isLoading,
      topProductsError: error,
      topProductsValidating: isValidating,
      refetchTopProducts: mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}


export function useStoreYearlySales(storeId, year) {
  // Only fetch once we have both companyId and year
  const key = storeId && year
    ? [
        `${endpoints.dashboard.store.yearlySales(storeId)}`,
        { params: { year } }
      ]
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    fetcher,
    { ...swrOptions, keepPreviousData: true }
  );

  return useMemo(
    () => ({
      data: data || null,
      loading: isLoading,
      error,
      validating: isValidating,
      refetch: mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}


export function useCompanyYearlySales(companyId, year) {
  // Only fetch once we have both companyId and year
  const key = companyId && year
    ? [
        `${endpoints.dashboard.company.yearlySales(companyId)}`,
        { params: { year } }
      ]
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    fetcher,
    { ...swrOptions, keepPreviousData: true }
  );

  return useMemo(
    () => ({
      data: data || null,
      loading: isLoading,
      error,
      validating: isValidating,
      refetch: mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}


export function useStoreExpenses(storeId, period = 'month') {
  // Only fetch once we have a valid storeId
  const key = storeId
    ? [endpoints.dashboard.store.expenses(storeId), { params: { period } }]
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    fetcher,
    { ...swrOptions, keepPreviousData: true }
  );

  return useMemo(
    () => ({
      expenses: data || { total_expenses: 0, period, categories: [] },
      expensesLoading: isLoading,
      expensesError: error,
      expensesValidating: isValidating,
      refetchExpenses: mutate,
    }),
    [data, error, isLoading, isValidating, mutate, period]
  );
}

export function useStoreFeatured(storeId, limit = 3) {
  const key = storeId
    ? [endpoints.dashboard.store.featured(storeId), { params: { limit } }]
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    fetcher,
    { ...swrOptions, keepPreviousData: true }
  );

  return useMemo(
    () => ({
      featuredProducts: Array.isArray(data) ? data : [],
      featuredLoading: isLoading,
      featuredError: error,
      refetchFeatured: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}
