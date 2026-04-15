import { useParams, useNavigate } from "react-router-dom";

export default function CaseInfo({ caseData }) {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const hasFormData =
    caseData.form_data && Object.keys(caseData.form_data).length > 0;

  const handleFillForm = () => {
    navigate(`/clients/${clientId}/cases/${caseData.case_id}/${caseData.case_type.toLowerCase()}`);
  };


  const handleEditForm = () => {
    navigate(`/clients/${clientId}/cases/${caseData.case_id}/${caseData.case_type.toLowerCase()}`);
  };

  return (
    <div className="card center">
      {!hasFormData ? (
        <>
          <p>No form data available</p>
          <button onClick={handleFillForm}>
            Fill Case Form
          </button>
        </>
      ) : (
        <>
          <p>Form already filled for this case</p>
          <div className="button-group">
            <button onClick={handleEditForm} className="btn btn-primary">
              Edit Form
            </button>
          </div>
        </>
      )}
    </div>
  );
}