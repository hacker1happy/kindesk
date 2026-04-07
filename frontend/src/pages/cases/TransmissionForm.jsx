import { useParams } from "react-router-dom";

export default function TransmissionForm() {
  const { caseId } = useParams();

  return <h2>Transmission Form - {caseId}</h2>;
}