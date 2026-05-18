import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';
import { normalizePaginatedResponse } from './pagination';

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
};

export const PLATFORM_FEE_PERCENT = 10;

export function computePayoutPreview(listPrice) {
  const gross = Math.max(Number(listPrice) || 0, 0);
  if (gross <= 0) {
    return {
      gross_amount: 0,
      platform_fee_percent: PLATFORM_FEE_PERCENT,
      platform_fee_amount: 0,
      merchant_payout_amount: 0,
    };
  }
  const platformFeeRounded = Math.round(gross * PLATFORM_FEE_PERCENT) / 100;
  return {
    gross_amount: gross,
    platform_fee_percent: PLATFORM_FEE_PERCENT,
    platform_fee_amount: platformFeeRounded,
    merchant_payout_amount: Math.round((gross - platformFeeRounded) * 100) / 100,
  };
}

export function useGetDigitalProducts(storeId, queryParams = {}) {
  const key = storeId
    ? [endpoints.digitalProduct.list, { params: { store_id: storeId, ...queryParams } }]
    : null;
  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, {
    ...swrOptions,
    keepPreviousData: true,
  });

  return useMemo(() => {
    const paged = normalizePaginatedResponse(data);
    return {
      digitalProducts: paged.items,
      digitalProductsPagination: paged.pagination,
      digitalProductsLoading: isLoading,
      digitalProductsError: error,
      digitalProductsValidating: isValidating,
      digitalProductsEmpty: !isLoading && paged.items.length === 0,
    };
  }, [data, error, isLoading, isValidating]);
}

export function useGetDigitalProduct(productId, storeId) {
  const url =
    productId && storeId ? `/api/digital-products/detail/${storeId}/${productId}/` : null;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      digitalProduct: data,
      digitalProductLoading: isLoading,
      digitalProductError: error,
      digitalProductValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

export async function addDigitalProduct(payload) {
  const response = await axiosInstance.post(endpoints.digitalProduct.add, payload);
  return response.data;
}

export async function editDigitalProduct(productId, payload) {
  const response = await axiosInstance.put(`${endpoints.digitalProduct.edit}/${productId}`, payload);
  return response.data;
}

export async function deleteDigitalProduct(productId) {
  const response = await axiosInstance.delete(`${endpoints.digitalProduct.edit}/${productId}`);
  return response.data;
}
