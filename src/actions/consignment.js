import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { endpoints, fetcher } from 'src/utils/axios';

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
};

export function useGetConsignments(params = {}) {
  const key = [endpoints.consignment.list, { params }];
  const { data, isLoading, error, isValidating, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      consignments: data?.items || [],
      consignmentsTotal: data?.total || 0,
      consignmentsLoading: isLoading,
      consignmentsError: error,
      consignmentsValidating: isValidating,
      mutateConsignments: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useGetConsignment(consignmentId) {
  const key = consignmentId ? endpoints.consignment.details(consignmentId) : null;
  const { data, isLoading, error, isValidating, mutate } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      consignment: data,
      consignmentLoading: isLoading,
      consignmentError: error,
      consignmentValidating: isValidating,
      mutateConsignment: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useGetConsignmentPartners() {
  const { data, isLoading, error, mutate } = useSWR(
    endpoints.consignment.partners,
    fetcher,
    swrOptions
  );

  return useMemo(
    () => ({
      partners: data || [],
      partnersLoading: isLoading,
      partnersError: error,
      mutatePartners: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export async function createConsignment(payload) {
  const response = await axiosInstance.post(endpoints.consignment.create, payload);
  return response.data;
}

export async function updateConsignment(id, payload) {
  const response = await axiosInstance.put(endpoints.consignment.details(id), payload);
  return response.data;
}

export async function acceptConsignment(id, payload = {}) {
  const response = await axiosInstance.post(endpoints.consignment.accept(id), payload);
  return response.data;
}

export async function sendConsignment(id, payload = {}) {
  const response = await axiosInstance.post(endpoints.consignment.send(id), payload);
  return response.data;
}

export async function receiveConsignment(id, payload) {
  const response = await axiosInstance.post(endpoints.consignment.receive(id), payload);
  return response.data;
}

export async function returnConsignment(id, payload) {
  const response = await axiosInstance.post(endpoints.consignment.return(id), payload);
  return response.data;
}

export async function recordPartnerSale(id, payload) {
  const response = await axiosInstance.post(endpoints.consignment.recordPartnerSale(id), payload);
  return response.data;
}

export async function settleConsignment(id, payload = {}) {
  const response = await axiosInstance.post(endpoints.consignment.settle(id), payload);
  return response.data;
}

export async function closeConsignment(id, payload = {}) {
  const response = await axiosInstance.post(endpoints.consignment.close(id), payload);
  return response.data;
}

export async function getConsignmentKpis() {
  const response = await axiosInstance.get(endpoints.consignment.kpis);
  return response.data;
}

export async function createConsignmentPartner(payload) {
  const response = await axiosInstance.post(endpoints.consignment.partners, payload);
  return response.data;
}

export async function updateConsignmentPartner(id, payload) {
  const response = await axiosInstance.put(endpoints.consignment.partnerDetails(id), payload);
  return response.data;
}
