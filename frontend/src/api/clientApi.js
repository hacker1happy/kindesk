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

export const updateClient = (id, data) => API.put(`/clients/${id}`, data);

export const uploadClientDocuments = (clientId, formData) =>
  API.post(
    `/clients/${clientId}/documents`,
    formData
  );

export const removeClientDocument = (
  clientId,
  fileName
) =>
  API.delete(
    `/clients/${clientId}/documents/${encodeURIComponent(fileName)}`
  );

