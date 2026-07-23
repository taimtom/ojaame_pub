import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { UsageDashboardView } from 'src/sections/usage-dashboard/view/usage-dashboard-view';

// ----------------------------------------------------------------------

const metadata = { title: `Usage dashboard - ${CONFIG.site.name}` };

export default function UsageDashboardPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <UsageDashboardView />
    </>
  );
}
