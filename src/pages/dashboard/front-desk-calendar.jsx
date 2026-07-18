import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { FrontDeskCalendarView } from 'src/sections/front-desk/view/front-desk-calendar-view';

export default function FrontDeskCalendarPage() {
  return (
    <>
      <Helmet>
        <title>Availability | {CONFIG.site.name}</title>
      </Helmet>
      <FrontDeskCalendarView />
    </>
  );
}
