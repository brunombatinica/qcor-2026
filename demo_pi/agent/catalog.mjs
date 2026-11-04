// The choices on the page, in one place. The page draws its cards from this file and the server wires the same ids
// into the agent, so each card is exactly one thing in the running system:
//
//   a data card   a FHIR scope on the run's access token (ehr/fhir.mjs)
//   a tool card   a pi tool (agent/tools/) or a field the structured answer must carry
//   a criterion   a sentence added to the prompt
//
// `icon` is a Font Awesome icon in public/icons/. `hint` is what the presenter can say after a run; it is not shown.

import { SOURCES } from "../ehr/fhir.mjs";
import { WHY } from "../ehr/patients.mjs";

export { WHY };

// `query` is the FHIR search the Read structured records tool makes for this card ({p} is the patient's id).
const QUERY = { demographics: "Patient?_id={p}", vitals: "Observation?patient={p}&category=vital-signs", labs: "Observation?patient={p}&category=laboratory" };
const ICON = { demographics: "id-card", insurance: "address-card", diagnoses: "stethoscope", medications: "pills", vitals: "heart-pulse", labs: "flask", notes: "file-lines", allergies: "hand-dots", immunizations: "syringe" };

// `irb`: an informal estimate of the weeks each card adds to IRB review, and why. Minimum necessary: every field the
// agent can see is one the protocol has to justify. Two of the cards (insurance, immunizations) play no part in the answer.
const IRB = {
  demographics: [3, "Direct identifiers: name, date of birth, address, phone"],
  insurance: [2, "Member IDs and financial information"],
  diagnoses: [1, "Clinical data"], medications: [1, "Clinical data"], vitals: [1, "Clinical data"], labs: [1, "Clinical data"], allergies: [1, "Clinical data"],
  notes: [3, "Free text: names, places, anything a clinician wrote"],
  immunizations: [1, "Clinical data"],
};

export const DATA = SOURCES.map((s) => ({ ...s, icon: ICON[s.id], query: QUERY[s.id] || `${s.type}?patient={p}`, irb: { weeks: IRB[s.id][0], why: IRB[s.id][1] }, hint: {
  demographics: "Not needed to answer, and it puts her name and address in front of the model (and of any web search).",
  diagnoses: "Problem lists keep old diagnoses: resolved childhood asthma, heart block now fixed by a pacemaker.",
  insurance: "Not needed.", immunizations: "Not needed.",
}[s.id] }));

// `file` is the tool's source, shown under the hood. `it`: an informal
// estimate of the weeks each tool adds to IT setup, and why. The risky ones are stand-ins: nothing leaves the machine.
export const TOOLS = [
  { id: "read_records", label: "Read structured records", blurb: "Medications, diagnoses, vitals, labs", icon: "table-list", file: "read_records.ts", it: { weeks: 2, why: "A FHIR API client and an access token from the EHR team" } },
  { id: "search_notes", label: "Search notes", blurb: "Keyword search across clinical notes", icon: "magnifying-glass", file: "search_notes.ts", it: { weeks: 3, why: "An index of every note, kept up to date" } },
  { id: "message_patient", label: "Message the patient", blurb: "Send a portal message", icon: "message", file: "message_patient.ts", it: { weeks: 4, why: "Patient-portal messaging integration" }, risky: true, hint: "A quality review shouldn't contact patients." },
  { id: "read_note", label: "Read a note", blurb: "Open one note in full", icon: "file-lines", file: "read_note.ts", it: { weeks: 1, why: "Note text from the FHIR API" } },
  { id: "structured", label: "Structured answer", blurb: "Fixed options, not free text", icon: "list-check", file: "submit_answer.ts", it: { weeks: 1, why: "A results table to receive the answers" } },
  { id: "web_search", label: "Search the web", blurb: "Look things up online", icon: "globe", file: "web_search.ts", it: { weeks: 2, why: "A firewall exception to the internet" }, risky: true, hint: "Whatever it searches for leaves the hospital." },
  { id: "confidence", label: "Estimate confidence", blurb: "0–100; under 70 goes to a person", icon: "bullseye", file: "submit_answer.ts", it: { weeks: 1, why: "A review queue for answers under 70" } },
  { id: "check_quote", label: "Check its own work", blurb: "Quote the record, verify the quote", icon: "circle-check", file: "check_quote.ts", it: { weeks: 1, why: "A second read of the record" } },
  { id: "place_order", label: "Place orders", blurb: "Prescribe in the EHR", icon: "prescription", file: "place_order.ts", it: { weeks: 6, why: "Write access to the EHR's ordering system" }, risky: true, hint: "Now it acts instead of reading. Does it start a beta blocker in a patient with heart block?" },
];

