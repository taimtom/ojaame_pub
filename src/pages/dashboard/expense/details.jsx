import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { paramCase } from 'src/utils/change-case';

import { _orders } from 'src/_mock/_order';
import { CONFIG } from 'src/config-global';

import { ExpenseDetailsView } from 'src/sections/expense/view';

// ----------------------------------------------------------------------

const metadata = { title: `Order details | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
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



  const currentOrder = _orders.find((order) => order.id === id);

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ExpenseDetailsView order={currentOrder}  storeId={numericStoreId}
          storeSlug={storeSlug}/>
    </>
  );
}
