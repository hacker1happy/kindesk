export default function Documents({ caseData }) {
  return (
    <div className="card center">
      {caseData.files.length === 0 ? (
        <p>No documents generated yet.</p>
      ) : (
        caseData.files.map((doc, i) => <p key={i}>{doc}</p>)
      )}
    </div>
  );
}