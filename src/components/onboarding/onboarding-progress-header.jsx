import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { ONBOARDING_STEPS } from 'src/auth/onboarding-constants';

// ----------------------------------------------------------------------

function stepIndex(stepKey) {
  const idx = ONBOARDING_STEPS.findIndex((s) => s.key === stepKey);
  return idx >= 0 ? idx : 0;
}

export function OnboardingProgressHeader({ progress, subtitle }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentKey = progress?.current_step;
  const activeIndex = currentKey ? stepIndex(currentKey) : ONBOARDING_STEPS.length - 1;

  const salesStep = progress?.steps?.sales;
  const salesLabel =
    salesStep && currentKey === 'sales'
      ? `Record sales (${salesStep.count || 0}/${salesStep.target || 5})`
      : null;

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
                `Step ${activeIndex + 1} of ${ONBOARDING_STEPS.length} — complete each step to start selling.`}
            </Typography>
          </Box>
          <Chip label="Guided setup" color="primary" variant="soft" size="small" />
        </Stack>

        <Stepper activeStep={activeIndex} alternativeLabel={!isMobile}>
          {ONBOARDING_STEPS.map((step) => {
            const done = progress?.steps?.[step.key]?.done;
            const label =
              step.key === 'sales' && salesLabel && currentKey === 'sales'
                ? salesLabel
                : step.label;

            return (
              <Step key={step.key} completed={done}>
                <StepLabel
                  optional={
                    step.key === 'staff' ? (
                      <Typography variant="caption">Optional</Typography>
                    ) : null
                  }
                >
                  {label}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Stack>
    </Card>
  );
}
