// The demo's server: the page in public/, the FHIR server the agent reads from, and the endpoints that turn the
// page's choices into real pi sessions.
//
//   node server.mjs [--port 8771] [--replay]   (npm start; or `just demo-pi`)
//
//   GET  /api/config    the cards (agent/catalog.mjs), Rosa, and whether the model answers
//   POST /api/preview   {build}             what a run would be given: scopes, tools, system prompt, first message, command
//   POST /api/peek      {sources, source}   one data card's FHIR request for Rosa with these scopes: status, JSON, and what the model reads
//   GET  /api/source    ?file=<tool>.ts     a tool's source, for the under-the-hood panel
//   POST /api/unlock    {code}              the workshop code: unlocks the model in workshop-key.json (agent/model.mjs)
//   POST /api/run       {build, patient}    one session, streamed as server-sent events: the trace, then the scored answer
//   POST /api/cohort    {build, n, fresh}   n patients, DEMO_CONCURRENCY at a time, streamed as they run, then a summary;
//                                           one test at a time (DEMO_TESTS_AT_ONCE), the rest wait in line
//   POST /auth/token, GET /fhir/…           the synthetic EHR (ehr/fhir.mjs)
//
// Cohort results are cached per model, build and cohort under .cache/, so a build the room has already tried comes back at
// once; `fresh` ignores the cache. Rosa always runs live. With no model (or --replay), both replay the runs recorded
// in recorded/ instead (replay.mjs).

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize as normPath } from "node:path";
import { fileURLToPath } from "node:url";
import { ACT_EXAMPLE, CRITERIA, CRITERIA_GROUPS, DATA, EXAMPLES, TOOLS, criteriaPrompt, normalize } from "./agent/catalog.mjs";
import { read } from "./agent/grade.mjs";
import { MODEL, connect, unlock } from "./agent/model.mjs";
import { FHIR, byPatientId, commandLine, piTools, runSession, systemPrompt, userPrompt } from "./agent/session.mjs";
import { handleFhir, issueToken, scopeOf } from "./ehr/fhir.mjs";
import { PATIENTS, STATUSES, TODAY } from "./ehr/patients.mjs";
import { line } from "./ehr/render.mjs";
import { COHORT, REPLAY, catalog, recorded, recordings, replay, stale } from "./replay.mjs";
import { score, summarize } from "./score.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(HERE, "public");
const SHARED = join(HERE, "..", "shared");
const CACHE = join(HERE, ".cache");
const CONCURRENCY = Number(process.env.DEMO_CONCURRENCY || 8);
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const PORT = Number(arg("--port", process.env.PORT ?? 8771));
const HOST = arg("--host", process.env.HOST || "0.0.0.0");

// one queue for every session, CONCURRENCY at a time; a Rosa run goes ahead of test sessions, so a click on Run on
// Rosa doesn't wait behind someone's 100 patients. A finished session hands its slot straight to the next one.
let running = 0;
const waiting = { rosa: [], cohort: [] };
async function slot(fn, lane = "cohort") {
  if (running < CONCURRENCY) running += 1;
  else await new Promise((r) => waiting[lane].push(r));
  try { return await fn(); } finally {
    const next = waiting.rosa.shift() || waiting.cohort.shift();
    if (next) next(); else running -= 1;
  }
}

// 100-patient tests run TESTS_AT_ONCE at a time (default 1), in the order they were asked for: one test at a time
// keeps the room under the model's tokens-per-minute limit (../docs/hosting.md). A test that waits is told how many
// are ahead of it; one whose answers are all in the cache doesn't wait.
const TESTS_AT_ONCE = Number(process.env.DEMO_TESTS_AT_ONCE || 1);
let testsRunning = 0;
const testLine = [];                                  // { start, tell }
const tellLine = () => testLine.forEach((t, i) => t.tell(testsRunning + i));
function nextTest() {
  while (testsRunning < TESTS_AT_ONCE && testLine.length) { testsRunning += 1; testLine.shift().start(); }
  tellLine();
}
/** Waits for a test's turn: resolves to the function that ends it, or null if the page left while waiting. */
function testTurn(signal, tell) {
  return new Promise((resolve) => {
    let ended = false;
    const end = () => { if (!ended) { ended = true; testsRunning -= 1; nextTest(); } };
    const entry = { start: () => resolve(end), tell };
    testLine.push(entry);
    signal.addEventListener("abort", () => {
      const i = testLine.indexOf(entry);
      if (i >= 0) { testLine.splice(i, 1); tellLine(); resolve(null); }
    }, { once: true });
    nextTest();
  });
}

// a cached result is reused only for the same model, build, system prompt and cohort (editing instructions/ or
// ehr/patients.mjs invalidates it)
const SCORING = 7;                                    // bump when reading free text changes (agent/grade.mjs); scores are recomputed
const buildKey = (b) => createHash("sha1").update(JSON.stringify([MODEL.baseUrl, MODEL.id, b, systemPrompt(b), COHORT, SCORING])).digest("hex").slice(0, 12);

