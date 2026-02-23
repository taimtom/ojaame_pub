import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------
// SWR Options
// ----------------------------------------------------------------------
const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
};

// ----------------------------------------------------------------------
// useGetCustomers - Fetches a list of customers for a given store.
// The API is expected to accept a query parameter "store_id".
// ----------------------------------------------------------------------
export function useGetCustomers(storeId) {
  const key = storeId ? [endpoints.customers.list, { params: { store_id: storeId } }] : null;
  const { data, isLoading, error, isValidating, mutate } = useSWR(key, fetcher, {
    ...swrOptions,
    keepPreviousData: true,
  });

  return useMemo(
    () => ({
      customers: data || [],
      customersLoading: isLoading,
      customersError: error,
      customersValidating: isValidating,
      customersEmpty: !isLoading && (!data || data.length === 0),
      refetch: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

// ----------------------------------------------------------------------
// useGetCustomer - Fetches a single customer's details given its ID and store ID.
// The API is expected to accept customer_id and store_id as query parameters.
// ----------------------------------------------------------------------
export function useGetCustomer(customerId, storeId) {
  const key =
    customerId && storeId
      ? [`${endpoints.customers.details}${customerId}`, { params: { store_id: storeId } }]
      : null;

  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      customer: data,
      customerLoading: isLoading,
      customerError: error,
      customerValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}


// ----------------------------------------------------------------------
// useSearchCustomers - Searches for customers based on a query and store ID.
// The API is expected to accept "query" and "store_id" as query parameters.
// ----------------------------------------------------------------------
export function useSearchCustomers(query, storeId) {
  const key =
    query && storeId
      ? [endpoints.customers.search, { params: { query, store_id: storeId } }]
      : null;

  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, {
    ...swrOptions,
    keepPreviousData: true,
  });

  return useMemo(
    () => ({
      searchResults: data?.results || [],
      searchLoading: isLoading,
      searchError: error,
      searchValidating: isValidating,
      searchEmpty: !isLoading && (!data || data.results.length === 0),
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------
// addCustomer - Creates a new customer.
// ----------------------------------------------------------------------
export async function addCustomer(customerData) {
  try {
    const response = await axiosInstance.post(endpoints.customers.add, customerData);
    return response.data;
  } catch (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// editCustomer - Updates an existing customer.
// ----------------------------------------------------------------------
export async function editCustomer(customerId, customerData) {
  try {
    // Construct the URL by appending the customerId.
    const url = `${endpoints.customers.edit}/${customerId}`;
    const response = await axiosInstance.put(url, customerData);
    return response.data;
  } catch (error) {
    console.error('Error editing customer:', error);
    throw error;
  }
}

