import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { paramCase } from 'src/utils/change-case';
import { CONFIG } from 'src/config-global';
import { useGetService } from 'src/actions/service';

import { ServiceDetailsView } from 'src/sections/service/view';

// ----------------------------------------------------------------------

const metadata = { title: `Service details | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam, id = '' } = useParams();

  let storeSlug = storeParam;
  if (!storeSlug) {
    const activeWorkspaceJson = localStorage.getItem('activeWorkspace');
    if (activeWorkspaceJson) {
      try {
        const activeWorkspace = JSON.parse(activeWorkspaceJson);
        if (activeWorkspace?.storeName && activeWorkspace?.id) {
          storeSlug = `${paramCase(activeWorkspace.storeName)}-${activeWorkspace.id}`;
        }
      } catch (_) {
        storeSlug = 'default-store';
      }
    }
  }

  const numericStoreId = storeSlug ? storeSlug.split('-').pop() : null;
  const serviceId = id ? parseInt(id, 10) : null;

  const { service, serviceLoading, serviceError } = useGetService(serviceId, numericStoreId);

  return (
    <>
      <Helmet>
        <title>
          {metadata.title} {numericStoreId ? `- Store ${numericStoreId}` : ''}
        </title>
      </Helmet>

      <ServiceDetailsView
        service={service}
        loading={serviceLoading}
        error={serviceError}
        storeId={numericStoreId}
        storeSlug={storeSlug}
      />
    </>
  );
}
