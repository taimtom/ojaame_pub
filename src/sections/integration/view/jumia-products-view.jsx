import { Helmet } from 'react-helmet-async';

import { Box } from '@mui/material';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { JumiaUsageView } from './jumia-usage-view';

// ----------------------------------------------------------------------

export function JumiaProductsView() {
  return (
    <>
      <Helmet>
        <title>Jumia Products Integration | Dashboard - {CONFIG.site.name}</title>
      </Helmet>

      <Box sx={{ p: 3 }}>
        <CustomBreadcrumbs
          heading="Jumia Products Integration"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Integration', href: paths.dashboard.integration.root },
            { name: 'Jumia Products' },
          ]}
          sx={{ mb: 5 }}
        />

        <JumiaUsageView activeTab="products" />
      </Box>
    </>
  );
}

