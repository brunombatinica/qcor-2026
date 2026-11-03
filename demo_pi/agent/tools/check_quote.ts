// check_quote: the agent checks its own evidence before answering. Is this quote really, word for word, in the
// record it says it came from? It reads the record again through FHIR, so it can only confirm what it may see.

import { defineTool } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { line, noteText } from "../../ehr/render.mjs";
import { PATIENT, get, search, text } from "./fhir.ts";

const squash = (s: string) => s.toLowerCase().replace(/[“”"'.,;:]/g, "").replace(/\s+/g, " ").trim();
const TYPES = ["Patient", "Coverage", "Condition", "MedicationRequest", "Observation", "AllergyIntolerance", "Immunization", "FamilyMemberHistory", "Appointment"];

export default () => defineTool({
  name: "check_quote",
  label: "Check its own work",
  description: "Check that a quote you plan to cite is word for word in the record. `source` is a note id (N1, N2…) or \"records\" for the structured record. Do this before you answer.",
  parameters: Type.Object({
    quote: Type.String({ description: "The exact words you will cite." }),
    source: Type.String({ description: "A note id such as N3, or \"records\"." }),
  }),
  async execute(_id, { quote, source }) {
    let haystack = "";
    if (/^N\d+$/i.test(source.trim())) {
      const r = await get(`DocumentReference/${PATIENT}-${source.trim().toUpperCase()}`);
      if (r.status !== 200) throw new Error(`${r.url} → ${r.status}`);
      haystack = noteText(r.body);
    } else {
      for (const t of TYPES) { try { haystack += (await search(t === "Patient" ? `Patient?_id=${PATIENT}` : `${t}?patient=${PATIENT}`)).resources.map(line).join("\n") + "\n"; } catch { /* no scope */ } }
    }
    const found = squash(quote).length >= 8 && squash(haystack).includes(squash(quote));
    return text(found ? `Verified: the quote is in ${source}.` : `NOT FOUND: that quote is not in ${source}. Fix it or choose another before answering.`, { found });
  },
});
