import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const getClients = () => API.get("/clients");

export const createClient = (formData) =>
  API.post("/clients", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getClientById = (id) => API.get(`/clients/${id}`);

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