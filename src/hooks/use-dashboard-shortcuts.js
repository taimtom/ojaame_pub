import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { paramCase } from 'src/utils/change-case';

import { usePermissions } from 'src/hooks/use-permissions';
import { useBusinessType } from 'src/hooks/use-business-type';
import { usePlanFeatures } from 'src/hooks/use-plan-features';

import {
  buildDashboardShortcuts,
  getCurrentStoreParam,
} from 'src/config/dashboard-shortcuts';

// ----------------------------------------------------------------------

function resolveCurrentStore(storeParam) {
  const isValidStoreParam = (p) => Boolean(p && /^.+-\d+$/.test(p));
  if (isValidStoreParam(storeParam)) {
    return storeParam;
  }
  return getCurrentStoreParam();
}

export function useDashboardShortcuts() {
  const { storeParam } = useParams();
  const { t, getNavLabel, config } = useBusinessType();
  const { userPermissions } = usePermissions();
  const { hasPlanFeature } = usePlanFeatures();

  const currentStore = resolveCurrentStore(storeParam);

  const shortcuts = useMemo(
    () =>
      buildDashboardShortcuts({
        t,
        getNavLabel,
        userPermissions,
        hasPlanFeature,
        currentStore,
        preferredOrder: config?.dashboardShortcuts,
      }),
    [t, getNavLabel, userPermissions, hasPlanFeature, currentStore, config?.dashboardShortcuts]
  );

  return { shortcuts, currentStore };
}
