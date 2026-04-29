import { useMemo } from 'react';

import { hasPermission, hasAnyPermission, hasAllPermissions, hasCategoryPermission } from 'src/utils/permissions';

import { useUser } from 'src/actions/user';

import { useAuthContext } from 'src/auth/hooks';

/**
 * Hook to access and check user permissions
 * @returns {Object} Permission utilities and user permission data
 */
export function usePermissions() {
  const { user: authUser } = useAuthContext();
  const { user: apiUser, isLoading } = useUser();

  // Get permissions from API user (preferred) or auth context
  const userPermissions = useMemo(() => {
    // Prefer API user permissions as they're more complete
    if (apiUser?.all_permissions && Array.isArray(apiUser.all_permissions)) {
      return apiUser.all_permissions;
    }
    // Fallback to auth context if available
    if (authUser?.all_permissions && Array.isArray(authUser.all_permissions)) {
      return authUser.all_permissions;
    }
    return [];
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
    () => (permission) => hasPermission(userPermissions, permission),
    [userPermissions]
  );

  /**
   * Check if user has any of the specified permissions
   * @param {string[]} requiredPermissions - Array of required permissions
   * @returns {boolean} True if user has at least one of the required permissions
   */
  const checkAnyPermission = useMemo(
    () => (requiredPermissions) => hasAnyPermission(userPermissions, requiredPermissions),
    [userPermissions]
  );

  /**
   * Check if user has all of the specified permissions
   * @param {string[]} requiredPermissions - Array of required permissions
   * @returns {boolean} True if user has all required permissions
   */
  const checkAllPermissions = useMemo(
    () => (requiredPermissions) => hasAllPermissions(userPermissions, requiredPermissions),
    [userPermissions]
  );

  /**
   * Check if user has permission in a specific category
   * @param {string} category - Permission category (e.g., 'users', 'products')
   * @returns {boolean} True if user has any permission in the category
   */
  const checkCategoryPermission = useMemo(
    () => (category) => hasCategoryPermission(userPermissions, category),
    [userPermissions]
  );

  return {
    userPermissions,
    roleId,
    isLoading,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    hasCategoryPermission: checkCategoryPermission,
  };
}
