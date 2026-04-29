import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';
import { normalizePaginatedResponse } from './pagination';

// ----------------------------------------------------------------------
// SWR Options (reuse these from your products script)
const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
};

// ----------------------------------------------------------------------
// Hooks for Sales Data

/**
 * useGetSales - Fetches a list of sales for a given store.
 *
 * @param {string | number} storeId - The store ID to filter sales.
 * @returns {object} - An object with sales data and loading/error states.
 */
export function useGetSales(storeId, queryParams = {}) {
  // Ensure your endpoints.sales.list is defined (e.g., '/api/sales/list/')
  const key = storeId ? [endpoints.sales.list, { params: { store_id: storeId, ...queryParams } }] : null;
  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, {
    ...swrOptions,
    keepPreviousData: true,
  });

  const memoizedValue = useMemo(
    () => {
      const paged = normalizePaginatedResponse(data);
      return {
      sales: paged.items,
      salesPagination: paged.pagination,
      salesLoading: isLoading,
      salesError: error,
      salesValidating: isValidating,
      salesEmpty: !isLoading && paged.items.length === 0,
    };
    },
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

/**
 * useGetSale - Fetches details of a single sale.
 *
 * @param {string|number} saleId - The sale's unique identifier.
 * @param {string|number} storeId - The store ID.
 * @returns {object} - An object with sale details and loading/error states.
 */
export function useGetSale(saleId, storeId) {
  // Construct URL dynamically (adjust as needed for your backend)
  const url = saleId && storeId ? `/api/sales/detail/${storeId}/${saleId}/` : null;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      sale: data,
      saleLoading: isLoading,
      saleError: error,
      saleValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

/**
 * useSearchSales - Searches for sales by query within a store.
 *
 * @param {string} query - The search term.
 * @param {string|number} storeId - The store ID.
 * @returns {object} - An object with search results and status flags.
 */
export function useSearchSales(query, storeId, queryParams = {}) {
  const key =
    query && storeId
      ? [endpoints.sales.search, { params: { query, q: query, store_id: storeId, ...queryParams } }]
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

/**
 * useGetSalesHistory - Fetches the history for a specific sale.
 *
 * @param {string|number} storeId - The sale's unique identifier.
 * @returns {object} - An object containing the sales history and status flags.
 */
export function useGetSalesHistory(storeId, queryParams = {}) {
  // const key = saleId ? [endpoints.sales.history, { params: { sales_id: saleId } }] : null;
  const key = storeId ? [endpoints.sales.history, { params: { store_id: storeId, ...queryParams } }] : null;
  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => {
      const paged = normalizePaginatedResponse(data);
      return {
      history: paged.items,
      historyPagination: paged.pagination,
      historyLoading: isLoading,
      historyError: error,
      historyValidating: isValidating,
      HistoryEmpty: !isLoading && paged.items.length === 0,
    };
    },
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

/**
 * useGetSalesHistoryList - Fetches the sales history (sales list) for a specific sale,
 * using both the store and sale IDs.
 *
 * @param {string|number} storeId - The store's unique identifier.
 * @param {string|number} saleId - The sale's unique identifier.
 * @returns {object} - An object containing the sales history list and loading/error states.
 */
export function useGetSalesHistoryList(storeId, saleId, queryParams = {}) {
  const key = storeId && saleId
    ? [`${endpoints.sales.saleslist}${storeId}/${saleId}/`, { params: { ...queryParams } }]
    : null;
  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => {
      const paged = normalizePaginatedResponse(data);
      return {
      salesHistoryList: paged.items,
      salesHistoryPagination: paged.pagination,
      salesHistoryListLoading: isLoading,
      salesHistoryListError: error,
      salesHistoryListValidating: isValidating,
      salesHistoryEmpty: !isLoading && paged.items.length === 0,
    };
    },
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------
// Sales Operations

/**
 * addSale - Creates a new sale.
 *
 * @param {object} saleData - The sale data to be created (should match SalesCreate schema).
 * @returns {Promise<object>} - The created sale data.
 */
export async function addSale(saleData) {
  try {
    const response = await axiosInstance.post(endpoints.sales.add, saleData);
    return response.data;
  } catch (error) {
    console.error('Error adding sale:', error);
    throw error;
  }
}

/**
 * editSale - Updates an existing sale.
 *
 * @param {string|number} saleId - The ID of the sale to update.
 * @param {object} saleData - The updated sale data.
 * @returns {Promise<object>} - The updated sale data.
 */
export async function editSale(saleId, saleData) {
  try {
    // Assuming your backend uses a URL pattern like /api/sales/edit/{saleId}
    const url = `${endpoints.sales.edit}/${saleId}`;
    const response = await axiosInstance.put(url, saleData);
    return response.data;
  } catch (error) {
    console.error('Error editing sale:', error);
    throw error;
  }
}

/**
 * addPaymentToSale - Adds a payment to an existing sale.
 *
 * @param {string|number} saleId - The ID of the sale to add payment to.
 * @param {object} paymentData - The payment data (payment_method_id, amount, reference, notes).
 * @returns {Promise<object>} - The created payment data.
 */
export async function addPaymentToSale(saleId, paymentData) {
  try {
    const url = `/api/sales/${saleId}/payment`;
    const response = await axiosInstance.post(url, paymentData);
    return response.data;
  } catch (error) {
    console.error('Error adding payment to sale:', error);
    throw error;
  }
}

/**
 * getSalePayments - Retrieves all payments for a specific sale.
 *
 * @param {string|number} saleId - The ID of the sale.
 * @returns {Promise<object>} - The sale's payment data.
 */
export async function getSalePayments(saleId) {
  try {
    const url = `/api/sales/${saleId}/payments`;
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching sale payments:', error);
    throw error;
  }
}

/**
 * updateSalePayment - Updates an existing payment for a sale.
 *
 * @param {string|number} saleId - The ID of the sale.
 * @param {string|number} paymentId - The ID of the payment to update.
 * @param {object} paymentData - The updated payment data.
 * @returns {Promise<object>} - The updated payment data.
 */
export async function updateSalePayment(saleId, paymentId, paymentData) {
  try {
    const url = `/api/sales/${saleId}/payment/${paymentId}`;
    const response = await axiosInstance.put(url, paymentData);
    return response.data;
  } catch (error) {
    console.error('Error updating sale payment:', error);
    throw error;
  }
}

/**
 * removeSalePayment - Removes a payment from a sale.
 *
 * @param {string|number} saleId - The ID of the sale.
 * @param {string|number} paymentId - The ID of the payment to remove.
 * @returns {Promise<object>} - Success response.
 */
export async function removeSalePayment(saleId, paymentId) {
  try {
    const url = `/api/sales/${saleId}/payment/${paymentId}`;
    const response = await axiosInstance.delete(url);
    return response.data;
  } catch (error) {
    console.error('Error removing sale payment:', error);
    throw error;
  }
}

/**
 * markSaleAsPaid - Marks a credit sale as fully paid.
 *
 * @param {string|number} saleId - The ID of the credit sale to mark as paid.
 * @returns {Promise<object>} - The updated sale data.
 */
export async function markSaleAsPaid(saleId) {
  try {
    const url = `/api/sales/${saleId}/mark-paid`;
    const response = await axiosInstance.post(url);
    return response.data;
  } catch (error) {
    console.error('Error marking sale as paid:', error);
    throw error;
  }
}

/**
 * deleteSale - Deletes/voids a sale.
 *
 * @param {string|number} saleId - The ID of the sale to delete.
 * @returns {Promise<object>} - Success response.
 */
export async function deleteSale(saleId) {
  try {
    const url = `/api/sales/${saleId}`;
    const response = await axiosInstance.delete(url);
    return response.data;
  } catch (error) {
    console.error('Error deleting sale:', error);
    throw error;
  }
}
