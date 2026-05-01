import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// 👉 Form Data
export const saveFormData = (clientId, caseId, data) =>
  API.put(`/clients/${clientId}/cases/${caseId}/form`, data);

export const getFormData = (clientId, caseId) =>
  API.get(`/clients/${clientId}/cases/${caseId}/form`);

export const generateDocuments = async (
  clientId,
  caseId,
  process,
  formData,
  selectedFiles = []
) => {
  const response = await fetch(
    `http://127.0.0.1:8000/generate/${clientId}/${caseId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        process,
        data: formData,
        selected_files: selectedFiles,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to generate documents');
  }

  return result;
};