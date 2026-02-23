import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { useGetSale } from 'src/actions/sale';

import { InvoiceEditView } from 'src/sections/pos/view';

const metadata = { title: `Edit Invoice | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam, id = '' } = useParams();

  // Derive the full store slug from the URL.
  const currentStoreSlug = storeParam || 'default-store';
  const parts = currentStoreSlug.split('-');
  const numericStoreId = parts[parts.length - 1];
  const storeNameSlug = parts.slice(0, -1).join('-') || currentStoreSlug;

  const InvoiceId = id ? parseInt(id, 10) : null;

  // Destructure "sale" from the hook and rename it to "invoice"
  const { sale: invoice, saleLoading, saleError } = useGetSale(InvoiceId, numericStoreId);
  return (
    <>
      <Helmet>
        <title>
          {metadata.title} {currentStoreSlug ? `- Store ${currentStoreSlug}` : ''}
        </title>
      </Helmet>

      <InvoiceEditView
        invoice={invoice}
        storeSlug={currentStoreSlug}
        storeNameSlug={storeNameSlug}
        storeId={numericStoreId}
      />
    </>
  );
}
