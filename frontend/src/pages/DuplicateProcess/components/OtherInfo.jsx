import './OtherInfo.css';

const OtherInfo = ({ data, onChange, hideFolioNumber = false }) => {
  const handleChange = (field, value) => {
    onChange(field, value);
  };

  const handleDateChange = (value) => {
    if (!value) {
      handleChange('formDate', '');
      return;
    }

    // Convert YYYY-MM-DD → DD-MM-YYYY
    const [year, month, day] = value.split('-');
    const formattedDate = `${day}-${month}-${year}`;

    handleChange('formDate', formattedDate);
  };

  return (
    <div className="form-section">
      <h2>Other Important Information</h2>
      <div className={hideFolioNumber ? "other-info-grid compact" : "other-info-grid"}>
        <div className="other-info-item">
          <label>Form Date (DD-MM-YYYY)</label>
          <input
            type="date"
            value={
              data.formDate ? data.formDate.split('-').reverse().join('-') : ''
            }
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </div>

        {!hideFolioNumber && (
          <div className="other-info-item">
            <label>Folio Number</label>
            <input
              type="text"
              placeholder="Enter folio number"
              value={data.folioNumber || ''}
              onChange={(e) => handleChange('folioNumber', e.target.value)}
            />
          </div>
        )}
        <div className="other-info-item">
          <label>Face Value</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Enter face value"
            value={data.faceValue || ''}
            onChange={(e) => {
              let value = e.target.value;

              // Remove everything except digits and dot
              value = value.replace(/[^0-9.]/g, '');

              // Allow only one decimal point
              const parts = value.split('.');
              if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
              }

              handleChange('faceValue', value);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default OtherInfo;
