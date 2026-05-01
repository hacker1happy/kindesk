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


// ✅ Stage update
export const updateStage = (clientId, caseId, stageKey) =>
  API.put(`/clients/${clientId}/cases/${caseId}/stages/${stageKey}`);

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

export const closeQuery = (clientId, caseId, queryNo) =>
  API.put(`/clients/${clientId}/cases/${caseId}/queries/${queryNo}/close`);

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
