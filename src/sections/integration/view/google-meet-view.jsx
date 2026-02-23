import { Helmet } from 'react-helmet-async';

import { Box } from '@mui/material';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { GoogleMeetingUsageView } from './google-meeting-usage-view';

// ----------------------------------------------------------------------

export function GoogleMeetView() {
  return (
    <>
      <Helmet>
        <title>Google Meet Integration | Dashboard - {CONFIG.site.name}</title>
      </Helmet>

      <Box sx={{ p: 3 }}>
        <CustomBreadcrumbs
          heading="Google Meet Integration"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Integration', href: paths.dashboard.integration.root },
            { name: 'Google Meet' },
          ]}
          sx={{ mb: 5 }}
        />

        <GoogleMeetingUsageView />
      </Box>
    </>
  );
}

