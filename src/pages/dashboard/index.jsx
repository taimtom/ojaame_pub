import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { CONFIG } from 'src/config-global';

import { OverviewAppView } from 'src/sections/overview/app/view';
// import { useGetStores } from 'src/actions/store';

// import { StoreShopView } from 'src/sections/store/view';

// ----------------------------------------------------------------------

const metadata = { title: `Dashboard - ${CONFIG.site.name}` };

export default function OverviewAppPage() {
  // Grab the storeId from the URL parameters (if available)
  const { storeParam } = useParams();

  // Split the parameter to extract the numeric id.
  const idParts = storeParam ? storeParam.split('-') : [];
  const numericStoreId = idParts.length > 0 ? idParts[idParts.length - 1] : null;

  return (
    <>
      <Helmet>
        <title>
          {metadata.title} {numericStoreId ? `- Store ${numericStoreId}` : ''}
        </title>
      </Helmet>
      <OverviewAppView storeId={numericStoreId} />
    </>
  );
}

// ----------------------------------------------------------------------

// const metadata = { title: `Select Comapany store | Dashboard - ${CONFIG.site.name}` };

// export default function OverviewAppPage() {
//   const { stores, storesLoading } = useGetStores();

//   return (
//     <>
//       <Helmet>
//         <title> {metadata.title}</title>
//       </Helmet>

//       <StoreShopView stores={stores} loading={storesLoading} />
//     </>
//   );
// }
