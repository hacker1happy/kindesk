export default function CaseHeader({ caseData }) {
  return (
    <div className="card">
      <h2>Case Details</h2>

      <p>
        Case ID: {caseData.case_id} | Folio: {caseData.folio_number} | Company: {caseData.company}
      </p>

      <div>
        <span className="badge">{caseData.case_type}</span>
        <span className="badge">{caseData.status}</span>
      </div>
    </div>
  );
}