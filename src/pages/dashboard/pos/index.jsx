import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { InvoiceCreateView } from 'src/sections/pos/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new sales invoice | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam } = useParams();

  const currentStoreSlug = storeParam;
  const parts = currentStoreSlug.split('-');
  const numericStoreId = parts[parts.length - 1];
  const storeNameSlug = parts.slice(0, -1).join('-') || currentStoreSlug;

  return (
    <>
      <Helmet>
        <title>
        {metadata.title} {currentStoreSlug ? `- Store ${currentStoreSlug}` : ''}
        </title>
      </Helmet>

      <InvoiceCreateView  storeSlug={currentStoreSlug}
        storeNameSlug={storeNameSlug}
        storeId={numericStoreId} />
    </>
  );
}
