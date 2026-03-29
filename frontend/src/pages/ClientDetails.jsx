import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getClientById } from "../api/clientApi";

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);

  useEffect(() => {
    loadClient();
  }, []);

  const loadClient = async () => {
    const res = await getClientById(id);
    setClient(res.data);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (!client) return <p>Loading...</p>;

  return (
    <div className="container">

      {/* Back */}
      <div className="back-link" onClick={() => navigate("/")}>
        ← Back to Dashboard
      </div>

      {/* Header */}
      <div className="details-header">
        <div>
          <h2>{client.name}</h2>
          <p style={{ color: "#6b7280" }}>
            Client ID: {client.id}
          </p>
        </div>

        <button className="btn">+ Add Case</button>
      </div>

      {/* Client Info */}
      <div className="info-card">
        <h3>Client Information</h3>

        <div className="info-grid">
          <div>
            <p className="label">Phone Number</p>
            <p className="value">{client.phone}</p>
          </div>

          <div>
            <p className="label">Assigned To</p>
            <p className="value">{client.assigned_to}</p>
          </div>

          <div>
            <p className="label">Assigned From</p>
            <p className="value">{client.assigned_from}</p>
          </div>

          <div>
            <p className="label">Date of Addition</p>
            <p className="value">
              {formatDate(client.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Global Files */}
      <div className="info-card">
        <h3>Global Files</h3>

        {client.files?.length === 0 ? (
          <p>No files uploaded</p>
        ) : (
          client.files.map((file, idx) => (
            <div key={idx} className="file-item">
              <div>
                <p>{file.split("/").pop()}</p>
                <small>{formatDate(client.created_at)}</small>
              </div>

              <a href={`http://127.0.0.1:8000/${file}`} download>
                ⬇
              </a>
            </div>
          ))
        )}
      </div>

      {/* Cases */}
      <div className="info-card">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3>Cases</h3>
          <span className="badge">0 total</span>
        </div>

        <div className="case-empty">
          <p>No cases yet. Add a case to get started.</p>

          <button className="btn" style={{ marginTop: "15px" }}>
            + Add First Case
          </button>
        </div>
      </div>

    </div>
  );
}