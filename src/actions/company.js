// src/actions/company.js
import useSWR from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// This hook fetches the current user's company.
export function useCompany({ skip = false } = {}) {
  const key = skip ? null : endpoints.company.me;
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(key, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    revalidateOnMount: true,
  });

  const companyError = error && error.status !== 404 ? error : null;
  const companyEmpty = !isLoading && (!data || Object.keys(data).length === 0);

  return {
    company: data,
    companyLoading: isLoading,
    companyError,
    companyEmpty,
    companyValidating: isValidating,
    mutateCompany: mutate,
  };
}

/**
 * createCompany - Creates a new company using the provided formData.
 *
 * @param {FormData} formData - The form data to be submitted.
 * @returns {Promise<Object>} - The created company data.
 */
export async function createCompany(formData) {
  try {
    const response = await axiosInstance.post(endpoints.company.create, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
}

export async function updateCompany(companyId, formData) {
  try {
    const response = await axiosInstance.put(`${endpoints.company.update}/${companyId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
}

