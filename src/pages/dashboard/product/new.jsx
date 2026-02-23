import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { useBusinessType } from 'src/hooks/use-business-type';

import { ProductCreateView } from 'src/sections/product/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { storeParam } = useParams();
  const { t } = useBusinessType();
  const productTerm = t('product');

  // Derive store slug and store ID from URL
  const currentStoreSlug = storeParam || 'default-store';
  const parts = currentStoreSlug.split('-');
  const numericStoreId = parts[parts.length - 1];
  const storeNameSlug = parts.slice(0, -1).join('-') || currentStoreSlug;

  const pageTitle = `Add new ${productTerm} | Dashboard - ${CONFIG.site.name}`;

  return (
    <>
      <Helmet>
        <title>
          {pageTitle} {currentStoreSlug ? `- Store ${currentStoreSlug}` : ''}
        </title>
      </Helmet>

      <ProductCreateView
        storeSlug={currentStoreSlug}
        storeNameSlug={storeNameSlug}
        storeId={numericStoreId}
      />
    </>
  );
}
