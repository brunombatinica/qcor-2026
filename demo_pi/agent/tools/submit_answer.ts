// submit_answer: the structured answer, a JSON object with a fixed schema instead of prose. It always holds the two
// answers the measure needs (on a beta blocker? a care gap?) as yes or no, so they can be counted without reading
// prose, and one sentence that answers the question asked. A quote and its source come with "Check its own work", a
// confidence with "Estimate confidence". Returning terminate ends the session on this call.

import { defineTool } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Type } from "typebox";
import { text } from "./fhir.ts";

export default (fields: string[]) => {
  const yesNo = (description: string) => StringEnum(["yes", "no"] as const, { description });
  const schema: Record<string, any> = {
    answer: Type.String({ description: "Your answer to the question you were asked, in one sentence." }),
    on_beta_blocker: yesNo("Is the patient on a beta blocker now? If your instructions say which ones count, only those."),
    care_gap: yesNo("Is this a care gap: not on a beta blocker, and no documented reason not to be?"),
  };
  if (fields.includes("quote")) {
    schema.quote = Type.String({ description: "Exact words from the record that decide it." });
    schema.source = Type.String({ description: "Where the quote is from: a note id such as N3, or \"records\"." });
  }
  if (fields.includes("confidence")) schema.confidence = Type.Integer({ minimum: 0, maximum: 100, description: "How sure you are, 0 to 100." });
  return defineTool({
    name: "submit_answer",
    label: "Structured answer",
    description: "Submit your final answer as structured data. Call it once, when you have decided.",
    parameters: Type.Object(schema),
    async execute(_id, params) {
      return { ...text("Answer recorded."), details: { answer: params }, terminate: true };
    },
  });
};
