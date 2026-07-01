import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { paramCase } from 'src/utils/change-case';
import { CONFIG } from 'src/config-global';

import { RestockHistoryListView } from 'src/sections/restock-history/view';

// ----------------------------------------------------------------------

const metadata = { title: `Restock History | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam } = useParams();
  let storeSlug = storeParam;

  if (!storeSlug) {
    const activeWorkspaceJson = localStorage.getItem('activeWorkspace');
    if (activeWorkspaceJson) {
      try {
        const activeWorkspace = JSON.parse(activeWorkspaceJson);
        if (activeWorkspace?.storeName && activeWorkspace?.id) {
          storeSlug = `${paramCase(activeWorkspace.storeName)}-${activeWorkspace.id}`;
        }
      } catch {
        // ignore
      }
    }
  }

  return (
    <>
      <Helmet>
        <title>
          {metadata.title} {storeSlug ? `- Store ${storeSlug}` : ''}
        </title>
      </Helmet>
      <RestockHistoryListView storeSlug={storeSlug} />
    </>
  );
}
