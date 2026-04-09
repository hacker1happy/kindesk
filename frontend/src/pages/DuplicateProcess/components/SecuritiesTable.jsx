import './SecuritiesTable.css';

const SecuritiesTable = ({ securities, onAdd, onRemove, onChange, totalShares }) => {

  // Allow only digits
  const handleNumericChange = (index, field, value) => {
    const numericValue = value.replace(/\D/g, ''); // remove everything except 0-9
    onChange(index, field, numericValue);
  };

  // Block invalid key presses
  const blockInvalidKeys = (e) => {
    if (
      ['e', 'E', '+', '-', '.', ','].includes(e.key)
    ) {
      e.preventDefault();
    }
  };

  return (
    <div className="form-section">
      <div className="section-header">
        <h2>Securities Information</h2>
        {securities.length < 4 && (
          <button type="button" className="btn-add-security" onClick={onAdd}>
            + Add Security
          </button>
        )}
      </div>

      <div className="securities-container">
        <table className="securities-table">
          <thead>
            <tr>
              <th>Sr No.</th>
              <th>Certificate Number</th>
              <th>Distinctive Number From</th>
              <th>Distinctive Number To</th>
              <th>Shares</th>
              {securities.length > 1 && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {securities.map((security, index) => (
              <tr key={index}>
                <td>{index + 1}</td>

                {/* Certificate Number */}
                <td>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={security.certificateNumber || ''}
                    onChange={(e) =>
                      handleNumericChange(index, 'certificateNumber', e.target.value)
                    }
                    onKeyDown={blockInvalidKeys}
                    placeholder="Enter certificate no."
                  />
                </td>

                {/* Distinctive From */}
                <td>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={security.distinctiveFrom || ''}
                    onChange={(e) =>
                      handleNumericChange(index, 'distinctiveFrom', e.target.value)
                    }
                    onKeyDown={blockInvalidKeys}
                    placeholder="From"
                  />
                </td>

                {/* Distinctive To */}
                <td>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={security.distinctiveTo || ''}
                    onChange={(e) =>
                      handleNumericChange(index, 'distinctiveTo', e.target.value)
                    }
                    onKeyDown={blockInvalidKeys}
                    placeholder="To"
                  />
                </td>

                {/* Shares */}
                <td>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={security.shares || ''}
                    onChange={(e) =>
                      handleNumericChange(index, 'shares', e.target.value)
                    }
                    onKeyDown={blockInvalidKeys}
                    placeholder="Enter shares"
                  />
                </td>

                {securities.length > 1 && (
                  <td>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => onRemove(index)}
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="total-shares">
          <strong>Total number of shares:</strong> {totalShares}
        </div>
      </div>
    </div>
  );
};

export default SecuritiesTable;