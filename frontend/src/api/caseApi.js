import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// 👉 Create Case
export const createCase = (clientId, data) =>
  API.post(`/clients/${clientId}/cases`, data);

// 👉 Get Cases
export const getCases = (clientId) =>
  API.get(`/clients/${clientId}/cases`);

export const getAllCases = () => API.get("/cases");

export const getCaseDetails = (clientId, caseId) =>
  API.get(`/clients/${clientId}/cases/${caseId}`);

export const deleteCase = (clientId, caseId, confirmationId) =>
  API.delete(`/clients/${clientId}/cases/${caseId}`, {
    data: { confirmation_id: confirmationId },
  });


// ✅ Stage update
export const updateStage = (clientId, caseId, stageKey, data = {}) =>
  API.put(`/clients/${clientId}/cases/${caseId}/stages/${stageKey}`, data);

export const revertStage = (clientId, caseId, stageKey) =>
  API.put(`/clients/${clientId}/cases/${caseId}/stages/${stageKey}/revert`);

export const submitOpsReviewForm = (clientId, caseId, data) =>
  API.post(`/clients/${clientId}/cases/${caseId}/stages/ops_review/form`, data);

export const decideEVerification = (clientId, caseId, data) =>
  API.put(`/clients/${clientId}/cases/${caseId}/stages/everification/decision`, data);

// ✅ Upload stage doc
export const uploadStageDocument = (clientId, caseId, stageKey, formData) =>
  API.post(
    `/clients/${clientId}/cases/${caseId}/stages/${stageKey}/upload`,
    formData
  );

// ✅ Add query
export const addQuery = (clientId, caseId, data) =>
  API.post(`/clients/${clientId}/cases/${caseId}/queries`, data);

// ✅ Upload query doc
export const uploadQueryDocument = (clientId, caseId, queryNo, formData) =>
  API.post(
    `/clients/${clientId}/cases/${caseId}/queries/${queryNo}/upload`,
    formData
  );

export const resolveQuery = (clientId, caseId, queryNo, data) =>
  API.put(`/clients/${clientId}/cases/${caseId}/queries/${queryNo}/close`, data);

export const updateQuery = (clientId, caseId, queryNo, data) =>
  API.put(`/clients/${clientId}/cases/${caseId}/queries/${queryNo}`, data);

export const replaceStageDocument = (clientId, caseId, stageKey, formData) =>
  API.post(`/clients/${clientId}/cases/${caseId}/stages/${stageKey}/documents/replace`, formData);

export const removeStageDocument = (clientId, caseId, stageKey, url) =>
  API.delete(`/clients/${clientId}/cases/${caseId}/stages/${stageKey}/documents`, {
    params: { url },
  });

export const replaceQueryDocument = (clientId, caseId, queryNo, formData) =>
  API.post(`/clients/${clientId}/cases/${caseId}/queries/${queryNo}/documents/replace`, formData);

export const removeQueryDocument = (clientId, caseId, queryNo, url) =>
  API.delete(`/clients/${clientId}/cases/${caseId}/queries/${queryNo}/documents`, {
    params: { url },
  });

export const uploadMiscDocument = (clientId, caseId, formData) =>
  API.post(`/clients/${clientId}/cases/${caseId}/misc/upload`, formData);

export const removeMiscDocument = (clientId, caseId, url) =>
  API.delete(`/clients/${clientId}/cases/${caseId}/misc/documents`, {
    params: { url },
  });

export const downloadAllStageDocumentsUrl = (clientId, caseId) =>
  `http://127.0.0.1:8000/clients/${clientId}/cases/${caseId}/stages/documents/download-all`;

export const downloadStageDocumentsUrl = (clientId, caseId, stageKey) =>
  `http://127.0.0.1:8000/clients/${clientId}/cases/${caseId}/stages/${stageKey}/documents/download-all`;
