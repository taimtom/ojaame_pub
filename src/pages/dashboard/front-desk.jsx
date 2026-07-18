import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { FrontDeskView } from 'src/sections/front-desk/view/front-desk-view';

export default function FrontDeskPage() {
  return (
    <>
      <Helmet>
        <title>Front Desk | {CONFIG.site.name}</title>
      </Helmet>
      <FrontDeskView />
    </>
  );
}
