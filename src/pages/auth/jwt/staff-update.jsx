import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { UserNewForm } from 'src/sections/auth/jwt';

// ----------------------------------------------------------------------

const metadata = { title: `Update Staff | Jwt - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <UserNewForm />
    </>
  );
}
