import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  keepPreviousData: true,
};

// ─── Store-dashboard helpers ──────────────────────────────────────────────────

export function useStoreDashboardStats(storeId, period = '30d') {
  const key = storeId
    ? [endpoints.storeDashboard.stats, { params: { store_id: storeId, period } }]
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

export function useStoreSalesTrend(storeId, period = '30d') {
  const key = storeId
    ? [endpoints.storeDashboard.salesTrend, { params: { store_id: storeId, period } }]
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

export function useStoreCategoryPerformance(storeId, period = '30d') {
  const key = storeId
    ? [endpoints.storeDashboard.categoryPerformance, { params: { store_id: storeId, period } }]
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

export function useStoreProfitLoss(companyId, storeId, period = '30d') {
  const key = companyId
    ? [
        endpoints.reports.profitLoss,
        { params: { company_id: companyId, store_id: storeId || undefined, period } },
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

export function useCompanyProfitLoss(companyId, period = '30d') {
  const key = companyId
    ? [endpoints.reports.profitLoss, { params: { company_id: companyId, period } }]
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

export function useCompanyRevenueTrend(companyId, period = '1y', groupBy = 'month') {
  const key = companyId
    ? [
        endpoints.companyDashboard.revenueTrend,
        { params: { company_id: companyId, period, group_by: groupBy } },
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
