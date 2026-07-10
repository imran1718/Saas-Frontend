import { useState } from 'react';
import { apiClient } from './apiClient';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (url: string, file: File, fieldName: string = 'file', extraData: Record<string, string> = {}) => {
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append(fieldName, file);
    
    Object.entries(extraData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const response = await apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return { uploadFile, isUploading, uploadProgress };
};
