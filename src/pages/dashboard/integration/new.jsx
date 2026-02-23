import { Helmet } from 'react-helmet-async';

import { IntegrationCreateView } from 'src/sections/integration/view';

// ----------------------------------------------------------------------

export default function IntegrationCreatePage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Create Integration</title>
      </Helmet>

      <IntegrationCreateView />
    </>
  );
}

