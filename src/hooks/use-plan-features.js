import { useCallback, useMemo } from 'react';

import { useGetSubscriptionStatus } from 'src/actions/billing';

import { planRestrictionsEnabled, STANDARD_ONLY_FEATURES } from 'src/config/plan-features';

// ----------------------------------------------------------------------

export function usePlanFeatures() {
  const {
    planTier,
    features,
    limits,
    statusLoading,
  } = useGetSubscriptionStatus();

  const restrictionsOn = planRestrictionsEnabled();
  const featureSet = useMemo(() => new Set(features || []), [features]);

  const hasPlanFeature = useCallback(
    (feature) => {
      if (!feature) {
        return true;
      }
      if (!restrictionsOn) {
        return true;
      }
      if (planTier === 'standard' || planTier === 'enterprise') {
        return true;
      }
      return featureSet.has(feature);
    },
    [featureSet, planTier, restrictionsOn]
  );

  const isBasic = planTier === 'basic';
  const isStandardOrAbove = planTier === 'standard' || planTier === 'enterprise';
  const maxSeatsPerStore = restrictionsOn ? (limits?.max_seats_per_store ?? null) : null;

  const canAddStore = useCallback(
    (storeCount = 0) => {
      if (!restrictionsOn || isStandardOrAbove) {
        return true;
      }
      return storeCount < 1;
    },
    [isStandardOrAbove, restrictionsOn]
  );

  return {
    planTier,
    features: restrictionsOn ? features || [] : [...STANDARD_ONLY_FEATURES],
    limits: restrictionsOn ? limits || {} : { max_seats_per_store: null },
    maxSeatsPerStore,
    isBasic,
    isStandardOrAbove,
    canAddStore,
    hasPlanFeature,
    statusLoading,
    planRestrictionsEnabled: restrictionsOn,
    standardOnlyFeatures: STANDARD_ONLY_FEATURES,
  };
}
