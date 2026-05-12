import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useBusinessType } from 'src/hooks/use-business-type';

import { ProductNewEditForm } from '../product-new-edit-form';
import { ProductQuickAddForm } from '../product-quick-add-form';

// ----------------------------------------------------------------------

export function ProductCreateView({ storeSlug, storeNameSlug, storeId }) {
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
              onChange={(_, v) => { if (v) setMode(v); }}
            >
              <ToggleButton value="quick">Quick Add</ToggleButton>
              <ToggleButton value="full">Full Details</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {mode === 'quick'
                ? 'Essential fields only — fastest for onboarding. Add images, tags and advanced settings later from the product detail page.'
                : 'Full form with all fields including images, tags, sub-items and advanced properties.'}
            </Typography>
          </Stack>
        </Box>

        {mode === 'quick' ? (
          <ProductQuickAddForm storeId={storeId} storeSlug={storeSlug} />
        ) : (
          <ProductNewEditForm storeId={storeId} storeSlug={storeSlug} storeNameSlug={storeNameSlug} />
        )}
      </Stack>
    </DashboardContent>
  );
}
