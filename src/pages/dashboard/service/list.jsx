import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import { paramCase } from 'src/utils/change-case'; // ensure you have this helper
import { CONFIG } from 'src/config-global';
import { useGetServices} from 'src/actions/service';

import { ServiceListView } from 'src/sections/service/view';

// ----------------------------------------------------------------------

const metadata = { title: `Service list | Dashboard - ${CONFIG.site.name}` };

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

  const { services, servicesLoading, servicesError, servicesEmpty } = useGetServices(numericStoreId);
return (
    <>
      <Helmet>
      <title>
          {metadata.title} {storeSlug ? `- Store ${storeSlug}` : ''}
        </title>
      </Helmet>
      {servicesLoading && (
  <div className="flex items-center justify-center h-64">
    <p className="text-gray-500">Loading services...</p>
  </div>
)}
{!servicesLoading && (

      <ServiceListView
      storeId={numericStoreId}     // numeric ID for data queries
      storeSlug={storeSlug}        // full slug for building URLs (if needed)
      services={services}
      loading={servicesLoading}
      error={servicesError}
      empty={servicesEmpty}
      emptyMessage="No Service found."
      />
    )}

    </>
  );
}
