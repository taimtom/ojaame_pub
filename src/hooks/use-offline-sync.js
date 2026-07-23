import { useState, useEffect, useCallback, useRef } from 'react';

import axiosInstance from 'src/utils/axios';

import {
  getAllPendingSales,
  removeSale,
  incrementRetry,
  getPendingCount,
} from 'src/utils/offlineQueue';

import { useNetworkStatus } from './use-network-status';

const MAX_RETRIES = 5;

/**
 * Manages syncing of queued offline sales back to the server.
 *
 * Returns:
 *   pendingCount  – number of sales waiting to sync
 *   isSyncing     – true while a sync pass is running
 *   syncErrors    – array of { id, payload, lastError, retries } for permanently-failed records
 *   discardError  – fn(id) removes a failed record from the queue
 *   triggerSync   – fn() manually start a sync pass
 *   refreshCount  – fn() re-read pending count from IDB without syncing
 */
export function useOfflineSync({ onSyncComplete } = {}) {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncErrors, setSyncErrors] = useState([]);
  const syncingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      // IDB not available — ignore
    }
  }, []);

  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const pending = await getAllPendingSales();
      if (!pending.length) {
        setIsSyncing(false);
        syncingRef.current = false;
        return;
      }

      // Process each pending record sequentially using reduce (no for-loop / no await-in-loop)
      const { successCount, newErrors } = await pending.reduce(
        async (accPromise, record) => {
          const acc = await accPromise;

          if (record.retries >= MAX_RETRIES) {
            return { ...acc, newErrors: [...acc.newErrors, record] };
          }

          try {
            await axiosInstance.post('/api/quick-dashboard/sale', record.payload);
            await removeSale(record.id);
            return { ...acc, successCount: acc.successCount + 1 };
          } catch (err) {
            const msg = err?.response?.data?.detail || err?.message || 'Network error';
            await incrementRetry(record.id, msg);
            const updated = { ...record, retries: record.retries + 1, lastError: msg };
            if (updated.retries >= MAX_RETRIES) {
              return { ...acc, newErrors: [...acc.newErrors, updated] };
            }
            return acc;
          }
        },
        Promise.resolve({ successCount: 0, newErrors: [] })
      );

      setSyncErrors(newErrors);
      await refreshCount();

      if (successCount > 0 && onSyncComplete) {
        onSyncComplete(successCount);
      }
    } catch {
      // Unexpected IDB failure — fail silently
    } finally {
      setIsSyncing(false);
      syncingRef.current = false;
    }
  }, [onSyncComplete, refreshCount]);

  // Sync on first mount and whenever we come back online
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  useEffect(() => {
    if (isOnline) {
      sync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, wasOffline]);

  const discardError = useCallback(
    async (id) => {
      await removeSale(id);
      setSyncErrors((prev) => prev.filter((r) => r.id !== id));
      await refreshCount();
    },
    [refreshCount]
  );

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncErrors,
    discardError,
    triggerSync: sync,
    refreshCount,
  };
}
