import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { StoreCreateView } from 'src/sections/store/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new Store | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <StoreCreateView />
    </>
  );
}
