import { Helmet } from 'react-helmet-async';

import { GoogleDriveView } from 'src/sections/integration/view';

// ----------------------------------------------------------------------

export default function GoogleDrivePage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Google Drive Integration</title>
      </Helmet>

      <GoogleDriveView />
    </>
  );
}

