import { useMemo } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------
// SWR Options
// src/utils/axios.js
const swrOptions = {
  revalidateIfStale:   true,
  revalidateOnFocus:   true,
  revalidateOnReconnect: true,
  revalidateOnMount:   true,
};
// ----------------------------------------------------------------------
// useGetPaymentMethods - Fetches a list of payment methods for a given store.
export function useGetPaymentMethods(storeId) {
  const key = storeId
    ? [endpoints.paymentMethod.list, { params: { store_id: storeId } }]
    : null;
  const { data, error, isValidating } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      paymentMethods: data || [],
      paymentMethodsLoading: !error && !data,
      paymentMethodsError: error,
      paymentMethodsValidating: isValidating,
      paymentMethodsEmpty: !data || data.length === 0,
    }),
    [data, error, isValidating]
  );
}

// ----------------------------------------------------------------------
// useGetPaymentMethod - Fetches details for a specific payment method by id and store.
export function useGetPaymentMethod(paymentMethodId, storeId) {
  const key =
    paymentMethodId && storeId
      ? [
          `${endpoints.paymentMethod.details}/${paymentMethodId}`,
          { params: { store_id: storeId } },
        ]
      : null;
  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      paymentMethod: data,
      paymentMethodLoading: isLoading,
      paymentMethodError: error,
      paymentMethodValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}


// ----------------------------------------------------------------------
// addPaymentMethod - Creates a new payment method.
// Now takes storeId and passes it as a `params` query string!
export async function addPaymentMethod(paymentMethodData, storeId) {
  const response = await axiosInstance.post(
    endpoints.paymentMethod.add,
    paymentMethodData,
    { params: { store_id: storeId } }
  );
  // revalidate the list cache immediately
  globalMutate([endpoints.paymentMethod.list, { params: { store_id: storeId } }]);
  return response.data;
}

// ----------------------------------------------------------------------
// editPaymentMethod - Updates an existing payment method.
// Also includes store_id as a query param.
export async function editPaymentMethod(paymentMethodId, paymentMethodData, storeId) {
  const url = `${endpoints.paymentMethod.edit}/${paymentMethodId}`;
  const response = await axiosInstance.put(
    url,
    paymentMethodData,
    { params: { store_id: storeId } }
  );
  globalMutate([endpoints.paymentMethod.list, { params: { store_id: storeId } }]);
  return response.data;
}


// ----------------------------------------------------------------------
// deletePaymentMethod - Marks a payment method as inactive.
export async function deletePaymentMethod(paymentMethodId, storeId) {
  try {
    const url = `${endpoints.paymentMethod.delete}/${paymentMethodId}`;
    const response = await axiosInstance.delete(url, { params: { store_id: storeId } });
    return response.data;
  } catch (error) {
    console.error('Error deleting payment method:', error);
    throw error;
  }
}
