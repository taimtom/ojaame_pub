import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { paramCase } from 'src/utils/change-case';

import { CONFIG } from 'src/config-global';
import { useGetProductMovements } from 'src/actions/product';

import { ProductMovementListView } from 'src/sections/product-movement/view';

const metadata = { title: `Product Movement | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam, id = '' } = useParams();

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
  const numericStoreId = storeSlug ? storeSlug.split('-').pop() : null;
  const productId = id ? parseInt(id, 10) : null;

  // Correctly pass numericStoreId as storeId and productId as productId
  const {
    productMovements,
    productMovementsLoading,
    productMovementsError,
    productMovementsEmpty,
  } = useGetProductMovements(numericStoreId, productId);

  return (
    <>
      <Helmet>
        <title>
          {metadata.title} {numericStoreId ? `- Store ${numericStoreId}` : ''}
        </title>
      </Helmet>
      {productMovementsLoading && (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading product movements...</p>
        </div>
      )}
      {/* Always show the table even if empty */}
      {!productMovementsLoading && (
        <ProductMovementListView
          productId={productId}
          movements={productMovements}
          loading={productMovementsLoading}
          error={productMovementsError}
          storeId={numericStoreId}
          storeSlug={storeSlug}
          emptyMessage="No product movement found."
        />
      )}
    </>
  );
}
