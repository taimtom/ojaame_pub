import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { endpoints, fetcher } from 'src/utils/axios';

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
};

export function useGetTransfers(params = {}) {
  const key = [endpoints.transfer.list, { params }];
  const { data, isLoading, error, isValidating, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      transfers: data?.items || [],
      transfersTotal: data?.total || 0,
      transfersLoading: isLoading,
      transfersError: error,
      transfersValidating: isValidating,
      mutateTransfers: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useGetTransfer(transferId) {
  const key = transferId ? endpoints.transfer.details(transferId) : null;
  const { data, isLoading, error, isValidating, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      transfer: data,
      transferLoading: isLoading,
      transferError: error,
      transferValidating: isValidating,
      mutateTransfer: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export async function createTransferOrder(payload) {
  const response = await axiosInstance.post(endpoints.transfer.create, payload);
  return response.data;
}

export async function packTransferOrder(transferId, payload) {
  const response = await axiosInstance.post(endpoints.transfer.pack(transferId), payload);
  return response.data;
}

export async function assignTransferDriver(transferId, payload) {
  const response = await axiosInstance.post(endpoints.transfer.assignDriver(transferId), payload);
  return response.data;
}

export async function pickupTransferOrder(transferId, payload = {}) {
  const response = await axiosInstance.post(endpoints.transfer.pickup(transferId), payload);
  return response.data;
}

export async function markTransferInTransit(transferId, payload = {}) {
  const response = await axiosInstance.post(endpoints.transfer.inTransit(transferId), payload);
  return response.data;
}

export async function deliverTransferOrder(transferId, payload = {}) {
  const response = await axiosInstance.post(endpoints.transfer.deliver(transferId), payload);
  return response.data;
}

export async function receiveTransferOrder(transferId, payload) {
  const response = await axiosInstance.post(endpoints.transfer.receive(transferId), payload);
  return response.data;
}

export async function closeTransferOrder(transferId, payload = {}) {
  const response = await axiosInstance.post(endpoints.transfer.close(transferId), payload);
  return response.data;
}

export async function getTransferKpis() {
  const response = await axiosInstance.get(endpoints.transfer.kpis);
  return response.data;
}
