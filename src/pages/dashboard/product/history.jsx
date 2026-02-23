import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { paramCase } from 'src/utils/change-case'; // ensure you have this helper
import { CONFIG } from 'src/config-global';
import { useGetProductHistories } from 'src/actions/product';

import { ProductHistoryListView } from 'src/sections/product-history/view';

// ----------------------------------------------------------------------

const metadata = { title: `Product History | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam } = useParams();
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

  const {
    productHistories,
    productHistoriesLoading,
    productHistoriesError,
    productHistoriesEmpty,
  } = useGetProductHistories(numericStoreId);

  return (
    <>
      <Helmet>
        <title>
          {metadata.title} {storeSlug ? `- Store ${storeSlug}` : ''}
        </title>
      </Helmet>
      {productHistoriesLoading && (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading products...</p>
        </div>
      )}
      {!productHistoriesLoading && (
        <ProductHistoryListView
          storeId={numericStoreId} // numeric ID for data queries
          storeSlug={storeSlug}
          histories={productHistories}
          loading={productHistoriesLoading}
          error={productHistoriesError}
          empty={productHistoriesEmpty}
          emptyMessage="No History found."
        />
      )}

    </>
  );
}
