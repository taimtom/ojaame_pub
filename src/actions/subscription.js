import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

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

export async function adjustSeats({ delta, scope, store_id }) {
  const res = await axiosInstance.post(endpoints.subscription.seats, {
    delta,
    scope,
    store_id,
  });
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