// cache: "use" reads and writes it, "refresh" only writes it (the page's "ignore cache"), absent leaves it alone
const cacheFile = (build, patientId) => join(CACHE, buildKey(build), `${patientId}.json`);
async function runScored(patientId, build, { onEvent, signal, cache, stream, lane } = {}) {
  const file = cache && cacheFile(build, patientId);
  if (cache === "use" && existsSync(file)) { const row = JSON.parse(readFileSync(file, "utf8")); return { ...row, score: score(row, build), cached: true }; }
  const result = await slot(() => (signal?.aborted ? { patientId, trace: [], usage: { input: 0, output: 0 }, status: "cancelled" } : runSession({ patientId, build, onEvent, signal, stream })), lane);
  // a free-text answer is read by one more model call, for its two yes/no answers; a structured one needs none
  if (!result.answer && result.text) result.read = await read(result.text);
  const row = { ...result, score: score(result, build) };
  if (file && result.status === "ok") { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, JSON.stringify(row)); }
  return row;
}

function sse(res) {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive", "X-Accel-Buffering": "no" });
  return (obj) => { if (!res.writableEnded) res.write(`data: ${JSON.stringify(obj)}\n\n`); };
}

const readBody = (req) => new Promise((resolve) => {
  let b = "";
  req.on("data", (d) => (b += d));
  req.on("end", () => {
    if ((req.headers["content-type"] || "").includes("x-www-form-urlencoded")) return resolve(Object.fromEntries(new URLSearchParams(b)));
    try { resolve(JSON.parse(b || "{}")); } catch { resolve({}); }
  });
});
const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(obj)); };

function wiring(build, patient) {
  const b = normalize(build);
  return { scopes: b.sources.map((id) => scopeOf(DATA.find((d) => d.id === id))), tools: piTools(b), command: commandLine(patient, b), system: systemPrompt(b), prompt: userPrompt(patient, b) };
}

// replay when told to, or when the model can't be reached (asked again at most every 30 s, so a dead network doesn't
// hold up every run)
let lastTry = 0;
async function replaying() {
  if (REPLAY) return true;
  if (!MODEL.ok && Date.now() - lastTry > 30_000) { lastTry = Date.now(); await connect(); }
  return !MODEL.ok;
}
const replayInfo = () => {
  const recs = [...recordings.values()];
  return { models: [...new Set(recs.map((r) => r.model))], recorded: recs.map((r) => r.recorded.slice(0, 10)).sort().at(-1) || null, why: REPLAY ? "--replay" : `no model: ${MODEL.error}` };
};

async function config() {
  const rosa = PATIENTS[0];
  const replayed = await replaying();
  return {
    model: { id: MODEL.id, baseUrl: MODEL.baseUrl, ok: MODEL.ok, error: MODEL.error, locked: MODEL.locked },
    replay: replayed ? replayInfo() : null, recorded: replayed ? catalog() : [],
    data: DATA.map((d) => ({ ...d, scope: scopeOf(d) })), tools: TOOLS, criteria: CRITERIA, criteriaGroups: CRITERIA_GROUPS, examples: EXAMPLES, act: ACT_EXAMPLE, statuses: STATUSES,
    cohort: PATIENTS.length, names: PATIENTS.map((p) => p.name), concurrency: CONCURRENCY, today: TODAY,
    rosa: { id: rosa.id, name: rosa.name, age: rosa.age, ef: rosa.ef, gold: rosa.gold, next: rosa.next.date },
  };
}

// what the agent's Read structured records call would get for one card, with the scopes switched on: the FHIR request
// and response, and the one line per resource the model actually reads (ehr/render.mjs)
async function peek(sources, source) {
  const card = DATA.find((d) => d.id === source);
  if (!card) return { error: "unknown card" };
  const token = issueToken(sources.filter((id) => DATA.some((d) => d.id === id)));
  const path = card.query.replace("{p}", PATIENTS[0].id);
  const res = await fetch(`${FHIR.base}/${path}`, { headers: { Authorization: `Bearer ${token.access_token}` } });
  const body = await res.json();
  const resources = (body.entry || []).map((e) => e.resource);
  return { request: `GET /fhir/${path}`, token: token.access_token.slice(0, 10), scope: token.scope, status: res.status, lines: resources.map(line), body };
}

const SOURCE_FILES = new Set([...TOOLS.map((t) => t.file), "fhir.ts"]);

