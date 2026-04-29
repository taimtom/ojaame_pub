import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance,{ fetcher, endpoints } from 'src/utils/axios';
import { normalizePaginatedResponse } from './pagination';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
};

/**
 * useGetProducts - Fetches a list of products for a given store.
 *
 * @param {string | number} storeId - The numeric store id used as a query parameter.
 * @returns {object} - An object containing the products list and loading/error states.
 */

// ----------------------------------------------------------------------
export function useGetProducts(storeId, queryParams = {}) {
  const key = storeId
    ? [endpoints.product.list, { params: { store_id: storeId, ...queryParams } }]
    : null;

  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, {
    ...swrOptions,
    keepPreviousData: true, // Retains old data during revalidation
  });

  const memoizedValue = useMemo(
    () => {
      const paged = normalizePaginatedResponse(data);
      return {
      products: paged.items,
      productsPagination: paged.pagination,
      productsLoading: isLoading,
      productsError: error,
      productsValidating: isValidating,
      productsEmpty: !isLoading && paged.items.length === 0,
    };
    },
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}


// ----------------------------------------------------------------------

export function useGetProduct(productId, storeId) {
  // Only build the URL if both productId and storeId are provided.
  const url =
    productId && storeId ? `/api/product/detail/${storeId}/${productId}/` : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      // Assuming your API returns the product details directly.
      product: data,
      productLoading: isLoading,
      productError: error,
      productValidating: isValidating,
      /** Call after mutations (e.g. save product) to refetch detail including sub_items */
      mutateProduct: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}
// ----------------------------------------------------------------------

/**
 * useSearchProducts - Fetches search results for products based on the provided query and store ID.
 *
 * @param {string} query - The search term.
 * @param {string|number} storeId - The store ID.
 * @returns {object} - An object containing the search results and status flags.
 */
export function useSearchProducts(query, storeId) {
  // Only run the search if both query and storeId are provided.
  const key =
    query && storeId ? [endpoints.product.search, { params: { query, store_id: storeId } }] : null;

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

/**
 * useGetProductHistories - Fetches all product histories for a specific store.
 *
 * The URL is built using only the store_id parameter:
 *   /api/product/history?store_id=STORE_ID
 */
export function useGetProductHistories(storeId, queryParams = {}) {
  // const key = storeId ? `/api/product/history?store_id=${storeId}` : null;
  const key = storeId
    ? [endpoints.product.history, { params: { store_id: storeId, ...queryParams } }]
    : null;

  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => {
      const paged = normalizePaginatedResponse(data);
      return {
      productHistories: paged.items,
      productHistoriesPagination: paged.pagination,
      productHistoriesLoading: isLoading,
      productHistoriesError: error,
      productHistoriesValidating: isValidating,
      productHistoriesEmpty: !isLoading && paged.items.length === 0,
    };
    },
    [data, error, isLoading, isValidating]
  );
}


/**
 * addProduct - Creates a new product.
 *
 * @param {Object} productData - The product data to add.
 * @returns {Promise<Object>} - The created product data.
 */
