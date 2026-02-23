import { Helmet } from 'react-helmet-async';

import { GoogleEmailView } from 'src/sections/integration/view';

// ----------------------------------------------------------------------

export default function GoogleEmailPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Google Email Integration</title>
      </Helmet>

      <GoogleEmailView />
    </>
  );
}

