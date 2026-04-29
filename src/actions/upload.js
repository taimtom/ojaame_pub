import axiosInstance, { endpoints } from 'src/utils/axios';

/**
 * uploadFile - Uploads a file via S3 presigned PUT when configured, else local multipart.
 *
 * @param {File} file - The file object (blob) to upload.
 * @param {string} name - The product name used to generate a unique filename.
 * @returns {Promise<string>} - Resolves with the uploaded file URL.
 */
export async function uploadFile(file, name) {
  const contentType = file.type || 'application/octet-stream';

  try {
    const presignRes = await axiosInstance.post(
      endpoints.uploads.presign,
      {
        name,
        contentType,
        ...(file.name ? { filename: file.name } : {}),
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { uploadUrl, fileUrl, headers: putHeaders } = presignRes.data;

    const res = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: putHeaders || { 'Content-Type': contentType },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Storage upload failed (${res.status}): ${text.slice(0, 200)}`);
    }

    return fileUrl;
  } catch (error) {
    const status = error._httpStatus ?? error.response?.status;
    if (status === 503) {
      return uploadFileLocal(file, name);
    }
    console.error('Error uploading file:', error);
    throw error;
  }
}

async function uploadFileLocal(file, name) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);

  const response = await axiosInstance.post(endpoints.uploads.upload, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.fileUrl;
}
