import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useGetStore } from 'src/actions/store'; // Ensure you import useGetStore, not useGetStores
import { paths } from 'src/routes/paths';

import { LoadingScreen } from 'src/components/loading-screen';

const StoreWrapper = ({ children }) => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { store, storeLoading } = useGetStore(storeId);

  useEffect(() => {
    // Once loading is finished, if no store is found, redirect to the create store page.
    if (!storeLoading && !store) {
      navigate(paths.dashboard.store.new, { replace: true });
    }
  }, [store, storeLoading, navigate]);

  // While the store is loading or if it hasn't been found yet,
  // render a loading screen.
  if (storeLoading || !store) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

export default StoreWrapper;
