import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { IntegrationDashboard } from '../components';

// ----------------------------------------------------------------------

export function IntegrationDashboardView() {
  return (
    <>
      <Helmet>
        <title>Integration Dashboard | Dashboard - {CONFIG.site.name}</title>
      </Helmet>

      <IntegrationDashboard />
    </>
  );
}

