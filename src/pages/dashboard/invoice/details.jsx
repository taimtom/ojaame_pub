import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { paramCase } from 'src/utils/change-case';

import { CONFIG } from 'src/config-global';
import { useGetSale } from 'src/actions/sale';

import { InvoiceDetailsView } from 'src/sections/invoice/view';

// ----------------------------------------------------------------------

const metadata = { title: `Invoice details | Dashboard - ${CONFIG.site.name}` };

export default function InvoiceDetailsPage() {
  const { storeParam, id = '' } = useParams();
  let storeSlug = storeParam;

  // Fallback: if storeParam is not provided, try to get the active workspace from localStorage
  if (!storeSlug) {
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

  // Extract the numeric store ID from the slug (e.g., "mystore-1" gives "1")
  const numericStoreId = storeSlug ? storeSlug.split('-').pop() : null;
  const saleId = id ? parseInt(id, 10) : null;

  // Fetch sale details using the useGetSale hook
  const { sale, saleLoading, saleError } = useGetSale(saleId, numericStoreId);

  return (
    <>
      <Helmet>
        <title>
          {metadata.title} {storeSlug ? `- Store ${storeSlug}` : ''}
        </title>
      </Helmet>

      {saleLoading && (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading sale details...</p>
        </div>
      )}

      {!saleLoading && saleError && (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Error loading sale details.</p>
        </div>
      )}

      {!saleLoading && sale && (
        <InvoiceDetailsView
          invoice={sale} // Passing the fetched sale details
          storeId={numericStoreId}
          storeSlug={storeSlug}
        />
      )}
    </>
  );
}
