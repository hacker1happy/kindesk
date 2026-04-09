import './CompanyInfo.css';

const CompanyInfo = ({ data, onChange }) => {
  return (
    <div className="form-section">
      <h2>Company's Information</h2>
      <div className="company-info-grid">
        <div className="company-info-item">
          <label>Name</label>
          <input
            type="text"
            value={data.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Enter company name"
          />
        </div>
        <div className="company-info-item">
          <label>Address</label>
          <textarea
            value={data.address || ''}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="Enter company address"
            rows="3"
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyInfo;