// A small FHIR R4 server over the synthetic cohort, with SMART Backend Services-style scopes. The agent's tools reach
// the chart only through it, over HTTP, with a token that carries exactly the data cards switched on in the page:
//
//   POST /auth/token               scope=system/MedicationRequest.rs system/DocumentReference.rs …   → access_token
//   GET  /fhir/metadata            the CapabilityStatement
//   GET  /fhir/<Type>?patient=<id>[&category=…]                                                        → searchset Bundle
//   GET  /fhir/<Type>/<id>                                                                              → one resource
//
// A search for a type the token has no scope for is a 403 OperationOutcome; Observation scopes are granular by
// category (vital-signs, laboratory, social-history). There is no client authentication: the data is synthetic.

import { randomBytes } from "node:crypto";
import { PATIENTS, TODAY } from "./patients.mjs";

const SNOMED = "http://snomed.info/sct", ICD10 = "http://hl7.org/fhir/sid/icd-10-cm", LOINC = "http://loinc.org", RXNORM = "http://www.nlm.nih.gov/research/umls/rxnorm";
const OBS_CAT = "http://terminology.hl7.org/CodeSystem/observation-category";
const cc = (system, code, display, text) => ({ coding: [{ system, code, display }], ...(text ? { text } : {}) });

// The data cards: one FHIR resource type (and category) each, and the scope that grants it.
export const SOURCES = [
  { id: "demographics", type: "Patient", label: "Demographics", blurb: "Name, date of birth, address" },
  { id: "insurance", type: "Coverage", label: "Insurance", blurb: "Payer, plan, member ID" },
  { id: "diagnoses", type: "Condition", label: "Diagnoses", blurb: "Problem list" },
  { id: "medications", type: "MedicationRequest", label: "Medications", blurb: "Prescriptions, active and stopped" },
  { id: "vitals", type: "Observation", category: "vital-signs", label: "Vital signs", blurb: "Heart rate, blood pressure" },
  { id: "labs", type: "Observation", category: "laboratory", label: "Lab results", blurb: "Potassium, creatinine, NT-proBNP" },
  { id: "notes", type: "DocumentReference", label: "Clinical notes", blurb: "Clinic, telephone, consult notes" },
  { id: "allergies", type: "AllergyIntolerance", label: "Allergies", blurb: "Allergies and intolerances" },
  { id: "immunizations", type: "Immunization", label: "Immunizations", blurb: "Vaccines given" },
  { id: "family", type: "FamilyMemberHistory", label: "Family history", blurb: "Conditions in relatives" },
  { id: "social", type: "Observation", category: "social-history", label: "Social history", blurb: "Smoking, alcohol, living situation" },
  { id: "appointments", type: "Appointment", label: "Appointments", blurb: "Upcoming visits" },
];
export const scopeOf = (s) => `system/${s.type}.rs${s.category ? `?category=${OBS_CAT}|${s.category}` : ""}`;
const byId = Object.fromEntries(SOURCES.map((s) => [s.id, s]));

// ---- one patient as FHIR resources ----

