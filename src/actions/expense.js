// src/services/expense.js

import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';
import { normalizePaginatedResponse } from './pagination';

// ----------------------------------------------------------------------
// SWR global options for expenses
const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus:  false,
  revalidateOnReconnect: true,
};

// ----------------------------------------------------------------------
// useGetExpenses — Fetch all expenses for a given store.
export function useGetExpenses(storeId, queryParams = {}) {
  const key = storeId
    ? [endpoints.expense.list, { params: { store_id: storeId, ...queryParams } }]
    : null;

  const {
    data,
    error,        // <-- this is the SWR error object (if any)
    isLoading,
    isValidating,
  } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => {
      const paged = normalizePaginatedResponse(data);
      return {
      expenses: paged.items,
      expensesPagination: paged.pagination,
      expensesLoading: isLoading,
      expensesError: error,      // expose the raw error here
      isValidating,
      isEmpty: !isLoading && paged.items.length === 0,
    };
    },
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------
// useGetExpense — Fetch a single expense by id and store.
export function useGetExpense(expenseId, storeId) {
  const url =
    expenseId && storeId
      ? `${endpoints.expense.edit}/${expenseId}?store_id=${storeId}`
      : null;

  const { data, error, isLoading, isValidating } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      expense:      data,
      isLoading,
      isError:      !!error,
      isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------
// useGetExpenseSummary — Fetch expense summary by category within optional date range.
export function useGetExpenseSummary(storeId, startDate = null, endDate = null) {
  const params = { store_id: storeId };
  if (startDate) params.start_date = startDate;
  if (endDate)   params.end_date   = endDate;

  const key = storeId
    ? [endpoints.expense.summary, { params }]
    : null;

  const { data, error, isLoading, isValidating } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      summary:      data || { categories: [], total_expenses: 0 },
      isLoading,
      isError:      !!error,
      isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------
// addExpense — Create a new expense.
export async function addExpense(expenseData) {
  try {
    const res = await axiosInstance.post(endpoints.expense.add, expenseData);
    return res.data;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// editExpense — Update an existing expense.
export async function editExpense(expenseId, expenseData) {
  try {
    const url = `${endpoints.expense.edit}/${expenseId}`;
    const res = await axiosInstance.put(url, expenseData);
    return res.data;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// deleteExpense — Delete an expense by id (requires store_id as query param).
export async function deleteExpense(expenseId, storeId) {
  try {
    const url = `${endpoints.expense.delete}/${expenseId}`;
    const res = await axiosInstance.delete(url, { params: { store_id: storeId } });
    return res.data;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
}