async function api(req, res, url) {
  if (url.pathname === "/api/config") return json(res, 200, await config());
  if (url.pathname === "/api/source") {
    const file = url.searchParams.get("file");
    if (!SOURCE_FILES.has(file)) return json(res, 404, { error: "unknown file" });
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end(readFileSync(join(HERE, "agent", "tools", file), "utf8"));
  }
  if (req.method !== "POST") return json(res, 405, { error: "POST" });
  const body = await readBody(req);
  if (url.pathname === "/api/unlock") return (await unlock(body.code)) ? json(res, 200, { ok: MODEL.ok, error: MODEL.error }) : json(res, 403, { error: "That code didn't work." });
  if (url.pathname === "/api/peek") return json(res, 200, await peek(body.sources || [], body.source));
  const build = normalize(body.build);
  if (url.pathname === "/api/preview") return json(res, 200, { ...wiring(build, byPatientId(body.patient)), criteria: criteriaPrompt(body.criteria || []) });
  const kind = { "/api/run": "rosa", "/api/cohort": "cohort" }[url.pathname];
  if (!kind) return json(res, 404, { error: "unknown endpoint" });
  let rec = null;
  if (await replaying()) {
    rec = recorded(kind, build, body.patient);
    if (!rec) return json(res, 404, { error: `${REPLAY ? "Replaying" : "No model, so replaying"} recorded runs, and this build wasn't recorded: pick one under Recorded runs.` });
  }
  const abort = new AbortController();
  res.on("close", () => abort.abort());
  const send = sse(res);

  if (kind === "rosa") {
    const patient = byPatientId(body.patient);
    send({ kind: "wiring", ...wiring(build, patient) });
    if (rec) await replay(rec, send, abort.signal);
    else send({ kind: "result", ...(await runScored(patient.id, build, { onEvent: send, signal: abort.signal, stream: true, lane: "rosa" })) });
    return res.end();
  }
  const n = Math.max(1, Math.min(PATIENTS.length, Number(body.n) || PATIENTS.length));
  send({ kind: "wiring", ...wiring(build, PATIENTS[0]), n });
  if (rec) { await replay(rec, send, abort.signal); return res.end(); }
  const cohort = PATIENTS.slice(0, n);
  const allCached = !body.fresh && cohort.every((p) => existsSync(cacheFile(build, p.id)));
  // while it waits, the place in line goes out again every 15 s, so no proxy closes a quiet stream
  let ahead = 0;
  const tell = (k) => { ahead = k; send({ kind: "line", ahead: k }); };
  const keepAlive = setInterval(() => ahead && tell(ahead), 15_000);
  const end = allCached ? () => {} : await testTurn(abort.signal, tell);
  clearInterval(keepAlive);
  if (!end) return res.end();
  if (ahead) send({ kind: "line", ahead: 0 });
  try {
    const rows = await Promise.all(cohort.map(async (p) => {
      send({ kind: "queued", patientId: p.id });
      const row = await runScored(p.id, build, {
        signal: abort.signal, cache: body.fresh ? "refresh" : "use",
        onEvent: (item) => item.kind !== "delta" && send({ kind: "event", patientId: p.id, item: { ...item, text: item.text?.slice(0, 300) } }),
      });
      send({ kind: "patient", row });
      return row;
    }));
    send({ kind: "summary", build, summary: summarize(rows) });
  } finally { end(); }
  return res.end();
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json" };

function serveStatic(res, url) {
  const [root, rel] = url.pathname.startsWith("/shared/") ? [SHARED, url.pathname.slice(8)] : [PUBLIC, url.pathname === "/" ? "index.html" : url.pathname.slice(1)];
  const file = normPath(join(root, decodeURIComponent(rel)));
  if (!file.startsWith(root) || !existsSync(file)) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  res.end(readFileSync(file));
}

export const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (url.pathname.startsWith("/api/")) return await api(req, res, url);
    if (url.pathname.startsWith("/fhir") || url.pathname === "/auth/token") return handleFhir(req, res, url, req.method === "POST" ? await readBody(req) : {});
    serveStatic(res, url);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) json(res, 500, { error: String(e.message || e) });
    else res.end();
  }
});

// A host stopping the container (Railway, on each deploy) sends SIGTERM. As the container's first process, node would
// ignore it and wait to be killed, which lengthens the gap between the old deploy and the new one.
process.once("SIGTERM", () => process.exit(0));

export const ready = new Promise((resolve) => server.listen(PORT, HOST, async () => {
  const port = server.address().port;
  FHIR.base = `http://127.0.0.1:${port}/fhir`;
  if (MODEL.locked && process.env.DEMO_UNLOCK_CODE && !(await unlock(process.env.DEMO_UNLOCK_CODE))) console.log("DEMO_UNLOCK_CODE is wrong for workshop-key.json");
  if (!REPLAY) await connect();
  console.log(`QCOR 2026 agent demo (pi): http://localhost:${port}`);
  console.log(REPLAY ? "model: none (--replay)" : MODEL.locked ? `model: ${MODEL.id} at ${MODEL.baseUrl}, locked until someone enters the workshop code` : MODEL.ok ? `model: ${MODEL.id} at ${MODEL.baseUrl}` : `model not reachable yet: ${MODEL.error}`);
  console.log(`replay: ${recordings.size} recorded runs${stale.length ? `, ${stale.length} stale and skipped (${stale.join(", ")}): npm run record` : ""}${REPLAY || !MODEL.ok ? ", replaying" : ", not used while the model answers"}`);
  resolve(port);
}));
