import useSWR from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ── SWR Hooks ──────────────────────────────────────────────────────────────

export function useGetWallet() {
  const { data, isLoading, error, mutate } = useSWR(endpoints.wallet.details, fetcher);
  return {
    wallet: data?.exists ? data : null,
    walletExists: data?.exists ?? false,
    walletBalance: data?.balance ?? 0,
    walletCurrency: data?.currency ?? 'NGN',
    paymentPreference: data?.payment_preference ?? 'card',
    hasDva: data?.has_dva ?? false,
    dvaBankName: data?.dva_bank_name ?? null,
    dvaAccountNumber: data?.dva_account_number ?? null,
    dvaAccountName: data?.dva_account_name ?? null,
    walletLoading: isLoading,
    walletError: error,
    mutateWallet: mutate,
  };
}

export function useGetWalletTransactions(page = 1, pageSize = 20) {
  const url = `${endpoints.wallet.transactions}?page=${page}&page_size=${pageSize}`;
  const { data, isLoading, error, mutate } = useSWR(url, fetcher);
  return {
    transactions: data?.transactions ?? [],
    totalTransactions: data?.total ?? 0,
    txLoading: isLoading,
    txError: error,
    mutateTransactions: mutate,
  };
}

// ── Mutations ──────────────────────────────────────────────────────────────

export async function createWallet() {
  const res = await axiosInstance.post(endpoints.wallet.create);
  return res.data;
}

export async function setPaymentPreference(preference) {
  const res = await axiosInstance.put(endpoints.wallet.preference, { preference });
  return res.data;
}

export async function initiateWalletTopup(amount, callbackUrl) {
  const body = { amount };
  if (callbackUrl) body.callback_url = callbackUrl;
  const res = await axiosInstance.post(endpoints.wallet.topupInitiate, body);
  return res.data;
}

export async function verifyWalletTopup(reference, companyId) {
  const res = await axiosInstance.post(endpoints.wallet.topupVerify, {
    reference,
    company_id: companyId,
  });
  return res.data;
}
