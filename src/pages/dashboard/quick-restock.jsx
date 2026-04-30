import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { QuickRestockView } from 'src/sections/quick-restock/view/quick-restock-view';

// ----------------------------------------------------------------------

const metadata = { title: `Quick Restock - ${CONFIG.site.name}` };

export default function QuickRestockPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <QuickRestockView />
    </>
  );
}