function resources(p) {
  const ref = { reference: `Patient/${p.id}` };
  const out = [];
  out.push({
    resourceType: "Patient", id: p.id,
    identifier: [{ type: cc("http://terminology.hl7.org/CodeSystem/v2-0203", "MR", "Medical record number"), system: "urn:oid:2.16.840.1.113883.3.1234.5", value: p.mrn }],
    name: [{ use: "official", family: p.name.split(" ").slice(1).join(" "), given: [p.name.split(" ")[0]] }],
    gender: p.sex, birthDate: p.dob,
    address: [{ use: "home", line: [p.address.split(",")[0]], city: "New Haven", state: "CT", postalCode: p.address.slice(-5) }],
    telecom: [{ system: "phone", value: p.phone, use: "home" }],
  });
  p.conditions.forEach((c, i) => out.push({
    resourceType: "Condition", id: `${p.id}-cond-${i + 1}`,
    clinicalStatus: cc("http://terminology.hl7.org/CodeSystem/condition-clinical", c.status, c.status === "active" ? "Active" : "Resolved"),
    verificationStatus: cc("http://terminology.hl7.org/CodeSystem/condition-ver-status", "confirmed", "Confirmed"),
    category: [cc("http://terminology.hl7.org/CodeSystem/condition-category", c.category, c.category === "problem-list-item" ? "Problem List Item" : "Encounter Diagnosis")],
    code: { coding: [{ system: SNOMED, code: c.snomed, display: c.text }, { system: ICD10, code: c.icd10 }], text: c.text },
    subject: ref, onsetDateTime: c.onset, recordedDate: c.onset,
  }));
  p.meds.forEach((m, i) => out.push({
    resourceType: "MedicationRequest", id: `${p.id}-medrx-${i + 1}`,
    status: m.status, intent: "order",
    medicationCodeableConcept: cc(RXNORM, m.rxnorm, m.text.split(" ").slice(0, m.text.startsWith("sacubitril") ? 3 : 1).join(" "), m.text),
    subject: ref, authoredOn: m.start,
    dosageInstruction: [{ text: m.sig }],
    ...(m.end ? { dispenseRequest: { validityPeriod: { start: m.start, end: m.end } } } : {}),
  }));
  p.vitals.forEach((v, i) => {
    out.push({ resourceType: "Observation", id: `${p.id}-hr-${i + 1}`, status: "final", category: [cc(OBS_CAT, "vital-signs", "Vital Signs")],
      code: cc(LOINC, "8867-4", "Heart rate"), subject: ref, effectiveDateTime: v.date, valueQuantity: { value: v.hr, unit: "/min", system: "http://unitsofmeasure.org", code: "/min" } });
    out.push({ resourceType: "Observation", id: `${p.id}-bp-${i + 1}`, status: "final", category: [cc(OBS_CAT, "vital-signs", "Vital Signs")],
      code: cc(LOINC, "85354-9", "Blood pressure panel with all children optional"), subject: ref, effectiveDateTime: v.date,
      component: [{ code: cc(LOINC, "8480-6", "Systolic blood pressure"), valueQuantity: { value: v.sbp, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" } },
        { code: cc(LOINC, "8462-4", "Diastolic blood pressure"), valueQuantity: { value: v.dbp, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" } }] });
  });
  p.labs.forEach((l, i) => out.push({ resourceType: "Observation", id: `${p.id}-lab-${i + 1}`, status: "final", category: [cc(OBS_CAT, "laboratory", "Laboratory")],
    code: cc(LOINC, l.loinc, l.name), subject: ref, effectiveDateTime: l.date, valueQuantity: { value: Number(l.value), unit: l.unit } }));
  const NOTE_LOINC = { progress: ["11506-3", "Progress note"], telephone: ["34748-4", "Telephone encounter Note"], consult: ["11488-4", "Consult note"], nursing: ["34746-8", "Nurse Note"], discharge: ["18842-5", "Discharge summary"], procedure: ["28570-0", "Procedure note"] };
  p.notes.forEach((n) => out.push({
    resourceType: "DocumentReference", id: `${p.id}-${n.id}`, status: "current",
    type: cc(LOINC, ...NOTE_LOINC[n.type], n.title),
    category: [cc("http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category", "clinical-note", "Clinical Note")],
    subject: ref, date: `${n.date}T15:00:00Z`, author: [{ display: n.author }],
    content: [{ attachment: { contentType: "text/plain", data: Buffer.from(n.text).toString("base64") } }],
  }));
  if (!p.allergies.length) out.push({ resourceType: "AllergyIntolerance", id: `${p.id}-allergy-0`,
    clinicalStatus: cc("http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", "active", "Active"),
    code: cc(SNOMED, "716186003", "No known allergy"), patient: ref });
  p.allergies.forEach((a, i) => out.push({
    resourceType: "AllergyIntolerance", id: `${p.id}-allergy-${i + 1}`,
    clinicalStatus: cc("http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", "active", "Active"),
    verificationStatus: cc("http://terminology.hl7.org/CodeSystem/allergyintolerance-verification", "confirmed", "Confirmed"),
    type: a.type, code: cc(SNOMED, a.snomed, a.substance), patient: ref, recordedDate: a.date,
    reaction: [{ manifestation: [{ text: a.reaction }] }],
  }));
  out.push({ resourceType: "Coverage", id: `${p.id}-cov-1`, status: "active",
    type: cc("urn:oid:2.16.840.1.113883.3.221.5", p.coverage.code, p.coverage.type),
    subscriberId: p.coverage.member, beneficiary: ref, relationship: cc("http://terminology.hl7.org/CodeSystem/subscriber-relationship", "self", "Self"),
    period: { start: p.coverage.since }, payor: [{ display: p.coverage.payer }], class: [{ type: cc("http://terminology.hl7.org/CodeSystem/coverage-class", "plan", "Plan"), value: p.coverage.plan }] });
  p.immunizations.forEach((v, i) => out.push({ resourceType: "Immunization", id: `${p.id}-imm-${i + 1}`, status: "completed",
    vaccineCode: cc("http://hl7.org/fhir/sid/cvx", v.cvx, v.text), patient: ref, occurrenceDateTime: v.date }));
  p.family.forEach((f, i) => out.push({ resourceType: "FamilyMemberHistory", id: `${p.id}-fmh-${i + 1}`, status: "completed", patient: ref,
    relationship: cc("http://terminology.hl7.org/CodeSystem/v3-RoleCode", f.rel, f.relText),
    condition: [{ code: cc(SNOMED, f.snomed, f.text), ...(f.age ? { onsetAge: { value: f.age, unit: "a", system: "http://unitsofmeasure.org", code: "a" } } : {}) }] }));
  p.social.forEach((o, i) => out.push({ resourceType: "Observation", id: `${p.id}-soc-${i + 1}`, status: "final", category: [cc(OBS_CAT, "social-history", "Social History")],
    code: cc(LOINC, o.loinc, o.name), subject: ref, effectiveDateTime: o.date,
    ...(o.snomed ? { valueCodeableConcept: cc(SNOMED, o.snomed, o.value) } : { valueString: o.value }) }));
  p.appointments.forEach((a, i) => out.push({ resourceType: "Appointment", id: `${p.id}-appt-${i + 1}`, status: "booked",
    serviceType: [{ text: a.service }], description: a.service, start: `${a.date}T${a.time}:00-05:00`, minutesDuration: 30,
    participant: [{ actor: { reference: `Patient/${p.id}`, display: p.name }, status: "accepted" }, { actor: { display: a.with }, status: "accepted" }] }));
  return out;
}

const STORE = new Map(PATIENTS.map((p) => [p.id, resources(p)]));
const patientOf = (r) => (r.subject || r.patient || r.beneficiary || r.participant?.[0]?.actor || { reference: `Patient/${r.id}` }).reference.slice(8);

// Which card a resource belongs to.
export function sourceOf(r) {
  const category = r.resourceType === "Observation" && r.category[0].coding[0].code;
  return SOURCES.find((s) => s.type === r.resourceType && (!category || s.category === category))?.id;
}

/** Every resource of one patient that these cards may see (for scoring quotes against what the agent could read). */
export function visible(patientId, sources) {
  return (STORE.get(patientId) || []).filter((r) => sources.includes(sourceOf(r)));
}

// ---- tokens ----

const TOKENS = new Map();
const TOKEN_TTL_MS = 30 * 60_000;

/** A bearer token for these data cards (or scope strings): what the agent's tools present to /fhir. */
export function issueToken(sources) {
  const ids = sources.map((s) => (byId[s] ? s : SOURCES.find((x) => scopeOf(x) === s)?.id)).filter(Boolean);
  const token = randomBytes(18).toString("base64url");
  const now = Date.now();
  for (const [t, v] of TOKENS) if (v.exp < now) TOKENS.delete(t);
  TOKENS.set(token, { sources: [...new Set(ids)], exp: now + TOKEN_TTL_MS });
  return { access_token: token, token_type: "bearer", expires_in: TOKEN_TTL_MS / 1000, scope: [...new Set(ids)].map((id) => scopeOf(byId[id])).join(" ") };
}

// ---- HTTP ----

const outcome = (code, diagnostics) => ({ resourceType: "OperationOutcome", issue: [{ severity: "error", code, diagnostics }] });

export function handleFhir(req, res, url, body = {}) {
  const send = (status, obj) => { res.writeHead(status, { "Content-Type": "application/fhir+json", "Cache-Control": "no-store" }); res.end(JSON.stringify(obj, null, 2)); };
  if (url.pathname === "/auth/token") {
    if (req.method !== "POST") return send(405, outcome("not-supported", "POST grant_type=client_credentials&scope=…"));
    return send(200, issueToken(String(body.scope || "").split(/\s+/).filter(Boolean)));
  }
  const parts = url.pathname.replace(/^\/fhir\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "metadata") return send(200, {
    resourceType: "CapabilityStatement", status: "active", date: TODAY, kind: "instance", fhirVersion: "4.0.1", format: ["json"],
    rest: [{ mode: "server", security: { service: [cc("http://terminology.hl7.org/CodeSystem/restful-security-service", "SMART-on-FHIR", "SMART-on-FHIR")] },
      resource: [...new Set(SOURCES.map((s) => s.type))].map((type) => ({ type, interaction: [{ code: "read" }, { code: "search-type" }], searchParam: [{ name: "patient", type: "reference" }, ...(type === "Observation" ? [{ name: "category", type: "token" }] : [])] })) }],
  });
  const grant = TOKENS.get((req.headers.authorization || "").replace(/^Bearer\s+/i, ""));
  if (!grant || grant.exp < Date.now()) return send(401, outcome("login", "Missing or expired bearer token"));
  const [type, id] = parts;
  const allowed = (r) => grant.sources.includes(sourceOf(r));
  const scoped = SOURCES.filter((s) => s.type === type && grant.sources.includes(s.id));
  if (!scoped.length) return send(403, outcome("forbidden", `This token has no scope for ${type}. Granted: ${grant.sources.map((s) => scopeOf(byId[s])).join(" ") || "(none)"}`));
  if (id) {
    const r = STORE.get(id.split("-")[0])?.find((x) => x.resourceType === type && x.id === id);
    if (!r) return send(404, outcome("not-found", `${type}/${id} not found`));
    if (!allowed(r)) return send(403, outcome("forbidden", `This token has no scope for ${type}/${id}`));
    return send(200, r);
  }
  const patient = (url.searchParams.get("patient") || url.searchParams.get("subject") || "").replace(/^Patient\//, "");
  if (!patient && type !== "Patient") return send(400, outcome("required", "This server needs ?patient= on every search"));
  const category = url.searchParams.get("category")?.split("|").pop();
  const matches = (STORE.get(type === "Patient" ? url.searchParams.get("_id") || patient : patient) || [])
    .filter((r) => r.resourceType === type && allowed(r) && (type === "Patient" || patientOf(r) === patient))
    .filter((r) => !category || r.category?.some((c) => c.coding.some((x) => x.code === category)));
  send(200, {
    resourceType: "Bundle", type: "searchset", total: matches.length,
    link: [{ relation: "self", url: `${url.pathname}${url.search}` }],
    entry: matches.map((resource) => ({ fullUrl: `${type}/${resource.id}`, resource, search: { mode: "match" } })),
  });
}
