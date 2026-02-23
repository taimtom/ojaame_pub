import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useGetProduct } from 'src/actions/product';

import { ProductQuantityAddView } from 'src/sections/product/view';

// ----------------------------------------------------------------------

const metadata = { title: `Add Product Quantity | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam, id = '' } = useParams();

  // Derive the full store slug from the URL.
  const currentStoreSlug = storeParam || 'default-store';

  const parts = currentStoreSlug.split('-');
  const numericStoreId = parts[parts.length - 1];
  const storeNameSlug = parts.slice(0, -1).join('-') || currentStoreSlug;

  // Parse the product_id to ensure it's an integer (or null if missing)
  const productId = id? parseInt(id, 10) : null;


  const { product } = useGetProduct(productId, numericStoreId);


  return (
    <>
      <Helmet>
        <title>{metadata.title} {storeNameSlug ? `- Store ${storeNameSlug}` : ''} </title>

      </Helmet>

      <ProductQuantityAddView product={product}
        storeSlug={currentStoreSlug}       // For routing (keeps the friendly slug)
        storeNameSlug={storeNameSlug}        // For display in breadcrumbs
        storeId={numericStoreId}             // For API operations
        />
    </>
  );
}
