/**
 * Permission Gate Component
 * 
 * Conditionally renders children based on user permissions.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { usePermissions } from '../../contexts/PermissionContext';
import { Box, Typography, Alert } from '@mui/material';

const PermissionGate = ({
  children,
  feature,
  action,
  storeId = null,
  role = null,
  requireAll = false,
  fallback = null,
  showError = false,
  errorMessage = "You don't have permission to access this feature."
}) => {
  const { hasPermission, hasRole, loading } = usePermissions();

  if (loading) {
    return fallback || null;
  }

  let hasAccess = false;

  if (role && feature && action) {
    // Check both role and permission
    hasAccess = requireAll
      ? hasRole(role) && hasPermission(feature, action, storeId)
      : hasRole(role) || hasPermission(feature, action, storeId);
  } else if (role) {
    // Check role only
    hasAccess = hasRole(role);
  } else if (feature && action) {
    // Check permission only
    hasAccess = hasPermission(feature, action, storeId);
  } else {
    console.warn('PermissionGate: Either role or feature+action must be provided');
    return fallback || null;
  }

  if (!hasAccess) {
    if (showError) {
      return (
        <Box p={3}>
          <Alert severity="error">{errorMessage}</Alert>
        </Box>
      );
    }
    return fallback || null;
  }

  return <>{children}</>;
};

PermissionGate.propTypes = {
  children: PropTypes.node.isRequired,
  feature: PropTypes.string,
  action: PropTypes.string,
  storeId: PropTypes.number,
  role: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  requireAll: PropTypes.bool,
  fallback: PropTypes.node,
  showError: PropTypes.bool,
  errorMessage: PropTypes.string,
};

export default PermissionGate;
