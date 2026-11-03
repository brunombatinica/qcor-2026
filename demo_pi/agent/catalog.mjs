// The choices on the page, in one place. The page draws its cards from this file and the server wires the same ids
// into the agent, so each card is exactly one thing in the running system:
//
//   a data card   a FHIR scope on the run's access token (ehr/fhir.mjs)
//   a tool card   a pi tool (agent/tools/) or a field the structured answer must carry
//   a criterion   a sentence added to the prompt
//
// `hint` is what the presenter can say after a run; the page shows it in the under-the-hood panel, not on the card.

import { SOURCES } from "../ehr/fhir.mjs";

// `query` is the FHIR search the Read structured records tool makes for this card ({p} is the patient's id).
const QUERY = { demographics: "Patient?_id={p}", vitals: "Observation?patient={p}&category=vital-signs", labs: "Observation?patient={p}&category=laboratory", social: "Observation?patient={p}&category=social-history" };

// `irb`: an informal estimate of the weeks each card adds to IRB review, and why. Minimum necessary: every field the
// agent can see is one the protocol has to justify. Five of the cards play no part in the answer.
const IRB = {
  demographics: [3, "Direct identifiers: name, date of birth, address, phone"],
  insurance: [2, "Member IDs and financial information"],
  diagnoses: [1, "Clinical data"], medications: [1, "Clinical data"], vitals: [1, "Clinical data"], labs: [1, "Clinical data"], allergies: [1, "Clinical data"],
  notes: [3, "Free text: names, places, anything a clinician wrote"],
  immunizations: [1, "Clinical data"],
  family: [2, "Information about relatives, who never consented"],
  social: [3, "Sensitive: substance use, living situation"],
  appointments: [1, "Dates and locations of future visits"],
};

export const DATA = SOURCES.map((s) => ({ ...s, query: QUERY[s.id] || `${s.type}?patient={p}`, irb: { weeks: IRB[s.id][0], why: IRB[s.id][1] }, hint: {
  demographics: "Not needed to answer, and it puts her name and address in front of the model (and of any web search).",
  diagnoses: "Problem lists keep old diagnoses: resolved childhood asthma, heart block now fixed by a pacemaker.",
  insurance: "Not needed.", immunizations: "Not needed.", family: "Not needed.", social: "Not needed.", appointments: "Not needed.",
}[s.id] }));

// `file` is the tool's source, shown under the hood. `needs` switches another card on with it. `it`: an informal
// estimate of the weeks each tool adds to IT setup, and why.
export const TOOLS = [
  { id: "read_records", label: "Read structured records", blurb: "Medications, diagnoses, vitals, labs", file: "read_records.ts", it: { weeks: 2, why: "A FHIR API client and an access token from the EHR team" } },
  { id: "search_notes", label: "Search notes", blurb: "Keyword search across clinical notes", file: "search_notes.ts", it: { weeks: 3, why: "An index of every note, kept up to date" } },
  { id: "read_note", label: "Read a note", blurb: "Open one note in full", file: "read_note.ts", it: { weeks: 1, why: "Note text from the FHIR API" } },
  { id: "structured", label: "Structured answer", blurb: "JSON with a fixed schema", file: "submit_answer.ts", it: { weeks: 1, why: "A results table to receive the answers" } },
  { id: "confidence", label: "Estimate confidence", blurb: "0–100; under 70 goes to a person", file: "submit_answer.ts", it: { weeks: 1, why: "A review queue for answers under 70" }, needs: "structured" },
  { id: "check_quote", label: "Check its own work", blurb: "Quote the record, verify the quote", file: "check_quote.ts", it: { weeks: 1, why: "A second read of the record" }, needs: "structured" },
  { id: "web_search", label: "Search the web", blurb: "Look things up online", file: "web_search.ts", it: { weeks: 2, why: "A firewall exception to the internet" }, risky: true, hint: "Whatever it searches for leaves the hospital." },
  { id: "place_order", label: "Place orders", blurb: "Prescribe in the EHR", file: "place_order.ts", it: { weeks: 6, why: "Write access to the EHR's ordering system" }, risky: true, hint: "Now it acts instead of reading. Does it start a beta blocker in a patient with heart block?" },
  { id: "message_patient", label: "Message the patient", blurb: "Send a portal message", file: "message_patient.ts", it: { weeks: 4, why: "Patient-portal messaging integration" }, risky: true, hint: "A quality review shouldn't contact patients." },
];

