// read_records: one kind of structured record, as a FHIR search, rendered one line per resource.

import { defineTool } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Type } from "typebox";
import { line } from "../../ehr/render.mjs";
import { PATIENT, search, text } from "./fhir.ts";

const QUERY: Record<string, string> = {
  demographics: "Patient?_id={p}",
  insurance: "Coverage?patient={p}",
  diagnoses: "Condition?patient={p}",
  medications: "MedicationRequest?patient={p}",
  vitals: "Observation?patient={p}&category=vital-signs",
  labs: "Observation?patient={p}&category=laboratory",
  notes: "DocumentReference?patient={p}",
  allergies: "AllergyIntolerance?patient={p}",
  immunizations: "Immunization?patient={p}",
  family: "FamilyMemberHistory?patient={p}",
  social: "Observation?patient={p}&category=social-history",
  appointments: "Appointment?patient={p}",
};

export default () => defineTool({
  name: "read_records",
  label: "Read structured records",
  description: "Read one kind of structured record for this patient from the EHR's FHIR API. `notes` lists the notes (id, date, type, author) without their text.",
  parameters: Type.Object({ record: StringEnum(Object.keys(QUERY) as [string, ...string[]], { description: "Which kind of record." }) }),
  async execute(_id, { record }) {
    const { request, resources } = await search(QUERY[record].replace("{p}", PATIENT));
    const lines = resources.map(line);
    return text(lines.length ? lines.join("\n") : `No ${record} recorded.`, { request, count: lines.length });
  },
});
