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

export const updateCaseStatus = (clientId, caseId, status) =>
  API.put(`/clients/${clientId}/cases/${caseId}/status`, { status });
