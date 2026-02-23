import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

// import { _roles } from 'src/_mock/_role';
import { CONFIG } from 'src/config-global';

import { RoleDetailsView } from 'src/sections/role/view';

// ----------------------------------------------------------------------

const metadata = {
  title: `Role details | Dashboard - ${CONFIG.site.name}`,
};

export default function Page() {
  const { id = '' } = useParams();
  const roleId = Number(id);

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <RoleDetailsView roleId={roleId} />
    </>
  );
}
