// read_note: one clinical note in full (FHIR DocumentReference read), by the id search_notes or read_records gave.

import { defineTool } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { line, noteText } from "../../ehr/render.mjs";
import { PATIENT, get, text } from "./fhir.ts";

export default () => defineTool({
  name: "read_note",
  label: "Read a note",
  description: "Read one of this patient's clinical notes in full by its id (N1, N2, …; N1 is the newest).",
  parameters: Type.Object({ id: Type.String({ description: "The note id, e.g. N3." }) }),
  async execute(_id, { id }) {
    const r = await get(`DocumentReference/${PATIENT}-${id.trim().toUpperCase()}`);
    if (r.status !== 200) throw new Error(`${r.url} → ${r.status} ${r.body?.issue?.[0]?.diagnostics || ""}`.trim());
    return text(`${line(r.body)}\n\n${noteText(r.body)}`, { request: `${r.url} → 200` });
  },
});
