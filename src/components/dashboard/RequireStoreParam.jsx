// RequireStoreParam.jsx
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { paths } from 'src/routes/paths';

export function RequireStoreParam({ children }) {
  const { storeParam } = useParams();

  // If storeParam is missing or is "default-store", redirect to the store list.
  if (!storeParam || storeParam === 'default-store') {
    return <Navigate to={paths.dashboard.store.list} replace />;
  }
  return children;
}
