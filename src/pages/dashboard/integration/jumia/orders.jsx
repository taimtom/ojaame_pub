import { Helmet } from 'react-helmet-async';

import { JumiaOrdersView } from 'src/sections/integration/view';

// ----------------------------------------------------------------------

export default function JumiaOrdersPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Jumia Orders Integration</title>
      </Helmet>

      <JumiaOrdersView />
    </>
  );
}

