import { useCallback, useMemo } from 'react';

import { useSearchParams } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';
import { advanceToNextOnboardingStep, useOnboardingProgress } from 'src/actions/onboarding';
import {
  getOnboardingRedirectPath,
  isOnboardingMode as isOnboardingQuery,
} from 'src/utils/onboarding-routes';

// ----------------------------------------------------------------------

export function useOnboardingActive() {
  const { user } = useAuthContext();
  const { progress, progressLoading, mutateProgress } = useOnboardingProgress({
    skip: !user?.company_id,
  });

  const active = useMemo(
    () => Boolean(progress?.is_owner && progress && !progress.onboarding_completed),
    [progress]
  );

  return { active, progress, progressLoading, mutateProgress };
}

export function useOnboardingMode() {
  const searchParams = useSearchParams();
  const { active } = useOnboardingActive();
  return isOnboardingQuery(searchParams) || active;
}

export function useAdvanceOnboarding() {
  const { mutateProgress } = useOnboardingProgress();

  return useCallback(
    async (updatedProgress) => {
      if (updatedProgress?.is_owner && !updatedProgress?.onboarding_completed) {
        const nextPath = getOnboardingRedirectPath(updatedProgress);
        window.location.assign(nextPath);
        return;
      }
      await mutateProgress();
      await advanceToNextOnboardingStep();
    },
    [mutateProgress]
  );
}

export function useOnboardingPage() {
  const onboarding = useOnboardingMode();
  const { progress, progressLoading, mutateProgress } = useOnboardingActive();

  return {
    onboarding,
    progress,
    progressLoading,
    mutateProgress,
  };
}
