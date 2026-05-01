import './DocumentList.css';

const DocumentList = ({ documents, onToggle, onSelectAll }) => {
  const allSelected = documents.every(doc => doc.selected);

  return (
    <div className="form-section">
      <div className="document-list-header">
        <h2>Document List</h2>
        <button 
          type="button" 
          className="btn-select-all"
          onClick={onSelectAll}
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      
      <div className="document-table">
        <div className="document-row header">
          <div className="doc-name">Document Name</div>
          <div className="doc-select">Select</div>
        </div>

        {documents.map((doc, index) => (
          <div key={doc.id} className="document-row">
            <div className="doc-name">{doc.name}</div>
            <div className="doc-select">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={doc.selected}
                  onChange={(e) => onToggle(index, 'selected', e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">
                  {doc.selected ? 'Yes' : 'No'}
                </span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentList;