// Reading a free-text answer. With the Structured answer card the two answers the agent is checked on (is it a care
// gap? why?) come as fixed options; free text ("No, she isn't.") has to be read. Here that is one more model call per
// patient, which reads the question and what the answer says: it is never shown the chart or the correct answer, so
// it can't mark anything right. "No." to "Is this patient on a beta blocker?" says nothing about a care gap.
//
//   read(answerText, question)  →  { careGap, onBetaBlocker: "yes"|"no"|null, why: <a WHY key>|null, usage: {input, output} }
//
// onBetaBlocker is for a prompt that asks "is this patient on a beta blocker?" (score.mjs); it is not the task.

import { WHY } from "../ehr/patients.mjs";
import { MODEL, reasoningOff } from "./model.mjs";

const PROMPT = `An agent reviewed a heart-failure patient's chart and answered the question below. Read its answer, in the light of the question it answers, and report only what it explicitly says; do not infer anything it doesn't say.
Reply with one JSON object with three fields:
"care_gap": "yes" if it says this is a care gap (the patient should be on a beta blocker and isn't), "no" if it says it is not one; null if it doesn't say. Only saying whether the patient is on a beta blocker is not saying whether it's a care gap: null.
"on_beta_blocker": "yes" if it says the patient takes a beta blocker now (and doesn't say that one doesn't count), "no" if it says the patient doesn't (or only one that doesn't count); null if it doesn't say.
"why": the reason it gives, as one of these, or null:
  "on_beta_blocker": it says the patient takes a beta blocker (and doesn't say that one doesn't count)
  "medical_reason": it names a medical reason not to take one (slow heart rate, heart block, low blood pressure, asthma, an allergy or intolerance, ...)
  "declined": it says the patient declined
  "no_reason": it says the patient isn't on one (or only on one that doesn't count) and no reason is documented, or that a past reason no longer applies, or that the reason it names doesn't count as one
  null: it gives no reason; a bare fact such as "it was stopped on <date>" or "it isn't in the medication list" is not a reason.`;

const yn = (v) => (v === "yes" || v === true ? "yes" : v === "no" || v === false ? "no" : null);

export async function read(text, question = "") {
  const none = { careGap: null, onBetaBlocker: null, why: null, usage: { input: 0, output: 0 } };
  if (!text) return none;
  // OpenAI's reasoning models take neither temperature nor max_tokens; reasoning tokens count against the cap
  const off = reasoningOff();
  const settings = off ? { reasoning_effort: off, max_completion_tokens: 300 } : { temperature: 0, max_tokens: 120 };
  try {
    const res = await fetch(`${MODEL.baseUrl}/chat/completions`, {
      method: "POST", signal: AbortSignal.timeout(60_000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${MODEL.apiKey}` },
      body: JSON.stringify({ model: MODEL.id, ...settings, messages: [{ role: "system", content: PROMPT }, { role: "user", content: `The question: ${question.slice(0, 3000) || "(none)"}\n\nThe answer:\n${text.slice(0, 4000)}` }] }),
    });
    const body = await res.json();
    const said = body.choices?.[0]?.message?.content || "";
    const j = JSON.parse(said.slice(said.indexOf("{"), said.lastIndexOf("}") + 1));
    return { careGap: yn(j.care_gap), onBetaBlocker: yn(j.on_beta_blocker), why: j.why in WHY ? j.why : null, usage: { input: body.usage?.prompt_tokens || 0, output: body.usage?.completion_tokens || 0 } };
  } catch {
    return none;
  }
}
