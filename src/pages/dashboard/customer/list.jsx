import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { paramCase } from 'src/utils/change-case';

import { CONFIG } from 'src/config-global';
import { useGetCustomers } from 'src/actions/customer';

import { CustomerListView } from 'src/sections/customer/view';

const metadata = { title: `Customer list | Dashboard - ${CONFIG.site.name}` };

export default function CustomerListPage() {
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

  const {
    customers,
    customersLoading,
    customersError,
    customersEmpty,
    refetch,
  } = useGetCustomers(numericStoreId);

  return (
    <>
      <Helmet>
        <title>
          {metadata.title} {storeSlug ? `- Store ${storeSlug}` : ''}
        </title>
      </Helmet>

      {customersLoading && (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading customers...</p>
        </div>
      )}

      {!customersLoading && (
        <CustomerListView
          storeId={numericStoreId}       // Numeric store ID for data queries
          storeSlug={storeSlug}          // Full slug for building URLs, if needed
          customers={customers}
          loading={customersLoading}
          error={customersError}
          empty={customersEmpty}
          refetch={refetch}
          emptyMessage="No customers found."
        />
      )}
    </>
  );
}
