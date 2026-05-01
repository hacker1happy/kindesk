export const DEFAULT_LEGAL_HEIR = {
  personalDetails: {},
  contactDetails: {},
  bankDetails: {},
};

export const DEFAULT_SHAREHOLDER = {
  name: "",
  dateOfDemise: "",
};

export const DEFAULT_SECURITY = {
  certificateNumber: "",
  distinctiveFrom: "",
  distinctiveTo: "",
  shares: "",
};

export const TRANSMISSION_DOCUMENTS = [
  { id: "auth-letter", name: "Authorization Letter", selected: false },
  { id: "request-letter", name: "Request Letter", selected: false },
  { id: "isr-1", name: "ISR 1", selected: false },
  { id: "sh-13", name: "SH - 13", selected: false },
  { id: "isr5-annexure-c", name: "ISR5 - Annexure C", selected: false },
  { id: "annexure-d-heir-1", name: "Annexure D - Affidavit Legal Heir 1", heirIndex: 1, selected: false },
  { id: "annexure-d-heir-2", name: "Annexure D - Affidavit Legal Heir 2", heirIndex: 2, selected: false },
  { id: "annexure-d-heir-3", name: "Annexure D - Affidavit Legal Heir 3", heirIndex: 3, selected: false },
  { id: "annexure-e-indemnity", name: "Annexure E - Indemnity from Legal Heir", selected: false },
];

export const JOINT_DOCUMENTS = [
  { id: "auth-letter", name: "Authorization Letter", selected: false },
  { id: "request-letter", name: "Request Letter", selected: false },
  { id: "isr-1", name: "ISR 1", selected: false },
  { id: "sh-13", name: "SH - 13", selected: false },
  { id: "isr-4", name: "ISR 4", selected: false },
  { id: "form-a", name: "Form A", selected: false },
  { id: "form-b-indemnity", name: "Form B Indemnity", selected: false },
  { id: "isr5-annexure-c", name: "ISR5 - Annexure C", selected: false },
  { id: "annexure-d-heir-1", name: "Annexure D - Affidavit Legal Heir 1", heirIndex: 1, selected: false },
  { id: "annexure-d-heir-2", name: "Annexure D - Affidavit Legal Heir 2", heirIndex: 2, selected: false },
  { id: "annexure-d-heir-3", name: "Annexure D - Affidavit Legal Heir 3", heirIndex: 3, selected: false },
  { id: "annexure-e-indemnity", name: "Annexure E - Indemnity from Legal Heir", selected: false },
];
