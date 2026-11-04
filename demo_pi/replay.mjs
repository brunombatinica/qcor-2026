// Recorded runs: the planned builds (record.mjs), run once on a real model and kept in recorded/, so the page works
// with no model. The server replays one when the model can't be reached, or always with --replay (DEMO_REPLAY=1): the
// same events at the same pace, scored again by score.mjs. A build that wasn't recorded can't be replayed; the page
// lists the ones that were.
//
//   DEMO_REPLAY        1: replay even when the model answers
//   DEMO_REPLAY_SPEED  how much faster than recorded (default 1)
//
// A recording is stale once the cohort (ehr/patients.mjs) or the system prompt (agent/instructions/) changes; stale
// ones are skipped, with a warning. Re-record with `npm run record`.

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalize } from "./agent/catalog.mjs";
import { systemPrompt } from "./agent/session.mjs";
import { PATIENTS } from "./ehr/patients.mjs";
import { score, summarize } from "./score.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const RECORDED = join(HERE, "recorded");
export const REPLAY = process.argv.includes("--replay") || process.env.DEMO_REPLAY === "1";
const SPEED = Number(process.env.DEMO_REPLAY_SPEED || 1);

const sha = (s) => createHash("sha1").update(s).digest("hex");
export const COHORT = sha(JSON.stringify(PATIENTS));
export const fingerprint = (build) => ({ cohort: COHORT.slice(0, 12), system: sha(systemPrompt(build)).slice(0, 12) });

// a build as a lookup key: the page's choices in catalog order, the prompt with its whitespace collapsed
const keyOf = (kind, build) => { const b = normalize(build); return JSON.stringify([kind, b.sources, b.tools, b.prompt.replace(/\s+/g, " ")]); };

export const recordings = new Map();
export const stale = [];
for (const file of existsSync(RECORDED) ? readdirSync(RECORDED).filter((f) => f.endsWith(".json")).sort() : []) {
  const rec = JSON.parse(readFileSync(join(RECORDED, file), "utf8"));
  const now = fingerprint(rec.build);
  if (rec.cohort !== now.cohort || rec.system !== now.system) stale.push(rec.id);
  else recordings.set(keyOf(rec.kind, rec.build), rec);
}

/** The recording of this build, if there is one (Rosa only, for a single run). */
export function recorded(kind, build, patientId) {
  if (kind === "rosa" && patientId && patientId !== PATIENTS[0].id) return null;
  return recordings.get(keyOf(kind, build)) || null;
}

/** What the page needs to list them: the planned builds, in the order they were planned. */
export const catalog = () => [...recordings.values()].sort((a, b) => a.order - b.order).map(({ id, kind, label, build, criteria, rules }) => ({ id, kind, label, build, criteria, rules }));

const sleep = (ms, signal) => new Promise((resolve) => {
  if (ms <= 0 || signal?.aborted) return resolve();
  const t = setTimeout(resolve, ms);
  signal?.addEventListener("abort", () => { clearTimeout(t); resolve(); }, { once: true });
});

// a recorded row as the server would have sent it: scored now, its stream-only text deltas dropped
const scored = (rec, { start, done, ...row }, rules) => ({ ...row, trace: row.trace.filter((t) => t.kind !== "delta"), score: score(row, rec.build, rules), replayed: true });

/** Send a recording's messages (after the wiring) at the pace they were recorded, checked against `rules`. */
export async function replay(rec, send, signal, rules) {
  const timeline = [];
  if (rec.kind === "rosa") {
    const row = rec.rows[0];
    for (const item of row.trace) timeline.push([row.start + item.t, item]);
    timeline.push([row.done, { kind: "result", ...scored(rec, row, rules) }]);
  } else {
    for (const row of rec.rows) {
      timeline.push([0, { kind: "queued", patientId: row.patientId }]);
      for (const item of row.trace) timeline.push([row.start + item.t, { kind: "event", patientId: row.patientId, item: { ...item, text: item.text?.slice(0, 300) } }]);
      timeline.push([row.done, { kind: "patient", row: scored(rec, row, rules) }]);
    }
  }
  timeline.sort((a, b) => a[0] - b[0]);
  const t0 = Date.now();
  for (const [ms, msg] of timeline) {
    await sleep(t0 + ms / SPEED - Date.now(), signal);
    if (signal?.aborted) return;
    send(msg);
  }
  if (rec.kind === "cohort") send({ kind: "summary", build: normalize(rec.build), summary: summarize(timeline.filter(([, m]) => m.kind === "patient").map(([, m]) => m.row)) });
}
