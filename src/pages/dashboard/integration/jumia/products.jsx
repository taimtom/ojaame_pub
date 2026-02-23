import { Helmet } from 'react-helmet-async';

import { JumiaProductsView } from 'src/sections/integration/view';

// ----------------------------------------------------------------------

export default function JumiaProductsPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Jumia Products Integration</title>
      </Helmet>

      <JumiaProductsView />
    </>
  );
}

