import { useParams, useNavigate } from "react-router-dom";

export default function CaseInfo({ caseData, documentsReadyForGeneration = false }) {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const hasFormData = caseData.form_data && Object.keys(caseData.form_data).length > 0;
  const targetPath = `/clients/${clientId}/cases/${caseData.case_id}/${caseData.case_type.toLowerCase()}`;
  const statusTitle = hasFormData
    ? documentsReadyForGeneration
      ? "Documents Ready for Generation"
      : "Form Saved"
    : documentsReadyForGeneration
      ? "Ready to Fill and Generate"
      : "Form Can Be Saved";
  const statusText = hasFormData
    ? documentsReadyForGeneration
      ? "The required stages are complete. Review the saved form and generate documents when ready."
      : "The form data is saved. Generate Documents will unlock after Mail Sent to Client and Client Docs Received are completed."
    : documentsReadyForGeneration
      ? "The required stages are complete. Fill the form to generate documents."
      : "You can fill and save this form now. Document generation unlocks after the required stages are completed.";

  return (
    <section className="info-card case-form-panel">
      <div className={`form-readiness-card ${documentsReadyForGeneration ? "ready" : "saved"}`}>
        <span>
          {documentsReadyForGeneration
            ? "Ready"
            : hasFormData
              ? "Form Saved"
              : "Draft allowed"}
        </span>
        <div>
          <h3>{statusTitle}</h3>
          <p>{statusText}</p>
        </div>
      </div>

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
