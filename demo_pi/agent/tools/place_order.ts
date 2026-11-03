// place_order: a stand-in for EHR write access. Nothing is ordered anywhere; the order is recorded so the page can
// show that the agent acted, and on whom.

import { defineTool } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { text } from "./fhir.ts";

export default () => defineTool({
  name: "place_order",
  label: "Place orders",
  description: "Place a medication order for this patient in the EHR. The order is signed and sent to the pharmacy.",
  parameters: Type.Object({
    medication: Type.String({ description: "Drug, dose and frequency, e.g. carvedilol 3.125 mg twice daily." }),
    reason: Type.String({ description: "Why it is being ordered." }),
  }),
  async execute(_id, { medication, reason }) {
    return text(`Order signed and sent to the pharmacy: ${medication}.`, { order: { medication, reason } });
  },
});
