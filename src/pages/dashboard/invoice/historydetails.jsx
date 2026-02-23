import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { paramCase } from 'src/utils/change-case';

import { CONFIG } from 'src/config-global';
import { useGetSalesHistoryList } from 'src/actions/sale';

import { SalesInvoiceHistoryListView } from 'src/sections/invoice-history/view';

const metadata = { title: `Sales History list | Dashboard - ${CONFIG.site.name}` };

export default function InvoiceHistoryListPage() {
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

  const { salesHistoryList, salesHistoryListLoading, salesHistoryListError, salesHistoryEmpty } = useGetSalesHistoryList(numericStoreId, saleId);

  return (
    <>
      <Helmet>
        <title>
          {metadata.title} {storeSlug ? `- Store ${storeSlug}` : ''}
        </title>
      </Helmet>

      {salesHistoryListLoading && (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading history...</p>
        </div>
      )}

      {!salesHistoryListLoading &&(
        <SalesInvoiceHistoryListView
          storeId={numericStoreId}     // Numeric store ID for data queries
          storeSlug={storeSlug}        // Full slug for building URLs, if needed
          history={salesHistoryList}
          loading={salesHistoryListLoading}
          error={salesHistoryListError}
          empty={salesHistoryEmpty}
          emptyMessage="No History found."
        />
      )}


    </>
  );
}
