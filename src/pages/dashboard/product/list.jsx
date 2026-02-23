import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { paramCase } from 'src/utils/change-case'; // ensure you have this helper
import { CONFIG } from 'src/config-global';
import { useGetProducts } from 'src/actions/product';
import { useBusinessType } from 'src/hooks/use-business-type';

import { ProductListView } from 'src/sections/product/view';

export default function Page() {
  const { storeParam } = useParams();
  const { t } = useBusinessType();
  const productTerm = t('product');
  let storeSlug = storeParam;

  if (!storeSlug) {
    // Fallback: try to get active workspace from localStorage and build the slug
    const activeWorkspaceJson = localStorage.getItem('activeWorkspace');
    if (activeWorkspaceJson) {
      try {
        const activeWorkspace = JSON.parse(activeWorkspaceJson);
        if (activeWorkspace && activeWorkspace.storeName && activeWorkspace.id) {
          storeSlug = `${paramCase(activeWorkspace.storeName)}-${activeWorkspace.id}`;
        }
      } catch (error) {
        console.error('Error parsing activeWorkspace:', error);
      }
    }
  }

  // Extract the numeric part from the slug (e.g., "mystore-1" -> "1")
  const numericStoreId = storeSlug ? storeSlug.split('-').pop() : null;

  const { products, productsLoading, productsError, productsEmpty } = useGetProducts(numericStoreId);

  const pageTitle = `${productTerm.charAt(0).toUpperCase() + productTerm.slice(1)} list | Dashboard - ${CONFIG.site.name}`;

  return (
    <>
      <Helmet>
        <title>
          {pageTitle} {storeSlug ? `- Store ${storeSlug}` : ''}
        </title>
      </Helmet>
      {productsLoading && (
  <div className="flex items-center justify-center h-64">
    <p className="text-gray-500">Loading products...</p>
  </div>
)}

{!productsLoading && (
      <ProductListView
        storeId={numericStoreId}     // numeric ID for data queries
        storeSlug={storeSlug}        // full slug for building URLs (if needed)
        products={products}
        loading={productsLoading}
        error={productsError}
        empty={productsEmpty}
        emptyMessage="No Product found."
      />
    )}

    </>
  );
}
