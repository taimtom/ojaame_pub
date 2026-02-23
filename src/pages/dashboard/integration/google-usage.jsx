import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { GoogleIntegrationUsageView } from 'src/sections/integration/view';

// ----------------------------------------------------------------------

export default function GoogleIntegrationUsagePage() {
  return (
    <>
      <Helmet>
        <title>Google Integration Usage | Dashboard - {CONFIG.site.name}</title>
      </Helmet>

      <GoogleIntegrationUsageView />
    </>
  );
}

