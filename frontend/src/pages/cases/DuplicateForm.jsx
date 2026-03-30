import { useParams } from "react-router-dom";

export default function DuplicateForm() {
  const { caseId } = useParams();

  return <h2>Duplicate Form - {caseId}</h2>;
}