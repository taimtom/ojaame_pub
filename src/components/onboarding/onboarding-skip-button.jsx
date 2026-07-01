import { useState } from 'react';

import Button from '@mui/material/Button';

import { SKIPPABLE_STEP_KEYS } from 'src/auth/onboarding-constants';
import { skipOnboardingStep } from 'src/actions/onboarding';
import { getOnboardingRedirectPath } from 'src/utils/onboarding-routes';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

const SKIP_LABELS = {
  card: 'Skip payment setup',
  staff: 'Skip team invites',
  products: 'Skip adding products',
  customers: 'Skip adding customers',
  receipt: 'Skip receipt setup',
  sales: 'Skip recording sales',
  report: 'Skip and finish setup',
};

export function OnboardingSkipButton({ step, disabled = false, size = 'small', variant = 'outlined' }) {
  const [loading, setLoading] = useState(false);

  if (!step || !SKIPPABLE_STEP_KEYS.includes(step)) {
    return null;
  }

  const handleSkip = async () => {
    try {
      setLoading(true);
      const updated = await skipOnboardingStep(step);
      const nextPath = getOnboardingRedirectPath(updated);
      window.location.assign(nextPath);
    } catch (error) {
      toast.error(error?.message || 'Could not skip this step.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      color="inherit"
      disabled={disabled || loading}
      onClick={handleSkip}
    >
      {loading ? 'Skipping...' : SKIP_LABELS[step] || 'Skip this step'}
    </Button>
  );
}
