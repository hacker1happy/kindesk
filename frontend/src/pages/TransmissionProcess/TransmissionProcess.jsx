import TransmissionLikeProcess from "./TransmissionLikeProcess";
import { TRANSMISSION_DOCUMENTS } from "./processConfig";

export default function TransmissionProcess() {
  return (
    <TransmissionLikeProcess
      processName="transmission"
      title="Transmission Process"
      documents={TRANSMISSION_DOCUMENTS}
      draftLabel="transmission process"
      successMessage="The selected transmission process documents were generated successfully."
    />
  );
}
