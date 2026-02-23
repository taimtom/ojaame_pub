import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useGetProduct } from 'src/actions/product';

import { ProductDetailsView } from 'src/sections/product/view';

// ----------------------------------------------------------------------

const metadata = { title: `Product details | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam, id = '' } = useParams();
  const currentStoreSlug = storeParam || 'default-store';

  const parts = currentStoreSlug.split('-');
  const numericStoreId = parts[parts.length - 1];
  const storeNameSlug = parts.slice(0, -1).join('-') || currentStoreSlug;

  const productId = id? parseInt(id, 10) : null;

  const { product, productLoading, productError } = useGetProduct(productId, numericStoreId);

  return (
    <>
      <Helmet>
        <title> {metadata.title} {numericStoreId ? `- Store ${numericStoreId}` : ''}</title>
      </Helmet>

      <ProductDetailsView
      product={product}
      loading={productLoading}
      error={productError}
      storeId={numericStoreId}
      storeSlug={currentStoreSlug}       // For routing (keeps the friendly slug)
      storeNameSlug={storeNameSlug}        // For display in breadcrumbs
      />
    </>
  );
}
