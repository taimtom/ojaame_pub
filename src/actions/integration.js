// src/utils/integration.js

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------
// SWR options (disable automatic revalidation by default)
const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
};

// ----------------------------------------------------------------------
// CREATE a new integration (Google or Jumia)
export async function createIntegration(payload) {
  // payload shape: { name, provider, integration_type, store_id?, company_id?, config? }
  const res = await axiosInstance.post(endpoints.integrations.create, payload);

  // Trigger real-time update of the integrations list
  mutate(endpoints.integrations.list);

  return res.data;
}

// ----------------------------------------------------------------------
// GET OAuth URL to start the Google OAuth flow
export function useGetOAuthUrl(integrationId) {
  const url = integrationId
    ? `${endpoints.integrations.oauthUrl}${integrationId}`
    : null;

  const { data, isLoading, error, isValidating } = useSWR(
    url,
    fetcher,
    swrOptions
  );

  const memoized = useMemo(
    () => ({
      oauthUrl: data?.oauth_url || '',
      oauthUrlLoading: isLoading,
      oauthUrlError: error,
      oauthUrlValidating: isValidating,
    }),
    [data?.oauth_url, error, isLoading, isValidating]
  );

  return memoized;
}

// ----------------------------------------------------------------------
// Exchange authorization code for access/refresh tokens (callback)
export async function exchangeOAuthCode(integrationId, authorizationCode) {
  const payload = { integration_id: integrationId, authorization_code: authorizationCode };
  const res = await axiosInstance.post(endpoints.integrations.oauthCallback, payload);
  return res.data;
}

// ----------------------------------------------------------------------
// LIST all integrations (optionally filter by store, company, provider)
export function useListIntegrations({ storeId = null, companyId = null, provider = null } = {}) {
  // Build a query string
  let query = '';
  const params = [];
  if (storeId) params.push(`store_id=${storeId}`);
  if (companyId) params.push(`company_id=${companyId}`);
  if (provider) params.push(`provider=${provider}`);
  if (params.length) query = `?${params.join('&')}`;

  const url = `${endpoints.integrations.list}${query}`;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoized = useMemo(
    () => ({
      integrations: data?.integrations || [],
      integrationsLoading: isLoading,
      integrationsError: error,
      integrationsValidating: isValidating,
      integrationsEmpty: !isLoading && !data?.integrations?.length,
    }),
    [data?.integrations, error, isLoading, isValidating]
  );

  return memoized;
}

// ----------------------------------------------------------------------
// GET integration details by ID
export async function getIntegrationDetails(integrationId) {
  const res = await axiosInstance.get(
    `${endpoints.integrations.details}${integrationId}`
  );
  return res.data;
}

// ----------------------------------------------------------------------
// UPDATE an integration by ID
export async function updateIntegration(integrationId, updateData) {
  const res = await axiosInstance.put(
    `${endpoints.integrations.update}${integrationId}`,
    updateData
  );

  // Trigger real-time update of the integrations list
  mutate(endpoints.integrations.list);

  return res.data;
}

// ----------------------------------------------------------------------
// DELETE an integration by ID
export async function deleteIntegration(integrationId) {
  const res = await axiosInstance.delete(
    `${endpoints.integrations.delete}${integrationId}`
  );

  // Trigger real-time update of the integrations list
  mutate(endpoints.integrations.list);

  return res.data;
}

