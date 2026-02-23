/**
 * Protected Route Component
 * 
 * Route wrapper that checks permissions before rendering.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../contexts/PermissionContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const ProtectedRoute = ({
  children,
  feature,
  action,
  role,
  requireAll = false,
  redirectTo = '/403',
  loadingFallback = null
}) => {
  const { hasPermission, hasRole, loading } = usePermissions();

  if (loading) {
    return loadingFallback || (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  let hasAccess = false;

  if (role && feature && action) {
    // Check both role and permission
    hasAccess = requireAll
      ? hasRole(role) && hasPermission(feature, action)
      : hasRole(role) || hasPermission(feature, action);
  } else if (role) {
    // Check role only
    hasAccess = hasRole(role);
  } else if (feature && action) {
    // Check permission only
    hasAccess = hasPermission(feature, action);
  } else {
    console.warn('ProtectedRoute: Either role or feature+action must be provided');
    return <Navigate to={redirectTo} replace />;
  }

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  feature: PropTypes.string,
  action: PropTypes.string,
  role: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  requireAll: PropTypes.bool,
  redirectTo: PropTypes.string,
  loadingFallback: PropTypes.node,
};

export default ProtectedRoute;
