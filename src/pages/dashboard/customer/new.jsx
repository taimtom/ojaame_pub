import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { CustomerCreateView } from 'src/sections/customer/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new Customer | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
    const { storeParam } = useParams();

    // Derive store slug and store ID from URL
    const currentStoreSlug = storeParam || 'default-store';
    const parts = currentStoreSlug.split('-');
    const numericStoreId = parts[parts.length - 1];
    const storeNameSlug = parts.slice(0, -1).join('-') || currentStoreSlug;

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <CustomerCreateView />
    </>
  );
}
