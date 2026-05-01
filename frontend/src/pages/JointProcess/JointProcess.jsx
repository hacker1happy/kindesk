import TransmissionLikeProcess from "../TransmissionProcess/TransmissionLikeProcess";
import { JOINT_DOCUMENTS } from "../TransmissionProcess/processConfig";

export default function JointProcess() {
  return (
    <TransmissionLikeProcess
      processName="joint"
      title="Joint Process"
      documents={JOINT_DOCUMENTS}
      draftLabel="joint process"
      successMessage="The selected joint process documents were generated successfully."
    />
  );
}
