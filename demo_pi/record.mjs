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

const READ = ["read_records", "search_notes", "read_note"];
const TEST = { sources: ["medications", "diagnoses", "vitals", "notes", "allergies"], tools: READ };     // what the answer needs, and no more
const CHECKS = ["structured", "check_quote", "confidence"];
const RISKY = { sources: [...TEST.sources, "demographics"], tools: [...READ, "web_search", "place_order", "message_patient"] };
const ALL = CRITERIA.map((c) => c.id);
const [GIVEN, GAP, NEXT] = EXAMPLES.map((x) => x.text);
const withCriteria = (prompt, ids) => [prompt, criteriaPrompt(ids)].join("\n\n");     // as the page's "Use for the test"

const rosa = (id, label, build, prompt) => ({ id: `rosa-${id}`, kind: "rosa", label: `Rosa · ${label}`, build: { ...build, prompt } });
const cohort = (id, label, build, prompt, criteria = []) => ({ id: `cohort-${id}`, kind: "cohort", label: `100 patients · ${label}`, build: { ...build, prompt }, criteria });
export const PLAN = [
  rosa("nothing-given", "nothing switched on · On a beta blocker?", { sources: [], tools: [] }, GIVEN),
  rosa("meds-given", "medications · On a beta blocker?", { sources: ["medications"], tools: ["read_records"] }, GIVEN),
  rosa("meds-gap", "medications · and is it a care gap?", { sources: ["medications"], tools: ["read_records"] }, GAP),
  rosa("notes-gap", "medications and notes · and is it a care gap?", { sources: ["medications", "notes"], tools: READ }, GAP),
  rosa("notes-next", "medications and notes · next appointment?", { sources: ["medications", "notes"], tools: READ }, NEXT),
  rosa("test-gap", "the test build · and is it a care gap?", TEST, GAP),
  rosa("checks-gap", "the test build, structured answer and checks · and is it a care gap?", { ...TEST, tools: [...READ, ...CHECKS] }, GAP),
  rosa("risky-gap", "the test build, demographics and the risky tools · and is it a care gap?", RISKY, GAP),
  cohort("given", "On a beta blocker?", TEST, GIVEN),
  cohort("gap", "and is it a care gap?", TEST, GAP),
  cohort("gap-criteria", "and is it a care gap? + every criterion", TEST, withCriteria(GAP, ALL), ALL),
  cohort("gap-criteria-checks", "structured answer and checks · and is it a care gap? + every criterion", { ...TEST, tools: [...READ, ...CHECKS] }, withCriteria(GAP, ALL), ALL),
  cohort("fix", "demographics and the risky tools · Fix it", RISKY, ACT_EXAMPLE.text),
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

const row0tokens = (messages) => { const r = messages.find(([, m]) => m.kind === "result")[1]; return r.usage.input + r.usage.output; };

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
  const tally = summary ? `${summary.right}/${summary.n} · on a beta blocker ${summary.questions.given.right} · care gap ${summary.questions.gap.right} · ${summary.tokensPerPatient} tokens each` : `${Object.values(result.questions).filter((q) => q.right === true).length}/2 · ${row0tokens(messages)} tokens`;
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
