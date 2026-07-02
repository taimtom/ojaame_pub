import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ServiceLogView } from 'src/sections/service-log/view/service-log-view';

export default function ServiceLogPage() {
  return (
    <>
      <Helmet>
        <title>Service Log | {CONFIG.site.name}</title>
      </Helmet>
      <ServiceLogView />
    </>
  );
}
