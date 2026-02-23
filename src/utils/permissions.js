/**
 * Permission utility functions
 * Helper functions for checking user permissions
 */

/**
 * Check if user has a specific permission
 * @param {string[]} userPermissions - Array of user's permissions (e.g., ['users.read', 'products.create'])
 * @param {string} permission - Permission to check (e.g., 'users.read')
 * @returns {boolean} True if user has the permission
 */
export function hasPermission(userPermissions, permission) {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  return userPermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 * @param {string[]} userPermissions - Array of user's permissions
 * @param {string[]} requiredPermissions - Array of required permissions (user needs ANY of these)
 * @returns {boolean} True if user has at least one of the required permissions
 */
export function hasAnyPermission(userPermissions, requiredPermissions) {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true; // No requirements means always visible
  }
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  return requiredPermissions.some((permission) => userPermissions.includes(permission));
}

/**
 * Check if user has all of the specified permissions
 * @param {string[]} userPermissions - Array of user's permissions
 * @param {string[]} requiredPermissions - Array of required permissions (user needs ALL of these)
 * @returns {boolean} True if user has all required permissions
 */
export function hasAllPermissions(userPermissions, requiredPermissions) {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true; // No requirements means always visible
  }
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  return requiredPermissions.every((permission) => userPermissions.includes(permission));
}

/**
 * Check if user has permission in a specific category
 * @param {string[]} userPermissions - Array of user's permissions
 * @param {string} category - Permission category (e.g., 'users', 'products')
 * @returns {boolean} True if user has any permission in the category
 */
export function hasCategoryPermission(userPermissions, category) {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  return userPermissions.some((permission) => permission.startsWith(`${category}.`));
}

/**
 * Get all permissions for a specific category
 * @param {string[]} userPermissions - Array of user's permissions
 * @param {string} category - Permission category (e.g., 'users', 'products')
 * @returns {string[]} Array of permissions in the category
 */
export function getCategoryPermissions(userPermissions, category) {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return [];
  }
  return userPermissions.filter((permission) => permission.startsWith(`${category}.`));
}
