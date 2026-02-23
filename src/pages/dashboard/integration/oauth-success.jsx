import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { OAuthSuccessView } from 'src/sections/integration/view';

// ----------------------------------------------------------------------

const metadata = { title: `OAuth Success | Integration - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <OAuthSuccessView />
    </>
  );
}

