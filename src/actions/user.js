import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// Map your role names to role IDs as needed
// ----------------------------------------------------------------------
// inviteUser - Sends an invitation to a new user.
// ----------------------------------------------------------------------
export const inviteUser = async ({ email, role_id, store_ids }) => {
  const payload = {
    email,
    role_id, // Directly use role_id from the form
    store_ids: store_ids && store_ids.length ? store_ids : null,
  };
  const response = await axiosInstance.post(endpoints.user.invite, payload);
  return response.data;
};

// ----------------------------------------------------------------------
// updateUserDetails - Updates user details during the invitation process.
// ----------------------------------------------------------------------
export const updateUserDetails = async (invitationId, userData) => {
  const url = `${endpoints.user.updateInvite}${invitationId}`;
  const formData = new FormData();
  Object.entries(userData).forEach(([key, value]) => {
    formData.append(key, value);
  });
  const response = await axiosInstance.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};


// ----------------------------------------------------------------------
// resendInvitation - Resends the invitation email to a pending user.
// ----------------------------------------------------------------------
export const resendInvitation = async (userId) => {
  const response = await axiosInstance.post(`${endpoints.user.resendInvite}${userId}`);
  return response.data;
};

// ----------------------------------------------------------------------
// editUserDetails - Admin updates user details via a PUT request.
// ----------------------------------------------------------------------
export const editUserDetails = async (userId, userData) => {
  const url = `${endpoints.user.edit}/${userId}`;
  const formData = new FormData();
  Object.entries(userData).forEach(([key, value]) => {
    formData.append(key, value);
  });
  const response = await axiosInstance.put(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// ----------------------------------------------------------------------
// useUser - Retrieves the currently logged in user's details.
// ----------------------------------------------------------------------
export function useUser() {
  const { data, error, isLoading } = useSWR(endpoints.auth.me, fetcher);
  return {
    user: data,
    isLoading,
    isError: error,
  };
}



// ----------------------------------------------------------------------
// useGetUsers - Fetches a list of users for the company.
// ----------------------------------------------------------------------
export function useGetUsers() {
  const key = endpoints.user.list;
  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    keepPreviousData: true,
  });

  return useMemo(
    () => ({
      users: data || [],
      usersLoading: isLoading,
      usersError: error,
      usersValidating: isValidating,
      usersEmpty: !isLoading && (!data || data.length === 0),
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------
// useGetUserDetails - Fetches details of a single user given its ID.
// The API is expected to accept a query parameter "user_id".
// ----------------------------------------------------------------------

export function useGetUserDetails(userId) {
  const key = userId ? `${endpoints.user.details}/${userId}` : null;
  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return useMemo(
    () => ({
      user: data,
      userLoading: isLoading,
      userError: error,
      userValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}
