import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AccountCompany } from 'src/sections/account';

// ----------------------------------------------------------------------

const metadata = { title: `Add Company | Company - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AccountCompany />
    </>
  );
}
