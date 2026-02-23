import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------
// Updated SWR options to trigger immediate revalidation on mount.
const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: true,    // Revalidate when window refocuses
  revalidateOnReconnect: true, // Revalidate on network reconnect
  revalidateOnMount: true,     // Immediately fetch data when component mounts
  // refreshInterval: 5000,    // Uncomment if you want periodic refreshing
};

// ----------------------------------------------------------------------
// useGetStores - Fetches list of stores
export function useGetStores() {
  const url = endpoints.store.list;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      stores: data || [], // List of stores from the response
      storesLoading: isLoading,
      storesError: error,
      storesValidating: isValidating,
      storesEmpty: !isLoading && !data?.length, // Check if stores data is empty
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------
// useGetStore - Fetches details for a single store by storeId
export function useGetStore(storeId) {
  const url = storeId ? `${endpoints.store.details}${storeId}` : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      store: data, // Use data directly if your backend returns the store object
      storeLoading: isLoading,
      storeError: error,
      storeValidating: isValidating,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------
// useSearchStores - Searches stores by a query parameter
export function useSearchStores(query) {
  // Only generate a key if query exists
  const url = query ? [endpoints.store.search, { params: { query } }] : null;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, {
    ...swrOptions,
    keepPreviousData: true,
  });

  return useMemo(
    () => ({
      searchResults: data?.results || [], // Search results for stores
      searchLoading: isLoading,
      searchError: error,
      searchValidating: isValidating,
      searchEmpty: !isLoading && (!data || data.length === 0),
    }),
    [data, error, isLoading, isValidating]
  );
}


// ----------------------------------------------------------------------
// addStore - Creates a new Store.
export async function addStore(storeData) {
  try {
    const response = await axiosInstance.post(endpoints.store.add, storeData);
    return response.data;
  } catch (error) {
    console.error('Error adding Store:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// editStore - Updates an existing store.
export async function editStore(storeId, storeData) {
  try {
    const url = `${endpoints.store.edit}/${storeId}`;
    const response = await axiosInstance.put(url, storeData);
    return response.data;
  } catch (error) {
    console.error('Error editing store:', error);
    throw error;
  }
}