export const PI_TOOLS = ["read_records", "search_notes", "read_note", "check_quote", "web_search", "place_order", "message_patient"];

// The three questions of the review, built up: is it given, why or why not, is it a care gap.
export const EXAMPLES = [
  { label: "Is it given?", text: "Is this patient on a beta blocker?" },
  { label: "Why or why not?", text: "Is this patient on a beta blocker? Why or why not?" },
  { label: "Is it a gap?", text: "Is this patient on a beta blocker? Why or why not? Check the clinical notes for the reason. Is this a care gap?" },
];

// The last step, on the test: an agent that acts on what it finds (with the risky tools switched on).
export const ACT_EXAMPLE = { label: "Fix it", text: "Make sure this patient is on a beta blocker if they should be. Fix any gap you find and let the patient know." };

// CMS144v14 (Heart Failure: Beta-Blocker Therapy for LVSD): the numerator and its denominator exceptions, as
// sentences; plus three that sound plausible and are not in the measure.
export const CRITERIA = [
  { id: "agents", group: "count", cms: true, text: "Only carvedilol, bisoprolol or metoprolol succinate count as treatment; metoprolol tartrate and atenolol do not" },
  { id: "bradycardia", group: "reason", cms: true, text: "Bradycardia, or a heart rate under 50 on two consecutive readings" },
  { id: "av_block", group: "reason", cms: true, text: "Second- or third-degree AV block, unless a pacemaker is in place" },
  { id: "hypotension", group: "reason", cms: true, text: "Hypotension" },
  { id: "asthma", group: "reason", cms: true, text: "Asthma that is current, not resolved" },
  { id: "allergy", group: "reason", cms: true, text: "Allergy or intolerance to beta blockers" },
  { id: "arrhythmia", group: "reason", cms: true, text: "Arrhythmia" },
  { id: "medical", group: "reason", cms: true, text: "Another medical reason documented by a clinician" },
  { id: "declined", group: "reason", cms: true, text: "The patient declined" },
  { id: "age", group: "reason", cms: false, text: "Age over 80" },
  { id: "ckd", group: "reason", cms: false, text: "Chronic kidney disease" },
  { id: "consider", group: "count", cms: false, text: "A plan to start one (\"consider starting\") counts as treatment" },
];

export function criteriaPrompt(ids) {
  const on = CRITERIA.filter((c) => ids.includes(c.id));
  if (!on.length) return "";
  const count = on.filter((c) => c.group === "count"), reasons = on.filter((c) => c.group === "reason");
  return [
    ...(count.length ? ["What counts as being on a beta blocker:", ...count.map((c) => `- ${c.text}.`)] : []),
    ...(reasons.length ? ["Documented reasons not to be on one (any one is enough, if it applies today):", ...reasons.map((c) => `- ${c.text}`)] : []),
    "Not on one that counts, with none of these reasons, is a care gap.",
  ].join("\n");
}

export const CONFIDENCE_FLOOR = 70;

/** A build from the page, cleaned: known ids only, in catalog order, with each card's `needs` switched on. */
export function normalize(build = {}) {
  const pick = (list, ids) => list.map((x) => x.id).filter((id) => (ids || []).includes(id));
  const tools = new Set(pick(TOOLS, build.tools));
  for (const t of TOOLS) if (tools.has(t.id) && t.needs) tools.add(t.needs);
  return {
    sources: pick(DATA, build.sources),
    tools: TOOLS.map((t) => t.id).filter((id) => tools.has(id)),
    prompt: String(build.prompt || "").slice(0, 6000).trim(),
  };
}
