import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { useGetSale } from 'src/actions/sale';

import { ReceiptView } from 'src/sections/pos/view';

const metadata = { title: `Sales Receipt | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam, id = '' } = useParams();

  // Derive the full store slug from the URL.
  const currentStoreSlug = storeParam || 'default-store';
  const parts = currentStoreSlug.split('-');
  const numericStoreId = parts[parts.length - 1];
  const storeNameSlug = parts.slice(0, -1).join('-') || currentStoreSlug;

  const saleId = id ? parseInt(id, 10) : null;

  // Destructure "sale" from the hook and rename it to "receipt"
  const { sale: receipt, saleLoading, saleError } = useGetSale(saleId, numericStoreId);
  return (
    <>
      <Helmet>
        <title>
          {metadata.title} {currentStoreSlug ? `- Store ${currentStoreSlug}` : ''}
        </title>
      </Helmet>

      <ReceiptView
        receipt={receipt}
        receiptLoading={saleLoading}
        receiptError={saleError}
        storeSlug={currentStoreSlug}
        storeNameSlug={storeNameSlug}
        storeId={numericStoreId}
      />
    </>
  );
}

