// How every tool reaches the chart: HTTP GETs to the demo's FHIR server with the bearer token for this run. The
// token carries the data cards switched on in the page, so a card that is off is a 403 here, not a missing branch.

const BASE = process.env.DEMO_FHIR_BASE || "";
const TOKEN = process.env.DEMO_FHIR_TOKEN || "";
export const PATIENT = process.env.DEMO_PATIENT || "";

export interface Fhir { status: number; url: string; body: any }

export async function get(path: string): Promise<Fhir> {
  const url = `${BASE}/${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/fhir+json" } });
  return { status: res.status, url: `GET /fhir/${path}`, body: await res.json().catch(() => ({})) };
}

/** A search's resources, or an Error whose message is what the model sees (the OperationOutcome). */
export async function search(path: string): Promise<{ request: string; resources: any[] }> {
  const r = await get(path);
  if (r.status !== 200) throw new Error(`${r.url} → ${r.status} ${r.body?.issue?.[0]?.diagnostics || ""}`.trim());
  return { request: `${r.url} → 200, ${r.body.total} resources`, resources: (r.body.entry || []).map((e: any) => e.resource) };
}

export const text = (t: string, details: object = {}) => ({ content: [{ type: "text" as const, text: t }], details });
