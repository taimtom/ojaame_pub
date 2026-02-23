import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { InvoiceCreateView } from 'src/sections/invoice/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new invoice | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam } = useParams();

   const idParts = storeParam ? storeParam.split('-') : [];
   const numericStoreId = idParts.length > 0 ? idParts[idParts.length - 1] : null;
  return (
    <>
      <Helmet>
        <title>{metadata.title} {numericStoreId ? `- Store ${numericStoreId}` : ''}</title>
      </Helmet>

      <InvoiceCreateView  storeId={numericStoreId} />
    </>
  );
}
