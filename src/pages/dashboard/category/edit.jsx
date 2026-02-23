import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useGetCategory } from 'src/actions/category';

import { CategoryEditView } from 'src/sections/category/view';

// ----------------------------------------------------------------------

const metadata = { title: `Category edit | Dashboard - ${CONFIG.site.name}` };

export default function Page() {

  const { storeParam, id = '' } = useParams();

  const currentStoreSlug = storeParam;

  const parts = currentStoreSlug.split('-');
  const numericStoreId = parts[parts.length - 1];
  const storeNameSlug = parts.slice(0, -1).join('-') || currentStoreSlug;

  // Parse the product_id to ensure it's an integer (or null if missing)
  const categoryId = id? parseInt(id, 10) : null;

  const { category } = useGetCategory(categoryId, numericStoreId);

  return (
    <>
      <Helmet>
        <title> {metadata.title} {storeNameSlug ? `- Store ${storeNameSlug}` : ''}
        </title>
      </Helmet>

      <CategoryEditView
        category={category}
        storeSlug={currentStoreSlug}       // For routing (keeps the friendly slug)
        storeNameSlug={storeNameSlug}        // For display in breadcrumbs
        storeId={numericStoreId}  />
    </>
  );
}
