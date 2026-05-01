import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});


export const getCaseDocuments = (clientId, caseId) =>
  API.get(`/clients/${clientId}/cases/${caseId}/files`);

export const uploadCaseDocument = (clientId, caseId, formData) =>
  API.post(
    `/clients/${clientId}/cases/${caseId}/upload`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

export const deleteCaseDocument = (clientId, caseId, filename) =>
  API.delete(`/clients/${clientId}/cases/${caseId}/file`, {
    params: { filename },
  });

export const downloadAllCaseDocumentsUrl = (clientId, caseId) =>
  `http://127.0.0.1:8000/clients/${clientId}/cases/${caseId}/files/download-all`;
