import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  keepPreviousData: true,
};

// Build params object, only including month/year/date when they are meaningful
function periodParams(base, period, month, year, date) {
  const p = { ...base, period };
  if (month) p.month = month;
  if (year) p.year = year;
  if (date) p.date = date;
  return p;
}

// ─── Store-dashboard helpers ──────────────────────────────────────────────────

export function useStoreDashboardStats(storeId, period = 'this_month', month = undefined, year = undefined, date = undefined) {
  const key = storeId
    ? [
        endpoints.storeDashboard.stats,
        { params: periodParams({ store_id: storeId }, period, month, year, date) },
      ]
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      stats: data || null,
      statsLoading: isLoading,
      statsError: error,
      refetchStats: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export function useStoreInventoryAlerts(storeId) {
  const key = storeId
    ? [endpoints.storeDashboard.inventoryAlerts, { params: { store_id: storeId } }]
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      alerts: Array.isArray(data) ? data : [],
      alertsLoading: isLoading,
      alertsError: error,
      refetchAlerts: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export function useStoreStockValue(storeId) {
  const key = storeId
    ? [endpoints.storeDashboard.stockValue, { params: { store_id: storeId } }]
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      stockValue: data || null,
      stockValueLoading: isLoading,
      stockValueError: error,
      refetchStockValue: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export function useStoreSalesTrend(storeId, period = 'this_month', month = undefined, year = undefined, date = undefined) {
  const key = storeId
    ? [
        endpoints.storeDashboard.salesTrend,
        { params: periodParams({ store_id: storeId }, period, month, year, date) },
      ]
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      trend: data?.trend || [],
      trendLoading: isLoading,
      trendError: error,
      refetchTrend: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export function useStoreCategoryPerformance(storeId, period = 'this_month', month = undefined, year = undefined, date = undefined) {
  const key = storeId
    ? [
        endpoints.storeDashboard.categoryPerformance,
        { params: periodParams({ store_id: storeId }, period, month, year, date) },
      ]
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      categories: data?.categories || [],
      categoryLoading: isLoading,
      categoryError: error,
      refetchCategories: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

// ─── Reports API (company-scoped) ─────────────────────────────────────────────

export function useStoreProfitLoss(companyId, storeId, period = 'this_month', month = undefined, year = undefined, date = undefined) {
  const key = companyId
    ? [
        endpoints.reports.profitLoss,
        {
          params: periodParams(
            { company_id: companyId, store_id: storeId || undefined },
            period,
            month,
            year,
            date
          ),
        },
      ]
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      profitLoss: data || null,
      profitLossLoading: isLoading,
      profitLossError: error,
      refetchProfitLoss: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export function useCompanyProfitLoss(companyId, period = 'this_month', month = undefined, year = undefined, date = undefined) {
  const key = companyId
    ? [
        endpoints.reports.profitLoss,
        { params: periodParams({ company_id: companyId }, period, month, year, date) },
      ]
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      profitLoss: data || null,
      profitLossLoading: isLoading,
      profitLossError: error,
      refetchProfitLoss: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export function useStoreForecast(storeId) {
  const key = storeId
    ? [endpoints.storeDashboard.forecast, { params: { store_id: storeId } }]
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      forecast: data || null,
      forecastLoading: isLoading,
      forecastError: error,
      refetchForecast: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export function useCompanyRevenueTrend(companyId, period = 'this_year', groupBy = 'month', month = undefined, year = undefined, date = undefined) {
  const key = companyId
    ? [
        endpoints.companyDashboard.revenueTrend,
        {
          params: periodParams(
            { company_id: companyId, group_by: groupBy },
            period,
            month,
            year,
            date
          ),
        },
      ]
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      revenueTrend: data?.trend || [],
      revenueTrendLoading: isLoading,
      revenueTrendError: error,
      refetchRevenueTrend: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}
