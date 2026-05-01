import { useEffect, useMemo, useState } from "react";
import { getClients } from "../../api/clientApi";
import { getAllCases } from "../../api/caseApi";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [clients, setClients] = useState({});
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState("");
  const [assignedFromFilter, setAssignedFromFilter] = useState("");
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

  const assignedToOptions = useMemo(
    () => [...new Set(clientList.map((client) => client.assigned_to).filter(Boolean))],
    [clientList]
  );

  const assignedFromOptions = useMemo(
    () => [...new Set(clientList.map((client) => client.assigned_from).filter(Boolean))],
    [clientList]
  );

  const normalize = (value) => String(value || "").toLowerCase().replace(/\s+/g, "");

  const getInitials = (value) =>
    String(value || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toLowerCase();

  const matchesSearch = (client) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    const compactQuery = normalize(query);

    return [client.id, client.name, client.phone].some(
      (value) =>
        String(value || "").toLowerCase().includes(query) ||
        normalize(value).includes(compactQuery)
    ) || getInitials(client.name).includes(compactQuery);
  };

  const filteredClients = clientList.filter((client) => {
    return (
      matchesSearch(client) &&
      (!assignedToFilter || client.assigned_to === assignedToFilter) &&
      (!assignedFromFilter || client.assigned_from === assignedFromFilter)
    );
  });

  const clearFilters = () => {
    setSearch("");
    setAssignedToFilter("");
    setAssignedFromFilter("");
  };

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

      <div className="dashboard-filters">
        <select
          className="input"
          value={assignedToFilter}
          onChange={(e) => setAssignedToFilter(e.target.value)}
        >
          <option value="">Assigned To</option>
          {assignedToOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <select
          className="input"
          value={assignedFromFilter}
          onChange={(e) => setAssignedFromFilter(e.target.value)}
        >
          <option value="">Assigned From</option>
          {assignedFromOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <button className="btn-outline" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

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
                <th>Assigned From</th>
                <th>Cases</th>
                <th>Added On</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredClients.map((c) => (
                <tr key={c.id}>
                  <td><HighlightedText text={c.id} query={search} /></td>

                  <td><HighlightedText text={c.name} query={search} /></td>

                  <td><HighlightedText text={c.phone} query={search} /></td>

                  <td>{c.assigned_to}</td>

                  <td>{c.assigned_from}</td>

                  <td>
                    <span className="badge">
                      {c.case_ids?.length || 0} cases
                    </span>
                  </td>

                  <td>{formatDate(c.created_at)}</td>

                  <td>
                    <button
                      className="view-case-btn"
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

function HighlightedText({ text, query }) {
  const value = String(text || "");
  const trimmedQuery = query.trim();

  if (!trimmedQuery) return value;

  const lowerValue = value.toLowerCase();
  const lowerQuery = trimmedQuery.toLowerCase();
  const compactQuery = trimmedQuery.toLowerCase().replace(/\s+/g, "");
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toLowerCase();

  const index = lowerValue.indexOf(lowerQuery);

  if (index >= 0) {
    return (
      <>
        {value.slice(0, index)}
        <mark className="search-highlight">{value.slice(index, index + trimmedQuery.length)}</mark>
        {value.slice(index + trimmedQuery.length)}
      </>
    );
  }

  if (initials.includes(compactQuery)) {
    const initialsToMark = new Set(compactQuery.split(""));

    return value.split(/(\s+)/).map((part, index) => {
      if (!part.trim()) return part;
      const first = part[0];

      return (
        <span key={`${part}-${index}`}>
          {initialsToMark.has(first.toLowerCase()) ? (
            <mark className="search-highlight">{first}</mark>
          ) : (
            first
          )}
          {part.slice(1)}
        </span>
      );
    });
  }

  return value;
}
