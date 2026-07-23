import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { FrontDeskHousekeepingView } from 'src/sections/front-desk/view/front-desk-housekeeping-view';

export default function FrontDeskHousekeepingPage() {
  return (
    <>
      <Helmet>
        <title>Housekeeping | {CONFIG.site.name}</title>
      </Helmet>
      <FrontDeskHousekeepingView />
    </>
  );
}
