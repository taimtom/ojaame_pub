import { useMemo } from 'react';

import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasCategoryPermission,
  expandImpliedPermissions,
} from 'src/utils/permissions';

import { useUser } from 'src/actions/user';

import { useAuthContext } from 'src/auth/hooks';

const FULL_ACCESS_ROLES = new Set(['merchant', 'owner', 'administrator', 'admin']);

function normalizeRoleName(role) {
  if (!role) return '';
  if (typeof role === 'string') return role.trim().toLowerCase();
  if (typeof role === 'object' && role.name) return String(role.name).trim().toLowerCase();
  return '';
}

/**
 * Hook to access and check user permissions
 * @returns {Object} Permission utilities and user permission data
 */
export function usePermissions() {
  const { user: authUser } = useAuthContext();
  const { user: apiUser, isLoading } = useUser();

  const roleName = useMemo(
    () => normalizeRoleName(apiUser?.role || authUser?.role),
    [apiUser, authUser]
  );

  const isFullAccessRole = FULL_ACCESS_ROLES.has(roleName);

  // Get permissions from API user (preferred) or auth context
  const userPermissions = useMemo(() => {
    let base = [];
    if (apiUser?.all_permissions && Array.isArray(apiUser.all_permissions)) {
      base = apiUser.all_permissions;
    } else if (authUser?.all_permissions && Array.isArray(authUser.all_permissions)) {
      base = authUser.all_permissions;
    }
    return expandImpliedPermissions(base);
  }, [apiUser, authUser]);

  // Get role_id
  const roleId = useMemo(
    () => apiUser?.role_id || authUser?.role_id || null,
    [apiUser, authUser]
  );

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission to check (e.g., 'users.read')
   * @returns {boolean} True if user has the permission
   */
  const checkPermission = useMemo(
    () => (permission) => {
      if (isFullAccessRole) return true;
      return hasPermission(userPermissions, permission);
    },
    [userPermissions, isFullAccessRole]
  );

  /**
   * Check if user has any of the specified permissions
   * @param {string[]} requiredPermissions - Array of required permissions
   * @returns {boolean} True if user has at least one of the required permissions
   */
  const checkAnyPermission = useMemo(
    () => (requiredPermissions) => {
      if (isFullAccessRole) return true;
      return hasAnyPermission(userPermissions, requiredPermissions);
    },
    [userPermissions, isFullAccessRole]
  );

  /**
   * Check if user has all of the specified permissions
   * @param {string[]} requiredPermissions - Array of required permissions
   * @returns {boolean} True if user has all required permissions
   */
  const checkAllPermissions = useMemo(
    () => (requiredPermissions) => {
      if (isFullAccessRole) return true;
      return hasAllPermissions(userPermissions, requiredPermissions);
    },
    [userPermissions, isFullAccessRole]
  );

  /**
   * Check if user has permission in a specific category
   * @param {string} category - Permission category (e.g., 'users', 'products')
   * @returns {boolean} True if user has any permission in the category
   */
  const checkCategoryPermission = useMemo(
    () => (category) => {
      if (isFullAccessRole) return true;
      return hasCategoryPermission(userPermissions, category);
    },
    [userPermissions, isFullAccessRole]
  );

  return {
    userPermissions,
    roleId,
    roleName,
    isFullAccessRole,
    isLoading,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    hasCategoryPermission: checkCategoryPermission,
  };
}
