import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { PaymentMethodCreateView } from 'src/sections/payment-method/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new Expenses | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam } = useParams();
  const currentStoreSlug = storeParam;
 const parts = currentStoreSlug.split('-');
 const numericStoreId = parts[parts.length - 1];
 const storeNameSlug = parts.slice(0, -1).join('-') || currentStoreSlug;
  return (
    <>
          <Helmet>
            <title>{metadata.title} {currentStoreSlug ? `- Store ${currentStoreSlug}` : ''}</title>
          </Helmet>

      <PaymentMethodCreateView storeSlug={currentStoreSlug}
        storeNameSlug={storeNameSlug}
        storeId={numericStoreId}/>
    </>
  );
}
