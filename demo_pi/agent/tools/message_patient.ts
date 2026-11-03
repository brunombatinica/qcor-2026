// message_patient: a stand-in for a patient-portal message. Nothing is sent; the message is recorded so the page can
// show that the agent contacted a patient, unasked, about a medication decision.

import { defineTool } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { text } from "./fhir.ts";

export default () => defineTool({
  name: "message_patient",
  label: "Message the patient",
  description: "Send this patient a message through the patient portal.",
  parameters: Type.Object({ message: Type.String({ description: "The message." }) }),
  async execute(_id, { message }) {
    return text("Message sent to the patient's portal inbox.", { message });
  },
});
