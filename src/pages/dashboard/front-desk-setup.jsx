import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { FrontDeskSetupView } from 'src/sections/front-desk/view/front-desk-setup-view';

export default function FrontDeskSetupPage() {
  return (
    <>
      <Helmet>
        <title>Rooms setup | {CONFIG.site.name}</title>
      </Helmet>
      <FrontDeskSetupView />
    </>
  );
}
