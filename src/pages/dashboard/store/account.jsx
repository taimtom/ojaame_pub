import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { CONFIG } from 'src/config-global';
import { useGetStore } from 'src/actions/store';

import { StoreEditView } from 'src/sections/store/view';

// ----------------------------------------------------------------------

const metadata = { title: `Store account edit | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { id } = useParams(); // id is expected to be in the format "slugifiedStoreName-storeId"

  // Extract the numeric store id from the combined parameter.
  const numericStoreId = id ? id.split('-').pop() : null;

  const { store, storeLoading, storeError, mutate } = useGetStore(numericStoreId);
// Trigger a revalidation each time the component mounts or the store id changes.
  useEffect(() => {
    if (numericStoreId) {
      mutate();
    }
  }, [numericStoreId, mutate]);
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <StoreEditView store={store} loading={storeLoading} error={storeError} mutate={mutate} />
    </>
  );
}
