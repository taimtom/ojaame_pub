import useSWR from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ── SWR Hooks ──────────────────────────────────────────────────────────────

export function useGetBillingCards() {
  const { data, isLoading, error, mutate } = useSWR(endpoints.billing.cards, fetcher);
  return {
    cards: data || [],
    cardsLoading: isLoading,
    cardsError: error,
    mutateCards: mutate,
  };
}

export function useGetSubscriptionStatus() {
  const { data, isLoading, mutate } = useSWR(endpoints.billing.status, fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  });
  return {
    status: data?.status || 'active',
    paystackStatus: data?.paystack_status,
    nextBillingDate: data?.next_billing_date,
    gracePeriodEnd: data?.grace_period_end,
    isOwner: data?.is_owner ?? false,
    hasPaymentMethod: data?.has_payment_method ?? false,
    hasPaystackSubscription: data?.has_paystack_subscription ?? false,
    statusLoading: isLoading,
    mutateStatus: mutate,
  };
}

// ── Mutations ──────────────────────────────────────────────────────────────

export async function verifyAndSaveCard(reference) {
  const res = await axiosInstance.post(endpoints.billing.cardVerify, { reference });
  return res.data;
}

export async function removeCard(cardId) {
  const res = await axiosInstance.delete(endpoints.billing.card(cardId));
  return res.data;
}

export async function clearAllCards() {
  const res = await axiosInstance.delete(endpoints.billing.cards);
  return res.data;
}

export async function setDefaultCard(cardId) {
  const res = await axiosInstance.put(endpoints.billing.cardDefault(cardId));
  return res.data;
}

export async function getSubscriptionManageLink() {
  const res = await axiosInstance.get(endpoints.billing.manageLink);
  return res.data;
}
