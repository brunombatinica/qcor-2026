// Scoring an answer means checking three things: did it say whether a beta blocker is given, why or why not, and
// whether this is a care gap. A structured answer carries the first and the last as fields; prose ("No, she isn't.")
// has to be read. Either way, whether its "why" matches the chart's reason takes judgement. Here that is one more
// model call per patient, with the reference reason in hand.
//
//   judge(answerText, referenceWhy)  →  { given: "yes"|"no"|null, why: string|null, whyMatches: bool|null, gap: "yes"|"no"|null }

import { MODEL } from "./model.mjs";

const PROMPT = `An agent reviewed a heart-failure patient's chart and answered questions about beta blockers. Read its final answer and report only what it explicitly says; do not infer anything it doesn't say.
Reply with one JSON object with these four fields:
"given": "on" if it says the patient is taking a beta blocker now (any beta blocker, even one it says doesn't count), "not_on" if it says the patient takes none, null if it doesn't say.
"why": the reason it gives, in its own words (quote it, shortened if long), or null. For a patient it says is on one, naming the beta blocker counts as the reason. For a patient it says isn't, the reason is a medical reason, the patient's choice, or that no reason is documented; a bare fact such as "it was stopped on <date>" or "it isn't in the medication list", without saying why, is not a reason: null.
"why_matches": true only if that reason is the same as the reference reason below: for a patient on a beta blocker, the same drug is enough; otherwise the same cause, or likewise that no reason is documented. Partly right or vaguer is false. null if "why" is null.
"gap": "gap" if it says this is a care gap, "no_gap" if it says it is not one, null if it doesn't say. Only saying the patient isn't on a beta blocker is not saying it's a gap: null.`;

const map = (v, yes, no) => (v === yes ? "yes" : v === no ? "no" : null);

export async function judge(text, reference) {
  const none = { given: null, why: null, whyMatches: null, gap: null };
  if (!text) return none;
  try {
    const res = await fetch(`${MODEL.baseUrl}/chat/completions`, {
      method: "POST", signal: AbortSignal.timeout(60_000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${MODEL.apiKey}` },
      body: JSON.stringify({ model: MODEL.id, temperature: 0, max_tokens: 200, messages: [
        { role: "system", content: `${PROMPT}\n\nReference reason: ${reference}` },
        { role: "user", content: text.slice(0, 4000) },
      ] }),
    });
    const said = (await res.json()).choices?.[0]?.message?.content || "";
    const j = JSON.parse(said.slice(said.indexOf("{"), said.lastIndexOf("}") + 1));
    const why = typeof j.why === "string" && j.why.trim() ? j.why.trim() : null;
    return { given: map(j.given, "on", "not_on"), why, whyMatches: why && typeof j.why_matches === "boolean" ? j.why_matches : null, gap: map(j.gap, "gap", "no_gap") };
  } catch {
    return none;
  }
}
