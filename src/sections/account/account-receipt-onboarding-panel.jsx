import { useState } from 'react';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import { completeReceiptSetup } from 'src/actions/onboarding';
import { useOnboardingActive } from 'src/hooks/use-onboarding-mode';
import { getOnboardingPathForStep } from 'src/utils/onboarding-routes';
import { toast } from 'src/components/snackbar';

import { AccountPrinterSettings } from './account-printer-settings';
import { AccountReceiptSettings } from './account-receipt-settings';

// ----------------------------------------------------------------------

export function AccountReceiptOnboardingPanel() {
  const { mutateProgress } = useOnboardingActive();
  const [submitting, setSubmitting] = useState(false);

  const handleNext = async () => {
    setSubmitting(true);
    try {
      const updated = await completeReceiptSetup();
      if (!updated?.steps?.receipt?.done) {
        toast.error('Receipt setup was not saved. Please try again.');
        return;
      }

      await mutateProgress(updated, { revalidate: false });

      const nextStep = updated.current_step || 'sales';
      const nextPath = getOnboardingPathForStep(nextStep, updated);
      if (nextStep === 'receipt') {
        toast.error('Could not advance to the next step. Please try again.');
        return;
      }

      window.location.assign(nextPath);
    } catch (error) {
      toast.error(error?.message || 'Could not continue setup.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <AccountPrinterSettings />
      <AccountReceiptSettings />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
        <Button
          variant="contained"
          color="success"
          size="large"
          disabled={submitting}
          onClick={handleNext}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
          sx={{ minWidth: { sm: 160 } }}
        >
          {submitting ? 'Continuing...' : 'Next'}
        </Button>
      </Stack>
    </Stack>
  );
}
