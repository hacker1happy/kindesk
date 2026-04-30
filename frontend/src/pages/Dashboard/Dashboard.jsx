import { useEffect, useMemo, useState } from "react";
import { getClients } from "../../api/clientApi";
import { getAllCases } from "../../api/caseApi";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [clients, setClients] = useState({});
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const [clientsRes, casesRes] = await Promise.all([
      getClients(),
      getAllCases(),
    ]);

    setClients(clientsRes.data || {});
    setCases(casesRes.data || []);
  };

  // Convert object -> array
  const clientList = useMemo(() => {
    return Object.entries(clients).map(([id, client]) => ({
      id,
      ...client,
    }));
  }, [clients]);

  // Search filter
  const filteredClients = clientList.filter((c) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return (
      String(c.id || "").toLowerCase().includes(query) ||
      String(c.name || "").toLowerCase().includes(query) ||
      String(c.phone || "").toLowerCase().includes(query)
    );
  });

  // Stats
  const totalClients = clientList.length;

  const totalCases = cases.length;
  const activeCases = cases.filter(
    (caseItem) => (caseItem.status || "").toLowerCase() !== "closed"
  ).length;

  return (
    <div className="container">

      {/* Header */}
      <div className="header">
        <h1>TrackSure System</h1>

        <button
          className="btn"
          onClick={() => navigate("/clients/new")}
        >
          + Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="card">
          <h3>Total Clients</h3>
          <p>{totalClients}</p>
        </div>

        <div className="card">
          <h3>Total Cases</h3>
          <p>{totalCases}</p>
        </div>

        <div className="card">
          <h3>Active Cases</h3>
          <p>{activeCases}</p>
        </div>
      </div>

      {/* Search */}
      <input
        className="search-box"
        placeholder="Search clients by name, ID, or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Client List */}
      <div className="table-card">
        <h3 style={{ marginBottom: "10px" }}>Clients</h3>

        {filteredClients.length === 0 ? (
          <div className="client-box">
            <p>No clients found.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Client ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Assigned To</th>
                <th>Cases</th>
                <th>Added On</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredClients.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>

                  <td>{c.name}</td>

                  <td>{c.phone}</td>

                  <td>{c.assigned_to}</td>

                  <td>
                    <span className="badge">
                      {c.case_ids?.length || 0} cases
                    </span>
                  </td>

                  <td>{formatDate(c.created_at)}</td>

                  <td>
                    <button
                      className="btn-outline"
                      onClick={() => navigate(`/clients/${c.id}`)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
