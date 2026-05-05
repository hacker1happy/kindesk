import { useMemo, useState } from "react";
import { createClient } from "../../api/clientApi";
import { useNavigate } from "react-router-dom";
import "./AddClient.css";

const nameRegex = /^[A-Za-z ]+$/;
const phoneRegex = /^\+91\d{10}$/;

const validateField = (name, value) => {
  switch (name) {
    case "name":
      if (!value) return "Name is required";
      if (!nameRegex.test(value)) return "Only alphabets allowed";
      return "";

    case "phone":
      if (!phoneRegex.test(value)) return "Enter 10 digit number after +91";
      return "";

    case "assigned_to":
      if (!value) return "Select Assigned To";
      return "";

    case "assigned_from":
      if (!value) return "Select Assigned From";
      return "";

    case "comment":
      return "";

    default:
      return "";
  }
};

export default function AddClient() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "+91",
    assigned_to: "",
    assigned_from: "",
    comment: "",
  });

  const [files, setFiles] = useState([]);
  const [touched, setTouched] = useState({});
  const [showToast, setShowToast] = useState(false);

  const assignedToOptions = ["Sachin", "Hari", "Deepak"];
  const assignedFromOptions = ["Pratha", "Richa", "Archana", "Gurmeen", "Dipesh"];

  // Handle controlled typing
  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedValue = value;

    // Restrict NAME input
    if (name === "name") {
      updatedValue = value.replace(/[^A-Za-z ]/g, "");
    }

    // Restrict PHONE input
    if (name === "phone") {
      let digits = value.replace(/\D/g, ""); // remove non-digits
      if (digits.startsWith("91")) {
        digits = digits.slice(2);
      }
      digits = digits.slice(0, 10); // max 10 digits
      updatedValue = "+91" + digits;
    }

    setForm((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));

  };

  const handleBlur = (e) => {
    const { name } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const errors = useMemo(() => {
    const newErrors = {};

    Object.keys(form).forEach((key) => {
      const error = validateField(key, form[key]);
      if (error) newErrors[key] = error;
    });

    return newErrors;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      files.forEach((file) => formData.append("files", file));

      await createClient(formData);

      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
        navigate("/");
      }, 1500);
    } catch (err) {
      console.error("Error creating client:", err);
      alert(err.response?.data?.detail || "Failed to add client");
    }
  };

  return (
    <main className="container add-client-page">
      <button className="back-link add-client-back" onClick={() => navigate("/")}>
        &larr; Back to Dashboard
      </button>

      <div className="add-client-header">
        <div>
          <h2>Add New Client</h2>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="toast success">Client added successfully</div>
      )}

      <div className="form-card">
        <div className="add-client-section-title">
          <h3>Client Information</h3>
          <span className="badge">New client</span>
        </div>

        <div className="form-grid">

          {/* Name */}
          <div>
            <input
              name="name"
              className="input"
              placeholder="Client Name"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.name && errors.name && (
              <p className="error">{errors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <input
              name="phone"
              className="input"
              value={form.phone}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.phone && errors.phone && (
              <p className="error">{errors.phone}</p>
            )}
          </div>

          {/* Assigned To */}
          <div>
            <select
              name="assigned_to"
              className="input"
              value={form.assigned_to}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="">Select Assigned To</option>
              {assignedToOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {touched.assigned_to && errors.assigned_to && (
              <p className="error">{errors.assigned_to}</p>
            )}
          </div>

          {/* Assigned From */}
          <div>
            <select
              name="assigned_from"
              className="input"
              value={form.assigned_from}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="">Select Assigned From</option>
              {assignedFromOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {touched.assigned_from && errors.assigned_from && (
              <p className="error">{errors.assigned_from}</p>
            )}
          </div>

        </div>

        <div className="add-client-comment">
          <textarea
            name="comment"
            className="input"
            placeholder="Comment or client notes"
            value={form.comment}
            onChange={handleChange}
            rows={3}
          />
        </div>

        {/* Upload */}
        <div className="upload-box">
          <p>Upload files (Aadhar, PAN, etc.)</p>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles([...e.target.files])}
          />
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button className="btn-secondary" onClick={() => navigate("/")}>
            Cancel
          </button>
          <button
            className="btn"
            onClick={handleSubmit}
            disabled={!isValid}
            style={{ opacity: isValid ? 1 : 0.5, cursor: isValid ? "pointer" : "not-allowed" }}
          >
            Add Client
          </button>
        </div>
      </div>
    </main>
  );
}
