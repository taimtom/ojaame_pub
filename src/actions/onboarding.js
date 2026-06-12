import useSWR from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';
import { getOnboardingRedirectPath } from 'src/utils/onboarding-routes';

// ----------------------------------------------------------------------

export async function fetchOnboardingProgress() {
  const res = await axiosInstance.get(endpoints.onboarding.progress);
  return res.data;
}

/** Fetch fresh progress and hard-navigate to the current incomplete step. */
export async function advanceToNextOnboardingStep() {
  try {
    const progress = await fetchOnboardingProgress();
    if (progress?.is_owner && !progress?.onboarding_completed && progress?.current_step) {
      const nextPath = getOnboardingRedirectPath(progress);
      window.location.assign(nextPath);
      return true;
    }
  } catch (error) {
    console.error('Failed to advance onboarding:', error);
  }
  return false;
}

export function useOnboardingProgress(options = {}) {
  const { skip = false } = options;
  const { data, isLoading, error, mutate } = useSWR(
    skip ? null : endpoints.onboarding.progress,
    fetcher,
    { revalidateOnFocus: true }
  );

  return {
    progress: data,
    progressLoading: isLoading,
    progressError: error,
    mutateProgress: mutate,
  };
}

export async function skipOnboardingStep(step) {
  const res = await axiosInstance.post(endpoints.onboarding.skipStep, { step });
  return res.data;
}

export async function completeReportView() {
  const res = await axiosInstance.post(endpoints.onboarding.completeReportView);
  return res.data;
}

export async function finishOnboarding() {
  const res = await axiosInstance.post(endpoints.onboarding.finish);
  return res.data;
}
