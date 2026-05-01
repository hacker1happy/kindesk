import './RTAInfo.css';

const RTAInfo = ({ data, onChange }) => {
  return (
    <div className="form-section">
      <h2>RTA's Information</h2>
      <div className="rta-info-grid">
        <div className="rta-info-item">
          <label>Name</label>
          <input
            type="text"
            value={data.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Enter RTA name"
          />
        </div>
        <div className="rta-info-item">
          <label>Address</label>
          <textarea
            value={data.address || ''}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="Enter RTA address"
            rows="3"
          />
        </div>
      </div>
    </div>
  );
};

export default RTAInfo;