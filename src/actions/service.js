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
// useGetServices - Fetches a list of services for a given store.
// ----------------------------------------------------------------------
export function useGetServices(storeId) {

  const key = storeId ? [endpoints.service.list, { params: { store_id: storeId } }] : null;


  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, {
    ...swrOptions,
    keepPreviousData: true, // Retains old data during revalidation
  });

  const memoizedValue = useMemo(
    () => ({
      services: data || [],
      servicesLoading: isLoading,
      servicesError: error,
      servicesValidating: isValidating,
      servicesEmpty: !isLoading && (!data || data.length === 0),
    }),
    [data, error, isLoading, isValidating]
  );
  return memoizedValue;
}

// ----------------------------------------------------------------------
// useGetService - Fetches a single service's details given its ID and store ID.
// ----------------------------------------------------------------------
export function useGetService(serviceId, storeId) {
  // Build the URL if both serviceId and storeId are provided.
  const url =
    // serviceId && storeId ? [endpoints.service.detail, { params: { store_id: storeId } }] : null;
    serviceId && storeId ? `/api/services/detail/${storeId}/${serviceId}/` : null;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      service: data,
      serviceLoading: isLoading,
      serviceError: error,
      serviceValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------
// useSearchServices - Searches for services based on a query and store ID.
// ----------------------------------------------------------------------
export function useSearchServices(query, storeId) {
  // Only run the search if both query and storeId are provided.
  const key =
    query && storeId
      ? [endpoints.service.search, { params: { query, store_id: storeId } }]
      : null;

  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, {
    ...swrOptions,
    keepPreviousData: true,
  });

  const memoizedValue = useMemo(
    () => ({
      searchResults: data?.results || [],
      searchLoading: isLoading,
      searchError: error,
      searchValidating: isValidating,
      searchEmpty: !isLoading && (!data || data.results.length === 0),
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------
// addService - Creates a new service.
// ----------------------------------------------------------------------
export async function addService(serviceData) {
  try {
    const response = await axiosInstance.post(endpoints.service.add, serviceData);
    return response.data;
  } catch (error) {
    console.error('Error adding service:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// editService - Updates an existing service.
// ----------------------------------------------------------------------
export async function editService(serviceId, serviceData) {
  try {
    // Construct the URL by appending the serviceId.
    const url = `${endpoints.service.edit}/${serviceId}`;
    const response = await axiosInstance.put(url, serviceData);
    return response.data;
  } catch (error) {
    console.error('Error editing service:', error);
    throw error;
  }
}
