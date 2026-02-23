import { Helmet } from 'react-helmet-async';

import { GoogleMeetView } from 'src/sections/integration/view';

// ----------------------------------------------------------------------

export default function GoogleMeetPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Google Meet Integration</title>
      </Helmet>

      <GoogleMeetView />
    </>
  );
}

