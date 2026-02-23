import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------
// SWR Options
const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
};

// ----------------------------------------------------------------------
// useGetCategories - Fetches a list of categories for a given store.
export function useGetCategories(storeId) {
  // Use endpoints.categories.list (plural) instead of endpoints.category.list
  const key = storeId ? [endpoints.categories.list, { params: { store_id: storeId } }] : null;
  const { data, isLoading, error, isValidating, mutate } = useSWR(key, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      categories: data || [],
      categoriesLoading: isLoading,
      categoriesError: error,
      categoriesValidating: isValidating,
      categoriesEmpty: !isLoading && (!data || data.length === 0),
      mutateCategories: mutate, // Expose mutate function for manual refresh
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------
// useGetCategory - Fetches details for a specific category by store and category id.
export function useGetCategory(categoryId, storeId) {
  // Construct the URL using the details endpoint.
  // Adjust the URL format if your backend expects a different structure.
  const url =
    categoryId && storeId ? `${endpoints.categories.details}/${storeId}/${categoryId}` : null;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      category: data,
      categoryLoading: isLoading,
      categoryError: error,
      categoryValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------
// useSearchCategories - Searches categories by name and store id.
export function useSearchCategories(query, storeId) {
  const key =
    query && storeId ? [endpoints.categories.search, { params: { query, store_id: storeId } }] : null;
  const { data, isLoading, error, isValidating } = useSWR(
    key,
    fetcher,
    { ...swrOptions, keepPreviousData: true }
  );

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
// addCategory - Creates a new category.
export async function addCategory(categoryData) {
  try {
    const response = await axiosInstance.post(endpoints.categories.add, categoryData);
    return response.data;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// editCategory - Updates an existing category.
export async function editCategory(categoryId, categoryData) {
  try {
    const url = `${endpoints.categories.edit}/${categoryId}`;
    const response = await axiosInstance.put(url, categoryData);
    return response.data;
  } catch (error) {
    console.error('Error editing category:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// addDefaultCategories - Adds default categories for a store based on business type.
export async function addDefaultCategories(storeId) {
  try {
    const url = `${endpoints.categories.addDefaults}/${storeId}`;
    const response = await axiosInstance.post(url);
    return response.data;
  } catch (error) {
    console.error('Error adding default categories:', error);
    throw error;
  }
}
