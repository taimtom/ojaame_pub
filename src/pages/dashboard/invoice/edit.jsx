import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { _invoices } from 'src/_mock/_invoice';

import { InvoiceEditView } from 'src/sections/invoice/view';

// ----------------------------------------------------------------------

const metadata = { title: `Invoice edit | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam, id = '' } = useParams();

  const currentStoreSlug = storeParam || 'default-store';

  const parts = currentStoreSlug.split('-');
  const numericStoreId = parts[parts.length - 1];
  const storeNameSlug = parts.slice(0, -1).join('-') || currentStoreSlug;

  const currentInvoice = _invoices.find((invoice) => invoice.id === id);

  return (
    <>
      <Helmet>
        <title> {metadata.title} {storeNameSlug ? `- Store ${storeNameSlug}` : ''}</title>
      </Helmet>

      <InvoiceEditView invoice={currentInvoice}  storeId={numericStoreId} />
    </>
  );
}
