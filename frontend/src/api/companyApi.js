import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

/**
 * 🔍 Fetch companies (search-based)
 * @param {string} search - search text for company name
 */
export const fetchCompanies = (search = "") => {
  return API.get("/companies", {
    params: {
      search, // matches FastAPI Query param
      limit: 50, // optional (aligned with backend)
    },
  });
};


/**
 * 📄 Get single company by ID
 * Useful for future (prefill, edit case, etc.)
 */
export const getCompanyById = (companyId) => {
  return API.get(`/companies/${companyId}`);
};


/**
 * 🔎 Get company by exact name (optional utility)
 */
export const getCompanyByName = (companyName) => {
  return API.get(`/companies/by-name/${encodeURIComponent(companyName)}`);
};


/**
 * 🏢 Get RTA details for a company (future use)
 */
export const getCompanyRTA = (companyId) => {
  return API.get(`/companies/${companyId}/rta`);
};


/**
 * 📋 Get all RTAs (optional)
 */
export const fetchRTAs = () => {
  return API.get("/rtas");
};