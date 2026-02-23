import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useGetService} from 'src/actions/service';

import { ServiceEditView } from 'src/sections/service/view';

// ----------------------------------------------------------------------

const metadata = { title: `Service edit | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam, id = '' } = useParams();

  const currentStoreSlug = storeParam || 'default-store';

  const parts = currentStoreSlug.split('-');
  const numericStoreId = parts[parts.length - 1];
  const storeNameSlug = parts.slice(0, -1).join('-') || currentStoreSlug;

  // Parse the product_id to ensure it's an integer (or null if missing)
  const serviceId = id? parseInt(id, 10) : null;

  const { service } = useGetService(serviceId, numericStoreId);

  return (
    <>
      <Helmet>
      <title>
          {metadata.title} {storeNameSlug ? `- Store ${storeNameSlug}` : ''}
        </title>
      </Helmet>

      <ServiceEditView service={service}
        storeSlug={currentStoreSlug}       // For routing (keeps the friendly slug)
        storeNameSlug={storeNameSlug}        // For display in breadcrumbs
        storeId={numericStoreId}
        />
    </>
  );
}
