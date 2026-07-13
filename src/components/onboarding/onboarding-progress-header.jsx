import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { useRouter, usePathname, useSearchParams } from 'src/routes/hooks';

import { ONBOARDING_STEPS, SKIPPABLE_STEP_KEYS } from 'src/auth/onboarding-constants';
import {
  getOnboardingPathForStep,
  getOnboardingStepIndex,
  getViewingOnboardingStep,
} from 'src/utils/onboarding-routes';
import { markOnboardingLinkShared } from 'src/actions/onboarding';
import { toast } from 'src/components/snackbar';

import { OnboardingSkipButton } from './onboarding-skip-button';

// ----------------------------------------------------------------------

export function OnboardingProgressHeader({ progress, subtitle }) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isSharing, setIsSharing] = useState(false);
  const [shareMarked, setShareMarked] = useState(false);

  const currentKey = progress?.current_step;
  const furthestIndex =
    progress?.furthest_step_index ?? getOnboardingStepIndex(currentKey);
  const viewingKey =
    getViewingOnboardingStep(pathname, searchParams, progress) || currentKey;
  const activeIndex = getOnboardingStepIndex(viewingKey);

  const salesStep = progress?.steps?.sales;
  const salesLabel =
    salesStep && viewingKey === 'sales'
      ? `Record sales (${salesStep.count || 0}/${salesStep.target || 5})`
      : null;

  const currentStepState = currentKey ? progress?.steps?.[currentKey] : null;
  const canSkipCurrentStep = Boolean(
    currentKey &&
      viewingKey === currentKey &&
      !currentStepState?.done &&
      SKIPPABLE_STEP_KEYS.includes(currentKey)
  );
  const shareDone = shareMarked || Boolean(
    progress?.activation_checklist?.find((item) => item.key === 'share')?.done
  );

  const handleCopyStoreLink = async () => {
    if (!progress?.store_param) return;
    const slug = String(progress.store_param).replace(/-\d+$/, '');
    const link = `https://${slug}.ojaa.me`;
    try {
      setIsSharing(true);
      await navigator.clipboard.writeText(link);
      await markOnboardingLinkShared();
      setShareMarked(true);
      toast.success('Store link copied.');
    } catch (error) {
      toast.error('Unable to copy store link.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleStepClick = (stepKey, idx) => {
    if (idx > furthestIndex) {
      return;
    }
    router.push(getOnboardingPathForStep(stepKey, progress));
  };

  return (
    <Card sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={1}
        >
          <Box>
            <Typography variant="h6">Set up your business</Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle ||
                `Step ${activeIndex + 1} of ${ONBOARDING_STEPS.length} — create your store, then complete or skip the remaining steps.`}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {canSkipCurrentStep && <OnboardingSkipButton step={currentKey} />}
            {progress?.store_param && (
              <Button
                size="small"
                variant="outlined"
                disabled={isSharing || shareDone}
                onClick={handleCopyStoreLink}
              >
                {shareDone ? 'Link shared' : 'Copy store link'}
              </Button>
            )}
            <Chip label="Guided setup" color="primary" variant="soft" size="small" />
          </Stack>
        </Stack>

        <Stepper activeStep={activeIndex} alternativeLabel={!isMobile} nonLinear>
          {ONBOARDING_STEPS.map((step, idx) => {
            const done = progress?.steps?.[step.key]?.done;
            const isReachable = idx <= furthestIndex;
            const label =
              step.key === 'sales' && salesLabel && viewingKey === 'sales'
                ? salesLabel
                : step.label;

            return (
              <Step key={step.key} completed={done}>
                <StepButton
                  onClick={() => handleStepClick(step.key, idx)}
                  disabled={!isReachable}
                >
                  <StepLabel
                    optional={
                      step.key === currentKey && viewingKey === currentKey && canSkipCurrentStep ? (
                        <Typography variant="caption">Skippable</Typography>
                      ) : null
                    }
                  >
                    {label}
                  </StepLabel>
                </StepButton>
              </Step>
            );
          })}
        </Stepper>
      </Stack>
    </Card>
  );
}
