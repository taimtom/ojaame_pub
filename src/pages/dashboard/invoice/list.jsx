import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { paramCase } from 'src/utils/change-case';

import { CONFIG } from 'src/config-global';
import { useGetSales } from 'src/actions/sale';

import { InvoiceListView } from 'src/sections/invoice/view';

const metadata = { title: `Invoice list | Dashboard - ${CONFIG.site.name}` };

export default function InvoiceListPage() {
  const { storeParam } = useParams();
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

  const { sales, salesLoading, salesError, salesEmpty } = useGetSales(numericStoreId);

  return (
    <>
      <Helmet>
        <title>
          {metadata.title} {storeSlug ? `- Store ${storeSlug}` : ''}
        </title>
      </Helmet>

      {salesLoading && (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading sales...</p>
        </div>
      )}

      {!salesLoading && (
        <InvoiceListView
          storeId={numericStoreId}     // Numeric store ID for data queries
          storeSlug={storeSlug}        // Full slug for building URLs, if needed
          sales={sales}
          loading={salesLoading}
          error={salesError}
          empty={salesEmpty}
          emptyMessage="No History found."
        />
      )}

    </>
  );
}
