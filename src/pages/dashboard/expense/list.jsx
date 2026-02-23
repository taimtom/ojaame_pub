import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import { paramCase } from 'src/utils/change-case';

import { CONFIG } from 'src/config-global';
import { useGetExpenses } from 'src/actions/expense';

import { ExpenseListView } from 'src/sections/expense/view';

// ----------------------------------------------------------------------

const metadata = { title: `Expenses list | Dashboard - ${CONFIG.site.name}` };


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

      const numericStoreId = storeSlug ? storeSlug.split('-').pop() : null;
    const {
    expenses,
    isLoading: loading,
    isError: error,
    isEmpty: empty,
  } = useGetExpenses(numericStoreId);

  return (
    <>
      <Helmet>
        <title>
          {metadata.title}
          {storeSlug ? ` – Store ${storeSlug}` : ''}
        </title>
      </Helmet>

      <ExpenseListView
        storeSlug={storeSlug}
        storeId={numericStoreId}
        expenses={expenses}
        loading={loading}
        error={error}
        empty={empty}
      />
    </>
  );
}
