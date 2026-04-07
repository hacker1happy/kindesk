import { useParams } from "react-router-dom";

export default function JointForm() {
  const { caseId } = useParams();

  return <h2>Joint Form - {caseId}</h2>;
}