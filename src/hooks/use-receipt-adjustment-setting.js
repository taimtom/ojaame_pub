import { useCallback, useEffect, useState } from 'react';

import axiosInstance from 'src/utils/axios';
import { usePermissions } from 'src/hooks/use-permissions';

function getActiveStoreId() {
  try {
    const raw = localStorage.getItem('activeWorkspace');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Store-level receipt display adjustment setting + user permission.
 */
export function useReceiptAdjustmentSetting(storeIdProp) {
  const { hasPermission } = usePermissions();
  const [storeId, setStoreId] = useState(() => storeIdProp ?? getActiveStoreId());
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const canAdjust = hasPermission('sales.receipt_adjust');
  const canManageSetting = hasPermission('settings.store');

  useEffect(() => {
    if (storeIdProp != null) {
      setStoreId(storeIdProp);
    }
  }, [storeIdProp]);

  useEffect(() => {
    const sync = () => {
      if (!storeIdProp) setStoreId(getActiveStoreId());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [storeIdProp]);

  const refresh = useCallback(async () => {
    if (!storeId) {
      setEnabled(false);
      return;
    }
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(
        `/api/stores/${storeId}/settings/receipt-adjustment`
      );
      setEnabled(Boolean(data?.enabled));
    } catch {
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const featureAvailable = enabled && canAdjust;

  return {
    storeId,
    enabled,
    loading,
    canAdjust,
    canManageSetting,
    featureAvailable,
    refresh,
  };
}

export async function saveReceiptAdjustment(storeId, saleId, payload) {
  const body =
    typeof payload === 'object' && payload !== null
      ? payload
      : { display_total: Number(payload) };

  const { data } = await axiosInstance.post(
    `/api/sales/${storeId}/${saleId}/receipt-adjustment`,
    {
      display_total: Number(body.display_total),
      notes: body.notes || undefined,
      display_items: body.display_items || undefined,
    }
  );
  return data;
}
