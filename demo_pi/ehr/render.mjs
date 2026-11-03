// FHIR resources as the lines the model reads. A FHIR response is long JSON full of system URLs; the harness's job is
// to turn it into a few words per resource. Used by the agent's tools (agent/tools/) and by the scorer.

const coded = (c) => c?.text || c?.coding?.[0]?.display || c?.coding?.[0]?.code || "";
const codes = (c) => (c?.coding || []).filter((x) => x.code && !/rxnorm/.test(x.system)).map((x) => x.code).join(", ");

export const noteText = (r) => Buffer.from(r.content?.[0]?.attachment?.data || "", "base64").toString("utf8");
export const noteId = (r) => r.id.split("-").pop();

export function line(r) {
  switch (r.resourceType) {
    case "Patient": return `${r.name[0].given.join(" ")} ${r.name[0].family}, ${r.gender}, born ${r.birthDate}, MRN ${r.identifier[0].value}, ${r.address[0].line[0]}, ${r.address[0].city} ${r.address[0].state}, phone ${r.telecom[0].value}`;
    case "Condition": return `${coded(r.code)} (${codes(r.code)}), ${r.clinicalStatus.coding[0].code}, since ${r.onsetDateTime}`;
    case "MedicationRequest": {
      const end = r.dispenseRequest?.validityPeriod?.end;
      return `${coded(r.medicationCodeableConcept)}: ${r.dosageInstruction?.[0]?.text || ""}. Status ${r.status}, ordered ${r.authoredOn}${end ? `, stopped ${end}` : ""}`;
    }
    case "Observation": {
      const when = r.effectiveDateTime;
      if (r.valueCodeableConcept || r.valueString) return `${when}  ${coded(r.code)}: ${r.valueString ?? coded(r.valueCodeableConcept)}`;
      if (r.component) return `${when}  ${coded(r.code).replace(/ panel.*/, "")} ${r.component[0].valueQuantity.value}/${r.component[1].valueQuantity.value} mmHg`;
      return `${when}  ${coded(r.code)} ${r.valueQuantity.value} ${r.valueQuantity.unit}`;
    }
    case "Coverage": return `${r.payor[0].display}, ${r.class[0].value} (${coded(r.type)}), member ID ${r.subscriberId}, since ${r.period.start}`;
    case "Immunization": return `${r.occurrenceDateTime}  ${coded(r.vaccineCode)}`;
    case "FamilyMemberHistory": return `${coded(r.relationship)}: ${r.condition.map((c) => `${coded(c.code)}${c.onsetAge ? ` at ${c.onsetAge.value}` : ""}`).join(", ")}`;
    case "Appointment": return `${r.start.slice(0, 16).replace("T", " ")}  ${r.description}, with ${r.participant[1].actor.display}`;
    case "DocumentReference": return `${noteId(r)}  ${r.date.slice(0, 10)}  ${coded(r.type)}  (${r.author?.[0]?.display || "unknown author"})`;
    case "AllergyIntolerance": return r.code.coding[0].code === "716186003" ? "No known allergies" : `${coded(r.code)}: ${r.type}, reaction ${r.reaction?.[0]?.manifestation?.[0]?.text || "not recorded"}, recorded ${r.recordedDate}`;
    default: return `${r.resourceType}/${r.id}`;
  }
}

/** All the text one resource contributes (a note's full text, otherwise its line). */
export const fullText = (r) => (r.resourceType === "DocumentReference" ? `${line(r)}\n${noteText(r)}` : line(r));
