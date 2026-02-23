import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import { paramCase } from 'src/utils/change-case'; // ensure you have this helper
import { CONFIG } from 'src/config-global';
import { useGetCategories } from 'src/actions/category';

import { CategoryListView } from 'src/sections/category/view';


// ----------------------------------------------------------------------

const metadata = { title: `Category list | Dashboard - ${CONFIG.site.name}` };

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

    const { categories, categoriesLoading, categoriesError, categoriesEmpty } = useGetCategories(numericStoreId);

  return (
    <>
      <Helmet>
        <title> {metadata.title} {storeSlug ? `- Store ${storeSlug}` : ''}
        </title>
      </Helmet>
      {categoriesLoading && (
  <div className="flex items-center justify-center h-64">
    <p className="text-gray-500">Loading Category...</p>
  </div>
)}{!categoriesLoading && (
      <CategoryListView
        storeId={numericStoreId}     // numeric ID for data queries
        storeSlug={storeSlug}        // full slug for building URLs (if needed)
        products={categories}
        loading={categoriesLoading}
        error={categoriesError}
        empty={categoriesEmpty}
        emptyMessage="No Category found."
      />
    )}


    </>
  );
}
