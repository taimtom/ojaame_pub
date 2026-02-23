import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

// import { _jobs } from 'src/_mock/_job';
import { CONFIG } from 'src/config-global';
import { useGetPaymentMethod } from 'src/actions/paymentmethod';

import { PaymentMethodEditView } from 'src/sections/payment-method/view';

// ----------------------------------------------------------------------

const metadata = { title: `Expenses edit | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam, id = '' } = useParams();

  const currentStoreSlug = storeParam || 'default-store';

  const parts = currentStoreSlug.split('-');
  const numericStoreId = parts[parts.length - 1];
  const storeNameSlug = parts.slice(0, -1).join('-') || currentStoreSlug;

  const paymentMethodId = id ? parseInt(id, 10) : null;
  const { paymentMethod, isLoading } = useGetPaymentMethod(paymentMethodId, numericStoreId);

  return (
    <>
        <Helmet>
              <title> {metadata.title} {storeNameSlug ? `- Store ${storeNameSlug}` : ''}</title>
            </Helmet>
            {!isLoading && <PaymentMethodEditView paymentMethod={paymentMethod} storeId={numericStoreId} storeSlug={currentStoreSlug}       // For routing (keeps the friendly slug)
        storeNameSlug={storeNameSlug} />}
      {/* <ExpenseEditView job={currentJob} storeId={numericStoreId}/> */}
    </>
  );
}
