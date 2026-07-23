import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { withOnboardingQuery } from 'src/utils/onboarding-routes';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useBusinessType } from 'src/hooks/use-business-type';

import { OnboardingSetupShell } from 'src/components/onboarding/onboarding-setup-shell';

import { ProductNewEditForm } from '../product-new-edit-form';
import { ProductQuickAddForm } from '../product-quick-add-form';

// ----------------------------------------------------------------------

export function ProductCreateView({ storeSlug, storeNameSlug, storeId }) {
  const router = useRouter();
  const { t } = useBusinessType();
  const productTerm = t('product');
  const [mode, setMode] = useState('quick');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`Add new ${productTerm}`}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          {
            name: productTerm.charAt(0).toUpperCase() + productTerm.slice(1),
            href: paths.dashboard.product.root(storeSlug),
          },
          { name: `New ${productTerm}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <OnboardingSetupShell subtitle="Add at least one product you sell. You can add more or continue setup when ready.">
      <Stack spacing={3}>
        {/* Mode selector */}
        <Box>
          <Stack spacing={0.75}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              How would you like to add this {productTerm}?
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={mode}
              onChange={(_, v) => {
                if (!v) return;
                if (v === 'bulk') {
                  router.push(withOnboardingQuery(paths.dashboard.product.bulkAdd(storeSlug)));
                  return;
                }
                setMode(v);
              }}
            >
              <ToggleButton value="quick">Quick Add</ToggleButton>
              <ToggleButton value="full">Full Details</ToggleButton>
              <ToggleButton value="bulk">Bulk Add</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {mode === 'quick'
                ? 'Essential fields only — fastest for onboarding. Add images, tags and advanced settings later from the product detail page.'
                : mode === 'full'
                  ? 'Full form with all fields including images, tags, sub-items and advanced properties.'
                  : 'Add many products at once from a spreadsheet or CSV file.'}
            </Typography>
          </Stack>
        </Box>

        {mode === 'quick' ? (
          <ProductQuickAddForm storeId={storeId} storeSlug={storeSlug} />
        ) : (
          <ProductNewEditForm storeId={storeId} storeSlug={storeSlug} storeNameSlug={storeNameSlug} />
        )}
      </Stack>
      </OnboardingSetupShell>
    </DashboardContent>
  );
}
