import useSWR, { mutate as globalMutate } from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

async function revalidateSubscriptionCaches() {
  await Promise.all([
    globalMutate(endpoints.billing.status),
    globalMutate(endpoints.subscription.summary),
  ]);
}

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
};

// ----------------------------------------------------------------------

export function useGetSubscriptionSummary() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    endpoints.subscription.summary,
    fetcher,
    swrOptions
  );

  return useMemo(
    () => ({
      summary: data || null,
      summaryLoading: isLoading,
      summaryError: error,
      isValidating,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

// ----------------------------------------------------------------------

export function useGetSubscriptionInvoices() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    endpoints.subscription.invoices,
    fetcher,
    swrOptions
  );

  return useMemo(
    () => ({
      invoices: data || [],
      invoicesLoading: isLoading,
      invoicesError: error,
      isValidating,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

// ----------------------------------------------------------------------

export function useGetSubscriptionPlans() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    endpoints.subscription.plans,
    fetcher,
    swrOptions
  );

  return useMemo(
    () => ({
      plans: data?.plans || [],
      storePrice: data?.store_price ?? 3000,
      plansLoading: isLoading,
      plansError: error,
      isValidating,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

// ----------------------------------------------------------------------

export async function changePlan({ plan_tier }) {
  const res = await axiosInstance.post(endpoints.subscription.plan, { plan_tier });
  await revalidateSubscriptionCaches();
  return res.data;
}

// ----------------------------------------------------------------------

export async function adjustSeats({ delta, scope, store_id }) {
  const res = await axiosInstance.post(endpoints.subscription.seats, {
    delta,
    scope,
    store_id,
  });
  await revalidateSubscriptionCaches();
  return res.data;
}

// ----------------------------------------------------------------------

export async function initiatePayment({ invoice_id, callback_url }) {
  const res = await axiosInstance.post(endpoints.subscription.invoicesPay, {
    invoice_id,
    callback_url,
  });
  return res.data;
}
