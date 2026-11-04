// Replay with no model: the recorded runs (recorded/, from record.mjs) come back as the page expects them, scored
// again; a build that wasn't recorded is refused. It also fails when a planned build is missing or a recording is
// stale (the cohort or the instructions changed since), so the replay can't quietly go wrong: `npm run record`.
//
//   node test/replay.mjs        (part of npm test; needs no model)

import assert from "node:assert/strict";

process.env.DEMO_REPLAY = "1";
process.env.DEMO_REPLAY_SPEED = "1000";
process.env.DEMO_BASE_URL = "http://127.0.0.1:9/v1";      // nothing listens: a model call would fail
process.env.PORT = "0";
process.env.HOST = "127.0.0.1";
const { PLAN } = await import("../record.mjs");
const { recordings, stale } = await import("../replay.mjs");
const { summarize } = await import("../score.mjs");
const { server, ready } = await import("../server.mjs");
const base = `http://127.0.0.1:${await ready}`;

const post = (path, body) => fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
async function events(path, body) {
  const text = await (await post(path, body)).text();
  return text.split("\n\n").filter((c) => c.startsWith("data: ")).map((c) => JSON.parse(c.slice(6)));
}

// every planned build is recorded, on the current cohort and instructions
assert.deepEqual(stale, [], "stale recordings: npm run record");
const recs = [...recordings.values()];
const missing = PLAN.filter((p) => !recs.some((r) => r.id === p.id));
assert.deepEqual(missing.filter((p) => !p.live).map((p) => p.id), [], "planned builds not recorded: npm run record <id>");
for (const p of missing) console.log(`replay: ${p.id} not recorded yet (needs the live model: just demo-record ${p.id})`);

// the page is told it is a replay, and which builds it can load
{
  const cfg = await (await fetch(`${base}/api/config`)).json();
  assert.ok(cfg.replay && cfg.replay.models.length && cfg.replay.recorded);
  assert.deepEqual(cfg.recorded.map((r) => r.id), PLAN.filter((p) => !missing.includes(p)).map((p) => p.id), "in the planned order");
}

// Rosa: the wiring, the trace as it streamed, then the answer, scored now
for (const rec of recs.filter((r) => r.kind === "rosa")) {
  const ev = await events("/api/run", { build: rec.build, patient: "p000" });
  assert.equal(ev[0].kind, "wiring");
  const result = ev.at(-1);
  assert.equal(result.kind, "result", rec.id);
  assert.ok(result.replayed && result.score && result.score.questions, rec.id);
  assert.ok(!result.trace.some((t) => t.kind === "delta"), "deltas stream, but aren't in the trace");
  assert.equal(ev.length - 2, rec.rows[0].trace.length, `${rec.id}: every recorded event is sent`);
}

// a cohort: each patient's events, its row, then a summary of exactly those rows
for (const rec of recs.filter((r) => r.kind === "cohort")) {
  const ev = await events("/api/cohort", { build: rec.build, n: 100 });
  const rows = ev.filter((e) => e.kind === "patient").map((e) => e.row);
  assert.equal(rows.length, 100, rec.id);
  assert.ok(rows.every((r) => r.replayed && r.score));
  assert.ok(ev.some((e) => e.kind === "event"), "events stream");
  const sum = ev.at(-1);
  assert.equal(sum.kind, "summary");
  assert.deepEqual(sum.summary, summarize(rows));
  assert.equal(sum.summary.errors, rec.rows.filter((r) => r.status !== "ok").length, rec.id);
}

// whitespace in the prompt doesn't matter; anything else that wasn't recorded is refused, without calling a model
{
  const rec = recs.find((r) => r.kind === "rosa");
  const ev = await events("/api/run", { build: { ...rec.build, prompt: `  ${rec.build.prompt.replace(/ /g, "\n")} ` }, patient: "p000" });
  assert.equal(ev.at(-1).kind, "result");
  for (const [path, body] of [["/api/run", { build: { prompt: "Say hello." }, patient: "p000" }], ["/api/run", { build: rec.build, patient: "p001" }], ["/api/cohort", { build: { prompt: "Say hello." } }]]) {
    const res = await post(path, body);
    assert.equal(res.status, 404);
    assert.match((await res.json()).error, /wasn't recorded/);
  }
}

server.close();
console.log(`replay: ${recs.length} recordings checked`);
