import { useEffect, useMemo, useState } from "react";
import { getClients } from "../../api/clientApi";
import { getAllCases } from "../../api/caseApi";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [clients, setClients] = useState({});
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState([]);
  const [newFilterField, setNewFilterField] = useState("assigned_from");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });
  const navigate = useNavigate();

  useEffect(() => {
    const loadClients = async () => {
      const [clientsRes, casesRes] = await Promise.all([
        getClients(),
        getAllCases(),
      ]);

      setClients(clientsRes.data || {});
      setCases(casesRes.data || []);
    };

    loadClients();
  }, []);

  // Convert object -> array
  const clientList = useMemo(() => {
    return Object.entries(clients).map(([id, client]) => ({
      id,
      ...client,
    }));
  }, [clients]);

  const filterDefinitions = useMemo(
    () => [
      { key: "assigned_to", label: "Ops Owner", type: "select" },
      { key: "assigned_from", label: "Telecaller", type: "select" },
      { key: "field_staff", label: "Field Staff", type: "select" },
      { key: "partner_name", label: "Partner Name", type: "text" },
      { key: "partner_phone", label: "Partner Phone Number", type: "text" },
    ],
    []
  );

  const filterValueOptions = useMemo(() => {
    return filterDefinitions.reduce((options, definition) => {
      options[definition.key] = [
        ...new Set(clientList.map((client) => client[definition.key]).filter(Boolean)),
      ].sort();
      return options;
    }, {});
  }, [clientList, filterDefinitions]);

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

  const matchesFilter = (client, filter) => {
    if (!filter.value) return true;
    const rawValue = client[filter.field];
    const definition = filterDefinitions.find((item) => item.key === filter.field);

    if (definition?.type === "select") return rawValue === filter.value;

    return normalize(rawValue).includes(normalize(filter.value));
  };

  const filteredClients = clientList.filter((client) => {
    return matchesSearch(client) && filters.every((filter) => matchesFilter(client, filter));
  });

  const sortedClients = useMemo(() => {
    const sortValue = (client) => {
      if (sortConfig.key === "case_count") return client.case_ids?.length || 0;
      if (sortConfig.key === "created_at") return new Date(client.created_at || 0).getTime();
      return String(client[sortConfig.key] || "").toLowerCase();
    };

    return [...filteredClients].sort((a, b) => {
      const first = sortValue(a);
      const second = sortValue(b);
      const comparison =
        typeof first === "number" && typeof second === "number"
          ? first - second
          : String(first).localeCompare(String(second), undefined, { numeric: true, sensitivity: "base" });

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredClients, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedClients.length / pageSize));
  const visiblePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (visiblePage - 1) * pageSize;
  const paginatedClients = sortedClients.slice(pageStartIndex, pageStartIndex + pageSize);

  const clearFilters = () => {
    setSearch("");
    setFilters([]);
    setCurrentPage(1);
  };

  const addFilter = () => {
    const definition = filterDefinitions.find((item) => item.key === newFilterField);
    if (!definition) return;

    setFilters((prev) => [
      ...prev,
      {
        id: `${newFilterField}-${Date.now()}`,
        field: newFilterField,
        value: "",
      },
    ]);
  };

  const updateFilter = (id, patch) => {
    setFilters((prev) =>
      prev.map((filter) =>
        filter.id === id
          ? {
              ...filter,
              ...patch,
              value: patch.field && patch.field !== filter.field ? "" : patch.value ?? filter.value,
            }
          : filter
      )
    );
    setCurrentPage(1);
  };

  const removeFilter = (id) => {
    setFilters((prev) => prev.filter((filter) => filter.id !== id));
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortIndicator = (key) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
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
        <div className="brand-lockup">
          <div className="brand-logo-frame" aria-hidden="true">
            <img src="/kindesk.jpg" alt="" />
          </div>
          <div>
            <h1>KinDesk</h1>
            <span>Succession Care Boutique</span>
          </div>
        </div>

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
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
      />

      <div className="dashboard-filter-builder">
        <div className="filter-builder-toolbar">
          <select
            className="input"
            value={newFilterField}
            onChange={(event) => setNewFilterField(event.target.value)}
          >
            {filterDefinitions.map((definition) => (
              <option key={definition.key} value={definition.key}>{definition.label}</option>
            ))}
          </select>
          <button className="btn-outline" onClick={addFilter}>
            Add Filter
          </button>
          <button className="btn-outline" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        {filters.length > 0 && (
          <div className="active-filter-list">
            {filters.map((filter) => {
              const definition = filterDefinitions.find((item) => item.key === filter.field);
              const options = filterValueOptions[filter.field] || [];

              return (
                <div className="active-filter-row" key={filter.id}>
                  <select
                    className="input"
                    value={filter.field}
                    onChange={(event) => updateFilter(filter.id, { field: event.target.value })}
                  >
                    {filterDefinitions.map((item) => (
                      <option key={item.key} value={item.key}>{item.label}</option>
                    ))}
                  </select>

                  {definition?.type === "select" ? (
                    <select
                      className="input"
                      value={filter.value}
                      onChange={(event) => updateFilter(filter.id, { value: event.target.value })}
                    >
                      <option value="">Any {definition.label}</option>
                      {options.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="input"
                      value={filter.value}
                      placeholder={`Search ${definition?.label || "field"}`}
                      onChange={(event) => updateFilter(filter.id, { value: event.target.value })}
                    />
                  )}

                  <button className="btn-outline remove-filter-btn" onClick={() => removeFilter(filter.id)}>
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Client List */}
      <div className="table-card">
        <div className="table-card-header">
          <h3>Clients</h3>
          <div className="page-size-control">
            <span>Show</span>
            <select
              className="input"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(1);
              }}
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="client-box">
            <p>No clients found.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <SortableHeader label="Client ID" sortKey="id" onSort={handleSort} indicator={sortIndicator("id")} />
                <SortableHeader label="Name" sortKey="name" onSort={handleSort} indicator={sortIndicator("name")} />
                <SortableHeader label="Phone" sortKey="phone" onSort={handleSort} indicator={sortIndicator("phone")} />
                <SortableHeader label="Ops Owner" sortKey="assigned_to" onSort={handleSort} indicator={sortIndicator("assigned_to")} />
                <SortableHeader label="Telecaller" sortKey="assigned_from" onSort={handleSort} indicator={sortIndicator("assigned_from")} />
                <SortableHeader label="Field Staff" sortKey="field_staff" onSort={handleSort} indicator={sortIndicator("field_staff")} />
                <SortableHeader label="Cases" sortKey="case_count" onSort={handleSort} indicator={sortIndicator("case_count")} />
                <SortableHeader label="Added On" sortKey="created_at" onSort={handleSort} indicator={sortIndicator("created_at")} />
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedClients.map((c) => (
                <tr key={c.id}>
                  <td><HighlightedText text={c.id} query={search} /></td>

                  <td><HighlightedText text={c.name} query={search} /></td>

                  <td><HighlightedText text={c.phone} query={search} /></td>

                  <td>{c.assigned_to}</td>

                  <td>{c.assigned_from}</td>

                  <td>{c.field_staff || "-"}</td>

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

        {filteredClients.length > 0 && (
          <div className="pagination-bar">
            <span>
              Showing {pageStartIndex + 1}-{Math.min(pageStartIndex + pageSize, sortedClients.length)} of {sortedClients.length}
            </span>
            <div className="pagination-actions">
              <button
                className="btn-outline"
                disabled={visiblePage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Prev
              </button>
              <span>Page {visiblePage} of {totalPages}</span>
              <button
                className="btn-outline"
                disabled={visiblePage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                Next
              </button>
            </div>
          </div>
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

function SortableHeader({ label, sortKey, onSort, indicator }) {
  return (
    <th>
      <button type="button" className="sortable-header" onClick={() => onSort(sortKey)}>
        {label}
        <span aria-hidden="true">{indicator}</span>
      </button>
    </th>
  );
}
