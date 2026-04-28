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
export const addQuery = (clientId, caseId) =>
  API.post(`/clients/${clientId}/cases/${caseId}/queries`);

// ✅ Upload query doc
export const uploadQueryDocument = (clientId, caseId, queryNo, formData) =>
  API.post(
    `/clients/${clientId}/cases/${caseId}/queries/${queryNo}/upload`,
    formData
  );