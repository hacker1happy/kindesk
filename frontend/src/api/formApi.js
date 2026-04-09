import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// 👉 Form Data
export const saveFormData = (clientId, caseId, data) =>
  API.put(`/clients/${clientId}/cases/${caseId}/form`, data);

export const getFormData = (clientId, caseId) =>
  API.get(`/clients/${clientId}/cases/${caseId}/form`);

export const generateDocuments = async (clientId, caseId, process, formData, selectedFiles = []) => {
  try {
    console.log('Submitting form data:', { process, formData, selectedFiles });
    const response = await fetch(`http://127.0.0.1:8000/generate/${clientId}/${caseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        process,
        data: formData,
        selected_files: selectedFiles,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate documents');
    }

    // Get the blob from response
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `documents_${process}_${Date.now()}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Failed to generate documents:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to generate documents');
  }
};