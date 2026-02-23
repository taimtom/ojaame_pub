import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { SplitUpdatePasswordView } from 'src/sections/auth/jwt';

// ----------------------------------------------------------------------

const metadata = { title: `Sign up | Jwt - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <SplitUpdatePasswordView />
    </>
  );
}
