import { useCallback, useMemo } from 'react';

import { useGetSubscriptionStatus } from 'src/actions/billing';

import { STANDARD_ONLY_FEATURES } from 'src/config/plan-features';

// ----------------------------------------------------------------------

export function usePlanFeatures() {
  const {
    planTier,
    features,
    limits,
    statusLoading,
  } = useGetSubscriptionStatus();

  const featureSet = useMemo(() => new Set(features || []), [features]);

  const hasPlanFeature = useCallback(
    (feature) => {
      if (!feature) {
        return true;
      }
      if (planTier === 'standard' || planTier === 'enterprise') {
        return true;
      }
      return featureSet.has(feature);
    },
    [featureSet, planTier]
  );

  const isBasic = planTier === 'basic';
  const isStandardOrAbove = planTier === 'standard' || planTier === 'enterprise';
  const maxSeatsPerStore = limits?.max_seats_per_store ?? null;

  return {
    planTier,
    features: features || [],
    limits: limits || {},
    maxSeatsPerStore,
    isBasic,
    isStandardOrAbove,
    hasPlanFeature,
    statusLoading,
    standardOnlyFeatures: STANDARD_ONLY_FEATURES,
  };
}
