import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { IntegrationDashboard } from 'src/sections/integration/components';

// ----------------------------------------------------------------------

const metadata = { title: `Integration Dashboard | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <IntegrationDashboard />
    </>
  );
}

