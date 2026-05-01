import { useParams, useNavigate } from "react-router-dom";

export default function CaseInfo({ caseData }) {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const hasFormData = caseData.form_data && Object.keys(caseData.form_data).length > 0;
  const targetPath = `/clients/${clientId}/cases/${caseData.case_id}/${caseData.case_type.toLowerCase()}`;

  return (
    <section className="info-card case-form-panel">
      {hasFormData ? (
        <>
          <h3>Form already filled for this case</h3>
          <p>You can review or update the saved process information.</p>
          <button onClick={() => navigate(targetPath)} className="btn">
            Edit Form
          </button>
        </>
      ) : (
        <>
          <h3>No form data available</h3>
          <p>Start the case process form to generate the required documents.</p>
          <button onClick={() => navigate(targetPath)} className="btn">
            Fill Case Form
          </button>
        </>
      )}
    </section>
  );
}
