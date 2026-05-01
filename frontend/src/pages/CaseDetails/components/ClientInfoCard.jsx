export default function ClientInfoCard({ client }) {
  return (
    <div className="card">
      <h3>Client Information</h3>

      <div className="grid">
        <div>
          <p>Client Name</p>
          <strong>{client.name}</strong>
        </div>

        <div>
          <p>Client ID</p>
          <strong>{client.id}</strong>
        </div>

        <div>
          <p>Phone</p>
          <strong>{client.phone}</strong>
        </div>
      </div>
    </div>
  );
}