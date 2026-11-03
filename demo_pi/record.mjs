// Record the planned builds on the live model, into recorded/, so the page can replay them with no model (replay.mjs).
// Each one runs fresh (no cache) through the server's own API, exactly as the page would run it, and is kept with its
// timings, so the replay keeps the pace.
//
//   node record.mjs [id …]          (npm run record; the model is DEMO_BASE_URL etc., as for the server)
//
// The plan follows the story in README.md: Rosa on each data and tool step with each example prompt, then the test's
// prompts on all 100 patients. A recording holds the model's answers on the synthetic cohort, never anything real.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ACT_EXAMPLE, CRITERIA, EXAMPLES, criteriaPrompt, normalize } from "./agent/catalog.mjs";
import { MODEL } from "./agent/model.mjs";
import { RECORDED, REPLAY, fingerprint } from "./replay.mjs";

const TEST = { sources: ["medications", "diagnoses", "vitals", "notes", "allergies"], tools: ["read_records", "search_notes", "read_note"] };
const CHECKS = ["structured", "check_quote", "confidence"];
const RISKY = { sources: [...TEST.sources, "demographics"], tools: [...TEST.tools, "web_search", "place_order", "message_patient"] };
const CMS = CRITERIA.filter((c) => c.cms).map((c) => c.id), ALL = CRITERIA.map((c) => c.id);
const [GIVEN, WHY, GAP] = EXAMPLES.map((x) => x.text);
const withCriteria = (prompt, ids) => [prompt, criteriaPrompt(ids)].join("\n\n");     // as the page's "Use for the test"

const STEPS = [
  ["nothing", "nothing", { sources: [], tools: [] }],
  ["meds", "medications", { sources: ["medications"], tools: ["read_records"] }],
  ["notes", "medications and notes", { sources: ["medications", "notes"], tools: ["read_records", "search_notes", "read_note"] }],
  ["test", "the test build", TEST],
];
export const PLAN = [
  ...STEPS.flatMap(([id, what, b]) => EXAMPLES.map((x, i) => ({ id: `rosa-${id}-${["given", "why", "gap"][i]}`, kind: "rosa", label: `Rosa · ${what} · ${x.label}`, build: { ...b, prompt: x.text } }))),
  { id: "rosa-checks-gap", kind: "rosa", label: "Rosa · the test build, structured answer and checks · Is it a gap?", build: { ...TEST, tools: [...TEST.tools, ...CHECKS], prompt: GAP } },
  { id: "rosa-risky-gap", kind: "rosa", label: "Rosa · the test build, demographics and the risky tools · Is it a gap?", build: { ...RISKY, prompt: GAP } },
  { id: "cohort-given", kind: "cohort", label: "100 patients · Is it given?", build: { ...TEST, prompt: GIVEN } },
  { id: "cohort-why", kind: "cohort", label: "100 patients · Why or why not?", build: { ...TEST, prompt: WHY } },
  { id: "cohort-gap", kind: "cohort", label: "100 patients · Is it a gap?", build: { ...TEST, prompt: GAP } },
  { id: "cohort-gap-cms", kind: "cohort", label: "100 patients · Is it a gap? + every CMS144 criterion", build: { ...TEST, prompt: withCriteria(GAP, CMS) }, criteria: CMS },
  { id: "cohort-gap-all", kind: "cohort", label: "100 patients · Is it a gap? + CMS144 and the three distractors", build: { ...TEST, prompt: withCriteria(GAP, ALL) }, criteria: ALL },
  { id: "cohort-gap-cms-checks", kind: "cohort", label: "100 patients · structured answer and checks · Is it a gap? + every CMS144 criterion", build: { ...TEST, tools: [...TEST.tools, ...CHECKS], prompt: withCriteria(GAP, CMS) }, criteria: CMS },
  { id: "cohort-fix", kind: "cohort", label: "100 patients · demographics and the risky tools · Fix it", build: { ...RISKY, prompt: ACT_EXAMPLE.text } },
];

