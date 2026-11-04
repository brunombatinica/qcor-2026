// Reading a free-text answer. A structured answer carries the measure's two answers as fields (on a beta blocker?
// a care gap?); prose ("No, she isn't.") has to be read. Here that is one more model call per patient, which only
// reads what the answer says: it is never shown the chart or the correct answer, so it can't mark anything right.
//
//   read(answerText)  →  { onBetaBlocker: "yes"|"no"|null, careGap: "yes"|"no"|null, usage: {input, output} }

import { MODEL, reasoningOff } from "./model.mjs";

const PROMPT = `An agent reviewed a heart-failure patient's chart and wrote an answer. Read the answer and report only what it explicitly says; do not infer anything it doesn't say.
Reply with one JSON object with two fields:
"on_beta_blocker": "yes" if it says the patient is on a beta blocker now, "no" if it says the patient is not on one, or that the one they take doesn't count; null if it doesn't say.
"care_gap": "yes" if it says this is a care gap, "no" if it says it is not one (for example because the patient is on one, or there is a documented reason not to be); null if it doesn't say. Only saying the patient isn't on a beta blocker is not saying whether it's a care gap: null.`;

const yn = (v) => (v === "yes" || v === true ? "yes" : v === "no" || v === false ? "no" : null);

export async function read(text) {
  const none = { onBetaBlocker: null, careGap: null, usage: { input: 0, output: 0 } };
  if (!text) return none;
  // OpenAI's reasoning models take neither temperature nor max_tokens; reasoning tokens count against the cap
  const off = reasoningOff();
  const settings = off ? { reasoning_effort: off, max_completion_tokens: 300 } : { temperature: 0, max_tokens: 120 };
  try {
    const res = await fetch(`${MODEL.baseUrl}/chat/completions`, {
      method: "POST", signal: AbortSignal.timeout(60_000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${MODEL.apiKey}` },
      body: JSON.stringify({ model: MODEL.id, ...settings, messages: [{ role: "system", content: PROMPT }, { role: "user", content: text.slice(0, 4000) }] }),
    });
    const body = await res.json();
    const said = body.choices?.[0]?.message?.content || "";
    const j = JSON.parse(said.slice(said.indexOf("{"), said.lastIndexOf("}") + 1));
    return { onBetaBlocker: yn(j.on_beta_blocker), careGap: yn(j.care_gap), usage: { input: body.usage?.prompt_tokens || 0, output: body.usage?.completion_tokens || 0 } };
  } catch {
    return none;
  }
}
