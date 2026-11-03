// submit_answer: the structured answer, a JSON object with a fixed schema instead of prose. It holds the three
// questions of the review (is a beta blocker given, why or why not, is it a care gap); the agent fills in the ones
// its instructions ask. A quote and its source come with "Check its own work", a confidence with "Estimate
// confidence". Returning terminate ends the session on this call.

import { defineTool } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Type } from "typebox";
import { text } from "./fhir.ts";

export default (fields: string[]) => {
  const yesNo = (description: string) => StringEnum(["yes", "no"] as const, { description });
  const schema: Record<string, any> = {
    given: yesNo("Is the patient on a beta blocker now?"),
    medication: Type.Optional(Type.String({ description: "The beta blocker and dose, if any." })),
    why: Type.Optional(Type.String({ description: "Only if you were asked: why the patient is or isn't on one, in one sentence." })),
    gap: Type.Optional(yesNo("Only if you were asked: is this a care gap?")),
  };
  if (fields.includes("quote")) {
    schema.quote = Type.String({ description: "Exact words from the record that decide it." });
    schema.source = Type.String({ description: "Where the quote is from: a note id such as N3, or \"records\"." });
  }
  if (fields.includes("confidence")) schema.confidence = Type.Integer({ minimum: 0, maximum: 100, description: "How sure you are, 0 to 100." });
  return defineTool({
    name: "submit_answer",
    label: "Structured answer",
    description: "Submit your final answer as structured data. Fill in only what your instructions ask for. Call it once, when you have decided.",
    parameters: Type.Object(schema),
    async execute(_id, params) {
      return { ...text("Answer recorded."), details: { answer: params }, terminate: true };
    },
  });
};