// ----------------------------------------------------------------------
// TEST a given integration (Google or Jumia) to confirm connection
export function useTestIntegration(integrationId) {
  const url = integrationId
    ? `${endpoints.integrations.test}${integrationId}`
    : null;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoized = useMemo(
    () => ({
      testResult: data || null,
      testLoading: isLoading,
      testError: error,
      testValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoized;
}

// ----------------------------------------------------------------------
// GOOGLE GMAIL: Send plain email (no invite/ICS)
export async function sendEmail(integrationId, toEmail, subject, bodyHtml, bodyText = '') {
  const payload = {
    integration_id: integrationId,
    to_email: toEmail,
    subject,
    body_html: bodyHtml,
    body_text: bodyText,
  };
  const res = await axiosInstance.post(endpoints.integrations.emailSend, payload);
  return res.data;
}

// ----------------------------------------------------------------------
// GOOGLE GMAIL: Send meeting-invite email with ICS attachment
export async function sendMeetingInvite(
  integrationId,
  toEmail,
  subject,
  bodyHtml,
  meetingTitle,
  startDatetime,
  endDatetime,
  organizerEmail,
  description = '',
  location = ''
) {
  const payload = {
    integration_id: integrationId,
    to_email: toEmail,
    subject,
    body_html: bodyHtml,
    meeting_title: meetingTitle,
    start_datetime: startDatetime,
    end_datetime: endDatetime,
    description,
    location,
    organizer_email: organizerEmail,
  };
  const res = await axiosInstance.post(
    endpoints.integrations.emailMeetingInvite,
    payload
  );
  return res.data;
}

// ----------------------------------------------------------------------
// GOOGLE INTEGRATION USAGE: Get email logs
export function useGetEmailLogs(storeId, options = {}) {
  const { limit = 50, offset = 0 } = options;
  const url = storeId
    ? `${endpoints.integrations.emailLogs}?store_id=${storeId}&limit=${limit}&offset=${offset}`
    : null;

  const { data, isLoading, error, isValidating } = useSWR(
    url,
    fetcher,
    swrOptions
  );

  const memoized = useMemo(
    () => ({
      emailLogs: data?.logs || [],
      emailLogsTotal: data?.total || 0,
      emailLogsLoading: isLoading,
      emailLogsError: error,
      emailLogsValidating: isValidating,
      emailLogsEmpty: !isLoading && !data?.logs?.length,
    }),
    [data?.logs, data?.total, error, isLoading, isValidating]
  );

  return memoized;
}

// ----------------------------------------------------------------------
// GOOGLE INTEGRATION USAGE: Get drive files (local database)
export function useGetDriveFiles(storeId, options = {}) {
  const { limit = 50, offset = 0 } = options;
  const url = storeId
    ? `${endpoints.integrations.driveFilesList}?store_id=${storeId}&limit=${limit}&offset=${offset}`
    : null;

  const { data, isLoading, error, isValidating } = useSWR(
    url,
    fetcher,
    swrOptions
  );

  const memoized = useMemo(
    () => ({
      driveFiles: data?.files || [],
      driveFilesTotal: data?.total || 0,
      driveFilesLoading: isLoading,
      driveFilesError: error,
      driveFilesValidating: isValidating,
      driveFilesEmpty: !isLoading && !data?.files?.length,
    }),
    [data?.files, data?.total, error, isLoading, isValidating]
  );

  return memoized;
}

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// GOOGLE INTEGRATION USAGE: Get integration usage stats
export async function getIntegrationUsageStats(integrationId, storeId) {
  try {
    const [emailLogsRes, driveFilesRes] = await Promise.all([
      axiosInstance.get(`${endpoints.integrations.emailLogs}?store_id=${storeId}&limit=1000`),
      axiosInstance.get(`${endpoints.integrations.driveFilesList}?store_id=${storeId}&limit=1000`)
    ]);

    const emailLogs = emailLogsRes.data.logs || [];
    const driveFiles = driveFilesRes.data.files || [];

    // Calculate statistics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const emailStats = {
      totalEmails: emailLogs.length,
      sentEmails: emailLogs.filter(log => log.status === 'sent').length,
      failedEmails: emailLogs.filter(log => log.status === 'failed').length,
      emailsLast7Days: emailLogs.filter(log => new Date(log.sent_at) >= sevenDaysAgo).length,
      emailsLast30Days: emailLogs.filter(log => new Date(log.sent_at) >= thirtyDaysAgo).length,
      meetingInvites: emailLogs.filter(log => log.has_ics_attachment).length,
    };

    const driveStats = {
      totalFiles: driveFiles.length,
      activeFiles: driveFiles.filter(file => file.is_active).length,
      totalSize: driveFiles.reduce((sum, file) => sum + (file.file_size || 0), 0),
      filesLast7Days: driveFiles.filter(file => new Date(file.created_at) >= sevenDaysAgo).length,
      filesLast30Days: driveFiles.filter(file => new Date(file.created_at) >= thirtyDaysAgo).length,
      fileTypes: driveFiles.reduce((types, file) => {
        types[file.file_type] = (types[file.file_type] || 0) + 1;
        return types;
      }, {}),
    };

    return {
      integrationId,
      storeId,
      email: emailStats,
      drive: driveStats,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching integration usage stats:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// GOOGLE DRIVE: Upload a file (caller must pass a FormData object)
export async function uploadToDrive(integrationId, formData, folderId = null) {
  // `formData` should already have been created and have a `file` field
  // If you want to append `folder_id`, do: formData.append('folder_id', folderId);
  if (folderId) {
    formData.append('folder_id', folderId);
  }

  // Note: Axios will automatically set `Content-Type: multipart/form-data`
  const url = `${endpoints.integrations.driveUpload}?integration_id=${integrationId}`;
  const res = await axiosInstance.post(url, formData);
  return res.data;
}

// ----------------------------------------------------------------------
// GOOGLE DRIVE: Create a new folder
export async function createDriveFolder(integrationId, folderName, parentFolderId = null) {
  const payload = {
    integration_id: integrationId,
    folder_name: folderName,
    parent_folder_id: parentFolderId,
  };
  const res = await axiosInstance.post(endpoints.integrations.driveCreateFolder, payload);
  return res.data;
}

// ----------------------------------------------------------------------
// GOOGLE DRIVE: List files in a folder (or root if no folderId)
export function useListDriveFiles(integrationId, folderId = null) {
  // Always call hooks unconditionally; SWR will skip if key is null
  const params = new URLSearchParams();
  if (integrationId) params.append('integration_id', integrationId);
  if (folderId) params.append('folder_id', folderId);
  const queryString = params.toString();
  const url = integrationId ? `${endpoints.integrations.driveFiles}?${queryString}` : null;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoized = useMemo(
    () => ({
      driveFiles: data?.files || [],
      driveFilesLoading: isLoading,
      driveFilesError: error,
      driveFilesValidating: isValidating,
      driveFilesEmpty: !isLoading && !data?.files?.length,
    }),
    [data?.files, error, isLoading, isValidating]
  );

  return memoized;
}

// GOOGLE DRIVE: List files directly from Google Drive API
// export function useListDriveFiles(integrationId, folderId = null) {
//   const url = integrationId
//     ? `${endpoints.integrations.driveFiles}?integration_id=${integrationId}${folderId ? `&folder_id=${folderId}` : ''}`
//     : null;

//   const { data, isLoading, error, isValidating } = useSWR(
//     url,
//     fetcher,
//     swrOptions
//   );

//   const memoized = useMemo(
//     () => ({
//       driveFiles: data?.files || [],
//       driveFilesLoading: isLoading,
//       driveFilesError: error,
//       driveFilesValidating: isValidating,
//     }),
//     [data?.files, error, isLoading, isValidating]
//   );

//   return memoized;
// }


// ----------------------------------------------------------------------
// JUMIA: Get data (shops, products, categories, brands, stock, etc.)
// Note: This is a POST endpoint; SWR is not ideal for POST. We expose it as an async function.
export async function getJumiaData(integrationId, dataType, { shopId = null, page = 1, size = 10 } = {}) {
  const payload = {
    integration_id: integrationId,
    data_type: dataType, // 'shops' | 'products' | 'categories' | 'brands' | 'stock'
    shop_id: shopId,
    page,
    size,
  };
  const res = await axiosInstance.post(endpoints.integrations.jumiaData, payload);
  return res.data;
}

// ----------------------------------------------------------------------
// JUMIA: Update data (stock, prices)
// Also a POST endpoint
export async function updateJumiaData(integrationId, updateType, productsArray) {
  const payload = {
    integration_id: integrationId,
    update_type: updateType, // 'stock' | 'prices'
    products: productsArray, // [{ sku, quantity, price, etc. }, …]
  };
  const res = await axiosInstance.post(endpoints.integrations.jumiaUpdate, payload);
  return res.data;
}

// ----------------------------------------------------------------------
// JUMIA: Get feed status by feed ID
export function useGetJumiaFeedStatus(integrationId, feedId) {
  // Always call hooks unconditionally; SWR will skip if key is null
  const url =
    integrationId && feedId
      ? `${endpoints.integrations.jumiaFeedStatus}${feedId}?integration_id=${integrationId}`
      : null;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoized = useMemo(
    () => ({
      feedStatus: data || null,
      feedStatusLoading: isLoading,
      feedStatusError: error,
      feedStatusValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoized;
}
