import { useNavigate } from "react-router-dom";

export default function CaseInfo({ caseData }) {
  const navigate = useNavigate();

  const handleFillForm = () => {
    navigate(`/cases/${caseData.case_type}/${caseData.case_id}`);
  };

  return (
    <div className="card center">
      {Object.keys(caseData.form_data).length === 0 ? (
        <>
          <p>No form data available</p>
          <button onClick={handleFillForm}>
            Fill Case Form
          </button>
        </>
      ) : (
        <pre>{JSON.stringify(caseData.form_data, null, 2)}</pre>
      )}
    </div>
  );
}