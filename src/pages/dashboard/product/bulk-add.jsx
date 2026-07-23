import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router';

import { CONFIG } from 'src/config-global';
import { ProductBulkOnboardView } from 'src/sections/product/view/product-bulk-onboard-view';

export default function Page() {
  const { storeParam } = useParams();
  const currentStoreSlug = storeParam || 'default-store';
  const parts = currentStoreSlug.split('-');
  const numericStoreId = parts[parts.length - 1];

  return (
    <>
      <Helmet>
        <title>{`Bulk add products | Dashboard - ${CONFIG.site.name}`}</title>
      </Helmet>
      <ProductBulkOnboardView storeSlug={currentStoreSlug} storeId={numericStoreId} />
    </>
  );
}