// one POST to the server, its server-sent events with the time each arrived (ms after the request)
async function stream(base, path, body) {
  const t0 = Date.now(), out = [];
  const res = await fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  const dec = new TextDecoder();
  let buf = "";
  for await (const chunk of res.body) {
    buf += dec.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const c = buf.slice(0, i);
      buf = buf.slice(i + 2);
      if (c.startsWith("data: ")) out.push([Date.now() - t0, JSON.parse(c.slice(6))]);
    }
  }
  return { messages: out, seconds: Math.round((Date.now() - t0) / 100) / 10 };
}

// a row as it is kept: no score (the replay scores it again) and no cache flag; when it started and finished in the run
const keep = ({ score, cached, ...row }, start, done) => ({ start: Math.max(0, Math.round(start)), done, ...row });

async function record(base, plan, order) {
  const build = normalize(plan.build);
  const { messages, seconds } = await stream(base, plan.kind === "rosa" ? "/api/run" : "/api/cohort", plan.kind === "rosa" ? { build, patient: "p000" } : { build, fresh: true });
  let rows;
  if (plan.kind === "rosa") {
    const [done, { kind, ...row }] = messages.find(([, m]) => m.kind === "result");
    const items = messages.filter(([, m]) => !["wiring", "result"].includes(m.kind));      // the trace, with the text deltas
    const first = items[0];
    rows = [keep({ ...row, trace: items.map(([, m]) => m) }, first ? first[0] - first[1].t : 0, done)];
  } else {
    const firstEvent = new Map();
    for (const [at, m] of messages) if (m.kind === "event" && !firstEvent.has(m.patientId)) firstEvent.set(m.patientId, at - m.item.t);
    rows = messages.filter(([, m]) => m.kind === "patient").map(([at, { row }]) => keep(row, firstEvent.get(row.patientId) ?? at - (row.seconds || 0) * 1000, at));
    rows.sort((a, b) => a.patientId.localeCompare(b.patientId));
  }
  const failed = rows.filter((r) => r.status !== "ok").length;
  const rec = { id: plan.id, order, kind: plan.kind, label: plan.label, build, criteria: plan.criteria || [], model: MODEL.id, recorded: new Date().toISOString(), seconds, ...fingerprint(build), rows };
  const { rows: _, ...head } = rec;
  writeFileSync(join(RECORDED, `${plan.id}.json`), JSON.stringify(head, null, 2).replace(/\n}$/, `,\n  "rows": [\n${rows.map((r) => `    ${JSON.stringify(r)}`).join(",\n")}\n  ]\n}\n`));
  const summary = messages.find(([, m]) => m.kind === "summary")?.[1].summary;
  const result = plan.kind === "rosa" ? messages.find(([, m]) => m.kind === "result")[1].score : null;
  const tally = summary ? `${summary.right}/${summary.n} · given ${summary.questions.given.right} · why ${summary.questions.why.right} · gap ${summary.questions.gap.right}` : `${Object.values(result.questions).filter((q) => q.right === true).length}/3`;
  console.log(`${plan.id.padEnd(24)} ${tally.padEnd(42)} ${seconds} s${failed ? ` · ${failed} failed` : ""}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (REPLAY) { console.error("record: unset DEMO_REPLAY: recording needs the live model"); process.exit(1); }
  process.env.PORT = "0";
  process.env.HOST = "127.0.0.1";
  const { server, ready } = await import("./server.mjs");
  const base = `http://127.0.0.1:${await ready}`;
  if (!MODEL.ok) { console.error(`record: no model at ${MODEL.baseUrl} (${MODEL.error})`); process.exit(1); }
  mkdirSync(RECORDED, { recursive: true });
  const only = process.argv.slice(2);
  for (const [i, plan] of PLAN.entries()) if (!only.length || only.includes(plan.id)) await record(base, plan, i);
  server.close();
  process.exit(0);
}
