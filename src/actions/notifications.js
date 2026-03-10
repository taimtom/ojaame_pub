import useSWR, { mutate } from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
};

// ----------------------------------------------------------------------
// useGetNotifications — Fetch paginated notifications for the current user.
// tab: 'all' | 'unread' | 'archived'
export function useGetNotifications({ storeId, tab = 'all', skip = 0, limit = 50 } = {}) {
  const params = { tab, skip, limit };
  if (storeId) params.store_id = storeId;

  const key = [endpoints.notifications.list, { params }];

  const { data, error, isLoading, isValidating } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      notifications: data || [],
      notificationsLoading: isLoading,
      notificationsError: error,
      isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------
// useGetNotificationSummary — Fetch total / unread / archived counts.
export function useGetNotificationSummary(storeId) {
  const params = {};
  if (storeId) params.store_id = storeId;

  const key = [endpoints.notifications.summary, { params }];

  const { data, error, isLoading } = useSWR(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      summary: data || { total: 0, unread: 0, archived: 0 },
      summaryLoading: isLoading,
      summaryError: error,
    }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------
// markNotificationAsRead — PUT /api/notifications/{id}/read
export async function markNotificationAsRead(notificationId) {
  try {
    const res = await axiosInstance.put(endpoints.notifications.markRead(notificationId));
    // Revalidate all notification keys
    mutate((key) => Array.isArray(key) && key[0]?.startsWith('/api/notifications'), undefined, {
      revalidate: true,
    });
    return res.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// markAllNotificationsAsRead — PUT /api/notifications/mark-all-read
export async function markAllNotificationsAsRead(storeId) {
  try {
    const params = {};
    if (storeId) params.store_id = storeId;
    const res = await axiosInstance.put(endpoints.notifications.markAllRead, null, { params });
    mutate((key) => Array.isArray(key) && key[0]?.startsWith('/api/notifications'), undefined, {
      revalidate: true,
    });
    return res.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// archiveNotification — PUT /api/notifications/{id}/archive
export async function archiveNotification(notificationId) {
  try {
    const res = await axiosInstance.put(endpoints.notifications.archive(notificationId));
    mutate((key) => Array.isArray(key) && key[0]?.startsWith('/api/notifications'), undefined, {
      revalidate: true,
    });
    return res.data;
  } catch (error) {
    console.error('Error archiving notification:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// generateNotifications — POST /api/notifications/generate (manual trigger)
export async function generateNotifications(storeId) {
  try {
    const res = await axiosInstance.post(endpoints.notifications.generate, null, {
      params: { store_id: storeId },
    });
    mutate((key) => Array.isArray(key) && key[0]?.startsWith('/api/notifications'), undefined, {
      revalidate: true,
    });
    return res.data;
  } catch (error) {
    console.error('Error generating notifications:', error);
    throw error;
  }
}
