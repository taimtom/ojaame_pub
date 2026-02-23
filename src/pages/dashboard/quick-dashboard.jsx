import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { QuickDashboardView } from 'src/sections/quick-dashboard/view/quick-dashboard-view';

// ----------------------------------------------------------------------

const metadata = { title: `Quick Dashboard - ${CONFIG.site.name}` };

export default function QuickDashboardPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <QuickDashboardView />
    </>
  );
}
