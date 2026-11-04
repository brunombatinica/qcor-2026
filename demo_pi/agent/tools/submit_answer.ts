// submit_answer: how the agent hands in its answer. It knows nothing about the task: one free-text answer per question
// the agent was asked, in order. With the Structured answer card each answer also comes as a fixed option (the first
// yes or no, the second one of DEMO_ANSWER_OPTIONS), constrained, so it can be counted without reading prose; the words
// come first, so the model says why before it picks. Only the questions the prompt asked are scored (score.mjs). A
// quote and its source come with "Check its own work", a confidence with "Estimate confidence". Returning terminate
// ends the session on this call.

import { defineTool } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Type } from "typebox";
import { text } from "./fhir.ts";

export default (fields: string[], structured: boolean, options: string[]) => {
  const schema: Record<string, any> = structured ? {
    answer_1: Type.String({ description: "Your answer to the first question, in words." }),
    option_1: StringEnum(["yes", "no"] as const, { description: "The first answer, as one of these options." }),
    answer_2: Type.Optional(Type.String({ description: "Your answer to the second question, in words." })),
    option_2: Type.Optional(StringEnum(options as [string, ...string[]], { description: "The second answer, as one of these options." })),
  } : {
    answer_1: Type.String({ description: "Your answer to the first question." }),
    answer_2: Type.Optional(Type.String({ description: "Your answer to the second question, if there was one." })),
    answer_3: Type.Optional(Type.String({ description: "Your answer to the third question, if there was one." })),
  };
  if (fields.includes("quote")) {
    schema.quote = Type.String({ description: "Exact words from the record that decide it." });
    schema.source = Type.String({ description: "Where the quote is from: a note id such as N3, or \"records\"." });
  }
  if (fields.includes("confidence")) schema.confidence = Type.Integer({ minimum: 0, maximum: 100, description: "How sure you are, 0 to 100." });
  return defineTool({
    name: "submit_answer",
    label: "Submit the answer",
    description: "Hand in your answer: one answer per question you were asked, in order. Call it once, when you have decided.",
    parameters: Type.Object(schema),
    async execute(_id, params: Record<string, unknown>) {
      // with fixed options, an answer in words needs its option too: refused, so the model hands it in again
      if (structured) for (const [a, o] of [["answer_1", "option_1"], ["answer_2", "option_2"]])
        if (params[a] !== undefined && params[o] === undefined) throw new Error(`${o} is missing: pick the option that matches ${a}, then call submit_answer again.`);
      return { ...text("Answer recorded."), details: { answer: params }, terminate: true };
    },
  });
};
