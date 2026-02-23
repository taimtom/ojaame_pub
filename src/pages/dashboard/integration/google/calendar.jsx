import { Helmet } from 'react-helmet-async';

import { GoogleCalendarView } from 'src/sections/integration/view';

// ----------------------------------------------------------------------

export default function GoogleCalendarPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Google Calendar Integration</title>
      </Helmet>

      <GoogleCalendarView />
    </>
  );
}

