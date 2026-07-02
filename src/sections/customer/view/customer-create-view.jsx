import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { OnboardingSetupShell } from 'src/components/onboarding/onboarding-setup-shell';

import { CustomerNewEditForm } from '../customer-new-edit-form';
import { CustomerQuickAddForm } from '../customer-quick-add-form';

// ----------------------------------------------------------------------

export function CustomerCreateView({ storeSlug, storeId }) {
  const [mode, setMode] = useState('quick');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a Customer"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          {
            name: 'Customers',
            href: storeSlug ? paths.dashboard.customer.root(storeSlug) : paths.dashboard.root,
          },
          { name: 'New Customer' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <OnboardingSetupShell subtitle="Add your top customers — import from phone contacts or enter manually.">
        <Stack spacing={3}>
          <Box>
            <Stack spacing={0.75}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                How would you like to add customers?
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={mode}
                onChange={(_, v) => {
                  if (v) setMode(v);
                }}
              >
                <ToggleButton value="quick">Quick Add</ToggleButton>
                <ToggleButton value="full">Full Details</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {mode === 'quick'
                  ? 'Name and phone only — fastest for setup. Import multiple contacts from your phone at once.'
                  : 'Full address form with city, state, country, and default address options.'}
              </Typography>
            </Stack>
          </Box>

          {mode === 'quick' ? (
            <CustomerQuickAddForm storeId={storeId} />
          ) : (
            <CustomerNewEditForm />
          )}
        </Stack>
      </OnboardingSetupShell>
    </DashboardContent>
  );
}
