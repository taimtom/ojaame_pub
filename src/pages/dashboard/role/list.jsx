import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { RoleListView } from 'src/sections/role/view';

// ----------------------------------------------------------------------

const metadata = { title: `Role list | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <RoleListView />
    </>
  );
}
