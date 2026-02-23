// import { Helmet } from 'react-helmet-async';
// import { useParams } from 'react-router-dom';

// import { CONFIG } from 'src/config-global';
// import { useGetStore } from 'src/actions/store';

// import { StoreCreateView } from 'src/sections/store/view';

// export function StoreGuard() {
//   const { storeId } = useParams();
//   const { store, storeLoading } = useGetStore(storeId);

//   // While loading, show a loading message (or a loading spinner if available)
//   if (storeLoading) {
//     return <div>Loading store...</div>;
//   }

//   // If the store does not exist, render the "create store" view
//   if (!store) {
//     return (
//       <>
//         <Helmet>
//           <title>Create a new Store | Dashboard - {CONFIG.site.name}</title>
//         </Helmet>
//         <StoreCreateView />
//       </>
//     );
//   }

//   // If the store exists, render the child routes
// }
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { useGetStore } from 'src/actions/store';

import { LoadingScreen } from 'src/components/loading-screen';

export const StoreGuard = ({ children }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { store, loading } = useGetStore(id);

  useEffect(() => {
    if (!loading && !store) {
      navigate(paths.page404, { replace: true });
    }
  }, [store, loading, navigate]);

  if (loading) return <LoadingScreen />;

  return children;
};
