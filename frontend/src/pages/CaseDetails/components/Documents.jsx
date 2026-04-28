import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getCaseDocuments,
  uploadCaseDocument,
  deleteCaseDocument,
} from "../../../api/caseDocuments";

export default function Documents() {
  const { clientId, caseId } = useParams();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // ✅ Fetch documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await getCaseDocuments(clientId, caseId);
      setFiles(res.data.files || []);
    } catch (err) {
      console.error("Error fetching documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [clientId, caseId]);

  // ✅ Upload handler
  const handleUpload = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles.length) return;

    const formData = new FormData();
    for (let file of selectedFiles) {
      formData.append("files", file);
    }

    try {
      setUploading(true);
      const res = await uploadCaseDocument(clientId, caseId, formData);

      // Append new files
      setFiles((prev) => [...prev, ...(res.data.files || [])]);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Delete handler
  const handleDelete = async (file) => {
    try {
      const filename = file.url.split("/").pop();

      await deleteCaseDocument(clientId, caseId, filename);

      setFiles((prev) => prev.filter((f) => f.url !== file.url));
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed");
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h2>Documents</h2>

        <label className="btn">
          {uploading ? "Uploading..." : "Upload"}
          <input type="file" multiple hidden onChange={handleUpload} />
        </label>
      </div>

      {/* Loading */}
      {loading ? (
        <p>Loading documents...</p>
      ) : files.length === 0 ? (
        <p>No documents found.</p>
      ) : (
        <ul>
          {files.map((doc, i) => (
            <li
              key={i}
              className="flex justify-between items-center mb-2"
            >
              <a href={`http://127.0.0.1:8000${doc.url}`} target="_blank" rel="noreferrer">
                {doc.name}
              </a>

              <button
                className="btn btn-danger"
                onClick={() => handleDelete(doc)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}