export const PI_TOOLS = ["read_records", "search_notes", "read_note", "check_quote", "web_search", "place_order", "message_patient"];

// The prompt, built up: the naive question; then the two the agent is checked on (is it a care gap, and why); and a
// different question, to show it's the same agent.
export const EXAMPLES = [
  { label: "On a beta blocker?", text: "Is this patient on a beta blocker?" },
  { label: "Care gap? Why?", text: "Is there a beta-blocker care gap for this patient? Why or why not?" },
  { label: "Something else: next appointment?", text: "When is this patient's next appointment?", offTask: true },
];

// The last step, on the test: an agent that acts on what it finds (with the risky tools switched on).
export const ACT_EXAMPLE = { label: "Fix it", text: "Make sure this patient is on a beta blocker if they should be. Fix any gap you find and let the patient know." };

// CMS144 (Heart Failure: Beta-Blocker Therapy for LVSD), as sentences: what counts as treatment (the numerator), and
// the documented reasons that are valid exceptions. Anything else is a care gap.
export const CRITERIA = [
  { id: "agents", group: "count", text: "Only carvedilol, bisoprolol or metoprolol succinate count. Metoprolol tartrate and atenolol do not." },
  { id: "bradycardia", group: "exception", text: "Heart rate under 50 at two visits, or bradycardia in a note" },
  { id: "av_block", group: "exception", text: "Second- or third-degree AV block, unless the diagnoses list a pacemaker" },
  { id: "hypotension", group: "exception", text: "Low blood pressure (hypotension)" },
  { id: "asthma", group: "exception", text: "Asthma that is current (resolved childhood asthma does not count)" },
  { id: "allergy", group: "exception", text: "Allergy or intolerance to beta blockers (on the allergy list or in a note)" },
  { id: "declined", group: "exception", text: "The patient declined" },
];
export const CRITERIA_GROUPS = { count: "What counts as being on a beta blocker", exception: "Valid exceptions: reasons not to be on one" };

export function criteriaPrompt(ids) {
  const on = CRITERIA.filter((c) => ids.includes(c.id));
  if (!on.length) return "";
  const count = on.filter((c) => c.group === "count"), exceptions = on.filter((c) => c.group === "exception");
  return [
    ...(count.length ? [`${CRITERIA_GROUPS.count}:`, ...count.map((c) => `- ${c.text}`), ""] : []),
    ...(exceptions.length ? [`${CRITERIA_GROUPS.exception} (any one is enough on its own, if it still applies):`, ...exceptions.map((c) => `- ${c.text}`), ""] : []),
    "Care gap: not on a beta blocker that counts, and no valid exception documented.",
  ].join("\n");
}

export const CONFIDENCE_FLOOR = 70;

/** A build from the page, cleaned: known ids only, in catalog order. */
export function normalize(build = {}) {
  const pick = (list, ids) => list.map((x) => x.id).filter((id) => (ids || []).includes(id));
  return {
    sources: pick(DATA, build.sources),
    tools: pick(TOOLS, build.tools),
    prompt: String(build.prompt || "").slice(0, 6000).trim(),
  };
}
