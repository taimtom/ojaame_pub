/**
 * Permission Context
 * 
 * Manages user permissions and role-based access control throughout the app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '../../utils/axios';

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user permissions
  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      
      if (!userId || !companyId) {
        setLoading(false);
        return;
      }

      // Get user permissions
      const permResponse = await axios.get(`/api/permissions/user/${userId}`, {
        params: { company_id: companyId }
      });
      
      setPermissions(permResponse.data.permissions || []);
      setRoles(permResponse.data.roles || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  /**
   * Check if user has a specific permission
   * @param {string} feature - Feature name (e.g., 'sales', 'products')
   * @param {string} action - Action name (e.g., 'view', 'create', 'edit', 'delete')
   * @param {number} storeId - Optional store ID for store-scoped permissions
   * @returns {boolean}
   */
  const hasPermission = useCallback((feature, action, storeId = null) => {
    if (!permissions || permissions.length === 0) return false;
    
    // Check for exact permission match
    const hasExactMatch = permissions.some(perm => 
      perm.feature === feature && 
      perm.action === action &&
      (!storeId || !perm.store_scope || perm.store_scope.includes(storeId))
    );
    
    return hasExactMatch;
  }, [permissions]);

  /**
   * Check if user has any of the specified roles
   * @param {string|string[]} roleNames - Role name(s) to check
   * @returns {boolean}
   */
  const hasRole = useCallback((roleNames) => {
    if (!roles || roles.length === 0) return false;
    
    const rolesToCheck = Array.isArray(roleNames) ? roleNames : [roleNames];
    return roles.some(role => rolesToCheck.includes(role.name));
  }, [roles]);

  /**
   * Check if user has access to a specific store
   * @param {number} storeId - Store ID
   * @returns {boolean}
   */
  const hasStoreAccess = useCallback((storeId) => {
    if (!roles || roles.length === 0) return false;
    
    // Owner and Administrator have access to all stores
    if (hasRole(['Owner', 'Administrator'])) return true;
    
    // Check store scope in roles
    return roles.some(role => 
      !role.store_scope || 
      role.store_scope.length === 0 || 
      role.store_scope.includes(storeId)
    );
  }, [roles, hasRole]);

  /**
   * Get accessible store IDs
   * @returns {number[]}
   */
  const getAccessibleStores = useCallback(() => {
    if (!roles || roles.length === 0) return [];
    
    // Owner and Administrator have access to all stores
    if (hasRole(['Owner', 'Administrator'])) {
      // Return all stores - would need to fetch from API
      return 'all';
    }
    
    // Collect unique store IDs from all roles
    const storeIds = new Set();
    roles.forEach(role => {
      if (role.store_scope && role.store_scope.length > 0) {
        role.store_scope.forEach(id => storeIds.add(id));
      }
    });
    
    return Array.from(storeIds);
  }, [roles, hasRole]);

  /**
   * Check if user can perform any action on a feature
   * @param {string} feature - Feature name
   * @returns {boolean}
   */
  const canAccessFeature = useCallback((feature) => {
    if (!permissions || permissions.length === 0) return false;
    
    return permissions.some(perm => perm.feature === feature);
  }, [permissions]);

  /**
   * Get all available actions for a feature
   * @param {string} feature - Feature name
   * @returns {string[]} List of allowed actions
   */
  const getFeatureActions = useCallback((feature) => {
    if (!permissions || permissions.length === 0) return [];
    
    return permissions
      .filter(perm => perm.feature === feature)
      .map(perm => perm.action);
  }, [permissions]);

  const value = {
    permissions,
    roles,
    loading,
    error,
    hasPermission,
    hasRole,
    hasStoreAccess,
    getAccessibleStores,
    canAccessFeature,
    getFeatureActions,
    refreshPermissions: fetchPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
};

export default PermissionContext;
