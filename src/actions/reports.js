import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

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

function reportScopeParams(companyId, storeId) {
  const params = {};
  if (companyId) params.company_id = Number(companyId);
  if (storeId) params.store_id = Number(storeId);
  return params;
}

function reportScopeKey(companyId, storeId) {
  return companyId || storeId;
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

/**
 * Lightweight income-statement summary (COGS / gross / net profit) available on
 * all plan tiers. Use this for dashboards visible to Basic stores. The full P&L
 * report (`useStoreProfitLoss`) remains gated behind the Standard plan.
 */
export function useStoreProfitLossSummary(companyId, storeId, period = 'this_month', month = undefined, year = undefined, date = undefined) {
  const key = reportScopeKey(companyId, storeId)
    ? [
        endpoints.reports.profitLossSummary,
        {
          params: periodParams(
            reportScopeParams(companyId, storeId),
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

export function useStoreProfitLoss(companyId, storeId, period = 'this_month', month = undefined, year = undefined, date = undefined) {
  const key = reportScopeKey(companyId, storeId)
    ? [
        endpoints.reports.profitLoss,
        {
          params: periodParams(
            reportScopeParams(companyId, storeId),
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

export function useStoreTaxEstimate(companyId, storeId, period = 'this_month', month = undefined, year = undefined, date = undefined) {
  const key = reportScopeKey(companyId, storeId)
    ? [
        endpoints.reports.tax,
        {
          params: periodParams(
            reportScopeParams(companyId, storeId),
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
      taxEstimate: data || null,
      taxEstimateLoading: isLoading,
      taxEstimateError: error,
      refetchTaxEstimate: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export function useStoreVatReturn(companyId, storeId, period = 'this_month', month = undefined, year = undefined, date = undefined) {
  const key = reportScopeKey(companyId, storeId)
    ? [
        endpoints.reports.vatReturn,
        {
          params: periodParams(
            reportScopeParams(companyId, storeId),
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
      vatReturn: data || null,
      vatReturnLoading: isLoading,
      vatReturnError: error,
      refetchVatReturn: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export function useTaxAnnual(companyId, year, storeId) {
  const key = companyId && year
    ? [
        endpoints.reports.taxAnnual,
        { params: { company_id: companyId, year, ...(storeId ? { store_id: storeId } : {}) } },
      ]
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      taxAnnual: data || null,
      taxAnnualLoading: isLoading,
      taxAnnualError: error,
      refetchTaxAnnual: mutate,
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

// ─── Customer report ───────────────────────────────────────────────────────────

export function useCustomerReport(
  storeId,
  period = 'this_month',
  month = undefined,
  year = undefined,
  date = undefined,
  options = {}
) {
  const { q, sort = 'amount_owing', order = 'desc', page = 1, pageSize = 25 } = options;

  const key = storeId
    ? [
        endpoints.reports.customers,
        {
          params: {
            ...periodParams({ store_id: storeId, sort, order, page, page_size: pageSize }, period, month, year, date),
            ...(q ? { q } : {}),
          },
        },
      ]
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      report: data || null,
      reportLoading: isLoading,
      reportError: error,
      refetchReport: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export function useCustomerReportDetail(
  storeId,
  customerId,
  period = 'this_month',
  month = undefined,
  year = undefined,
  date = undefined
) {
  const key = storeId && customerId
    ? [
        endpoints.reports.customerDetail(customerId),
        { params: periodParams({ store_id: storeId }, period, month, year, date) },
      ]
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      detail: data || null,
      detailLoading: isLoading,
      detailError: error,
      refetchDetail: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export async function collectCustomerPayment(customerId, payload) {
  const url = endpoints.reports.collectCustomerPayment(customerId);
  const response = await axiosInstance.post(url, payload);
  return response.data;
}

export async function mergeCustomerAccounts(payload) {
  const response = await axiosInstance.post(endpoints.reports.mergeCustomers, payload);
  return response.data;
}

// ─── Partner report ────────────────────────────────────────────────────────────

export function usePartnerReport(
  storeId,
  period = 'this_month',
  month = undefined,
  year = undefined,
  date = undefined,
  options = {}
) {
  const { q, sort = 'amount_you_owe', order = 'desc', page = 1, pageSize = 25 } = options;

  const key = storeId
    ? [
        endpoints.reports.partners,
        {
          params: {
            ...periodParams({ store_id: storeId, sort, order, page, page_size: pageSize }, period, month, year, date),
            ...(q ? { q } : {}),
          },
        },
      ]
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      report: data || null,
      reportLoading: isLoading,
      reportError: error,
      refetchReport: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export function usePartnerReportDetail(
  storeId,
  partnerId,
  period = 'this_month',
  month = undefined,
  year = undefined,
  date = undefined
) {
  const key =
    storeId && partnerId
      ? [
          endpoints.reports.partnerDetail(partnerId),
          { params: periodParams({ store_id: storeId }, period, month, year, date) },
        ]
      : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      detail: data || null,
      detailLoading: isLoading,
      detailError: error,
      refetchDetail: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export async function payPartner(partnerId, payload) {
  const response = await axiosInstance.post(endpoints.reports.payPartner(partnerId), payload);
  return response.data;
}

export async function collectPartnerPayment(partnerId, payload) {
  const response = await axiosInstance.post(endpoints.reports.collectPartnerPayment(partnerId), payload);
  return response.data;
}

export function useStoreCashFlow(companyId, storeId, period = 'this_month', month = undefined, year = undefined, date = undefined) {
  const key = reportScopeKey(companyId, storeId)
    ? [endpoints.reports.cashFlow, { params: periodParams(reportScopeParams(companyId, storeId), period, month, year, date) }]
    : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);
  return useMemo(
    () => ({ cashFlow: data || null, cashFlowLoading: isLoading, cashFlowError: error, refetchCashFlow: mutate }),
    [data, error, isLoading, mutate]
  );
}

export function useStoreBalanceSheet(companyId, storeId, asOf) {
  const key = reportScopeKey(companyId, storeId)
    ? [endpoints.reports.balanceSheet, { params: { ...reportScopeParams(companyId, storeId), as_of: asOf } }]
    : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);
  return useMemo(
    () => ({ balanceSheet: data || null, balanceSheetLoading: isLoading, balanceSheetError: error, refetchBalanceSheet: mutate }),
    [data, error, isLoading, mutate]
  );
}

export function useStoreTrialBalance(companyId, period = 'this_month', month = undefined, year = undefined, date = undefined) {
  const key = companyId
    ? [endpoints.reports.trialBalance, { params: periodParams({ company_id: companyId }, period, month, year, date) }]
    : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);
  return useMemo(
    () => ({ trialBalance: data || null, trialBalanceLoading: isLoading, trialBalanceError: error, refetchTrialBalance: mutate }),
    [data, error, isLoading, mutate]
  );
}

export function useStoreInventoryMovement(storeId, period = 'this_month', month = undefined, year = undefined, date = undefined) {
  const key = storeId
    ? [endpoints.storeDashboard.inventoryMovement, { params: periodParams({ store_id: storeId }, period, month, year, date) }]
    : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions);
  return useMemo(
    () => ({ movement: data || null, movementLoading: isLoading, movementError: error, refetchMovement: mutate }),
    [data, error, isLoading, mutate]
  );
}
