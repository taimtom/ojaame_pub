import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';
import { normalizePaginatedResponse } from './pagination';

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
export function useGetServices(storeId, queryParams = {}) {
  const key = storeId ? [endpoints.service.list, { params: { store_id: storeId, ...queryParams } }] : null;
  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, {
    ...swrOptions,
    keepPreviousData: true,
  });

  const memoizedValue = useMemo(
    () => {
      const paged = normalizePaginatedResponse(data);
      return {
      services: paged.items,
      servicesPagination: paged.pagination,
      servicesLoading: isLoading,
      servicesError: error,
      servicesValidating: isValidating,
      servicesEmpty: !isLoading && paged.items.length === 0,
    };
    },
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
export function useSearchServices(query, storeId, queryParams = {}) {
  const key =
    query && storeId
      ? [endpoints.service.search, { params: { query, q: query, store_id: storeId, ...queryParams } }]
      : null;

  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, {
    ...swrOptions,
    keepPreviousData: true,
  });

  const memoizedValue = useMemo(
    () => {
      const paged = normalizePaginatedResponse(data);
      return {
      searchResults: paged.items,
      searchPagination: paged.pagination,
      searchLoading: isLoading,
      searchError: error,
      searchValidating: isValidating,
      searchEmpty: !isLoading && paged.items.length === 0,
    };
    },
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
export function useGetServiceSaleHistory(storeId, serviceId, queryParams = {}) {
  const key =
    storeId && serviceId
      ? [endpoints.service.saleHistory, { params: { store_id: storeId, service_id: serviceId, ...queryParams } }]
      : null;

  const { data, isLoading, error } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => {
      const paged = normalizePaginatedResponse(data);
      return {
      serviceSaleHistory: paged.items,
      serviceSaleHistoryPagination: paged.pagination,
      serviceSaleHistoryLoading: isLoading,
      serviceSaleHistoryError: error,
    };
    },
    [data, error, isLoading]
  );
}

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