export async function addProduct(productData) {
  try {
    const response = await axiosInstance.post(endpoints.product.add, productData);
    return response.data;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}

/**
 * editProduct - Updates an existing product.
 *
 * @param {number|string} productId - The ID of the product to update.
 * @param {Object} productData - The updated product data.
 * @returns {Promise<Object>} - The updated product data.
 */
export async function editProduct(productId, productData) {
  try {
    const url = `${endpoints.product.edit}/${productId}`;
    const response = await axiosInstance.put(url, productData);
    return response.data;
  } catch (error) {
    console.error('Error editing product:', error);
    throw error;
  }
}

/**
 * publishProduct - Updates only the publish status of a product.
 *
 * @param {number|string} productId - The ID of the product.
 * @param {string} publish - Either 'publish' or 'draft'.
 * @returns {Promise<Object>}
 */
export async function publishProduct(productId, publish) {
  try {
    const url = `${endpoints.product.publish}/${productId}`;
    const response = await axiosInstance.patch(url, { publish });
    return response.data;
  } catch (error) {
    console.error('Error updating product publish status:', error);
    throw error;
  }
}

export async function changeProductPrice(productId, priceData) {
  try {
    const url = `${endpoints.product.changePrice}/${productId}`;
    const response = await axiosInstance.patch(url, priceData);
    return response.data;
  } catch (error) {
    console.error('Error changing product price:', error);
    throw error;
  }
}

/**
 * updateProductQuantity - Updates or adds to a product's quantity.
 *
 * @param {number|string} productId - The ID of the product.
 * @param {Object} quantityData - The data containing the quantity update.
 * @returns {Promise<Object>} - The updated product quantity data.
 */
export async function updateProductQuantity(productId, quantityData) {
  try {
    // Construct the URL using the product ID.
    const url = `${endpoints.product.quantity}/${productId}`;
    // Use PUT if PATCH is not allowed by your backend.
    const response = await axiosInstance.patch(url, quantityData);
    return response.data;
  } catch (error) {
    console.error('Error updating product quantity:', error);
    throw error;
  }
}


/**
 * adjustProductStock - Records a stock loss/waste adjustment (damaged, wasted, expired, stolen, lost).
 *
 * @param {number|string} productId - The ID of the product.
 * @param {Object} adjustmentData - { product_id, store_id, quantity, reason, description? }
 * @returns {Promise<Object>}
 */
export async function adjustProductStock(productId, adjustmentData) {
  try {
    const url = `${endpoints.product.adjust}/${productId}`;
    const response = await axiosInstance.patch(url, adjustmentData);
    return response.data;
  } catch (error) {
    console.error('Error adjusting product stock:', error);
    throw error;
  }
}

/**
 * Record usage/consumption for a production-input product (ingredient/raw material).
 * PATCH /api/product/usage/{productId}
 */
export async function recordProductUsage(productId, { store_id, quantity, description }) {
  try {
    const url = `${endpoints.product.usage}/${productId}`;
    const response = await axiosInstance.patch(url, {
      store_id,
      quantity,
      description: description || undefined,
    });
    return response.data;
  } catch (error) {
    console.error('Error recording usage:', error);
    throw error;
  }
}


/**
 * useGetProductMovements - Fetches the product movement history for a specific product in a store.
 *
 * @param {string | number} storeId - The ID of the store.
 * @param {string | number} productId - The ID of the product.
 * @returns {object} - An object containing the product movement list and loading/error states.
 */
export function useGetProductSalesHistory(storeId, productId, queryParams = {}) {
  const key =
    storeId && productId
      ? [endpoints.product.salesHistory, { params: { store_id: storeId, product_id: productId, ...queryParams } }]
      : null;

  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => {
      const paged = normalizePaginatedResponse(data);
      return {
      productSalesHistory: paged.items,
      productSalesHistoryPagination: paged.pagination,
      productSalesHistoryLoading: isLoading,
      productSalesHistoryError: error,
      productSalesHistoryValidating: isValidating,
    };
    },
    [data, error, isLoading, isValidating]
  );
}

export function useGetProductMovements(storeId, productId, queryParams = {}) {
  // Build the SWR key only if both storeId and productId are provided.
  const key =
    storeId && productId
      ? [endpoints.product.movement, { params: { store_id: storeId, product_id: productId, ...queryParams } }]
      : null;

  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => {
      const paged = normalizePaginatedResponse(data);
      return {
      productMovements: paged.items,
      productMovementsPagination: paged.pagination,
      productMovementsLoading: isLoading,
      productMovementsError: error,
      productMovementsValidating: isValidating,
      productMovementsEmpty: !isLoading && paged.items.length === 0,
    };
    },
    [data, error, isLoading, isValidating]
  );
}
