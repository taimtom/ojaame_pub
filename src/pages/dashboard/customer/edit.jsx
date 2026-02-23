import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useGetCustomer } from 'src/actions/customer';

import { CustomerEditView } from 'src/sections/customer/view';

const metadata = { title: `Customer edit | Dashboard - ${CONFIG.site.name}` };

export default function CustomerEditPage() {
  const { storeParam, id = '' } = useParams();

  // Derive the full store slug from the URL or fallback to 'default-store'
  const currentStoreSlug = storeParam || 'default-store';
  const parts = currentStoreSlug.split('-');
  const numericStoreId = parts[parts.length - 1];
  // Optionally, if you need the store name part:
  const storeNameSlug = parts.slice(0, -1).join('-') || currentStoreSlug;

  // Fetch customer details using the numeric store ID and customer id.
  const { customer, customerLoading, customerError } = useGetCustomer(id, numericStoreId);

  if (customerLoading) {
    return <div>Loading customer details...</div>;
  }

  if (customerError) {
    return <div>Error loading customer details. Please try again later.</div>;
  }

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <CustomerEditView
        customer={customer}
        storeId={numericStoreId}       // Numeric store ID for further data operations
        storeSlug={currentStoreSlug}
        storeNameSlug={storeNameSlug}  // Full slug for URL building or other display purposes
      />
    </>
  );
}
