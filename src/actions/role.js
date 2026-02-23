// src/actions/role.js
import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------
// Fetch all roles (GET /api/role/)
export function useGetRoles() {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.role.list, fetcher);

  return useMemo(
    () => ({
      roles: data || [],
      rolesLoading: isLoading,
      rolesError: error,
      rolesValidating: isValidating,
      rolesEmpty: !isLoading && (!data || data.length === 0),
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------
// Fetch single role by ID (GET /api/role/{role_id})
export function useGetRole(roleId) {
  const url = roleId ? endpoints.role.details(roleId) : null;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher);

  return useMemo(
    () => ({
      role: data,
      roleLoading: isLoading,
      roleError: error,
      roleValidating: isValidating,
      roleEmpty: !isLoading && !data,
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------
// Create custom role (POST /api/role/custom)
export async function createRole(payload) {
  const res = await axiosInstance.post(endpoints.role.create, payload);
  return res.data;
}

// ----------------------------------------------------------------------
// Update role (PUT /api/role/{role_id})
export async function updateRole(roleId, payload) {
  const res = await axiosInstance.put(endpoints.role.update(roleId), payload);
  return res.data;
}

// ----------------------------------------------------------------------
// Delete role (DELETE /api/role/{role_id})
export async function deleteRole(roleId) {
  await axiosInstance.delete(endpoints.role.delete(roleId));
  // FastAPI returns 204 No Content
  return { success: true };
}

// ----------------------------------------------------------------------
// Add permissions to role (POST /api/role/{role_id}/permissions)
export async function addPermissionsToRole(roleId, payload) {
  const res = await axiosInstance.post(endpoints.role.addPermissions(roleId), payload);
  return res.data;
}

// ----------------------------------------------------------------------
// Remove permissions from role (DELETE /api/role/{role_id}/permissions)
export async function removePermissionsFromRole(roleId, payload) {
  const res = await axiosInstance.delete(endpoints.role.removePermissions(roleId), {
    data: payload,
  });
  return res.data;
}

// ----------------------------------------------------------------------
// Fetch all available permissions (GET /api/role/permissions/all)
export function useGetAllPermissions() {
  const { data, isLoading, error, isValidating } = useSWR(
    endpoints.role.permissionOptions,
    fetcher
  );

  return useMemo(
    () => ({
      permissionsByCategory: data?.permissions_by_category || {},
      allPermissions: data?.all_permissions || [],
      permissionsLoading: isLoading,
      permissionsError: error,
      permissionsValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------
// Fetch a user's permissions (GET /api/role/users/{user_id}/permissions)
export function useGetUserPermissions(userId) {
  const url = userId ? endpoints.role.userPermissions(userId) : null;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher);

  return useMemo(
    () => ({
      userPermissions: data || [],
      userPermissionsLoading: isLoading,
      userPermissionsError: error,
      userPermissionsValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------
// Assign or change a user's role (PUT /api/role/users/{user_id}/role)
export async function updateUserRole(userId, payload) {
  const res = await axiosInstance.put(endpoints.role.updateUserRole(userId), payload);
  return res.data;
}

// ----------------------------------------------------------------------
// Update a user's custom permissions (PUT /api/role/users/{user_id}/permissions)
export async function updateUserPermissions(userId, payload) {
  const res = await axiosInstance.put(endpoints.role.updateUserPermissions(userId), payload);
  return res.data;
}
