import axiosInstance, { endpoints } from 'src/utils/axios';

/**
 * uploadFile - Uploads a file to the backend and returns the file URL.
 *
 * @param {File} file - The file object (blob) to upload.
 * @param {string} name - The product name used to generate a unique filename.
 * @returns {Promise<string>} - Resolves with the uploaded file URL.
 */
export async function uploadFile(file, name) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);

  try {
    const response = await axiosInstance.post(endpoints.uploads.upload, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // Return the file URL from the key "fileUrl" as per the backend response
    return response.data.fileUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}
