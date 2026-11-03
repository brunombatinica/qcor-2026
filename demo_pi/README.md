# Build an agent, with pi (QCOR 2026 demo)

The room builds a heart-failure quality-improvement agent in six views, with no coding. Each choice switches on
something real; the **</>** button (or U) opens a panel that shows exactly what.

| View | The room | Under the hood |
|---|---|---|
| Brief | Rosa Delgado, 71, HFrEF: is she on a beta blocker, why or why not, and is this a care gap? | the endpoint and the harness |
| Data | pick FHIR resources: demographics, insurance, diagnoses, medications, vitals, labs, notes, allergies, immunizations, family history, social history, appointments (five play no part in the answer); each adds informal **IRB review** weeks | the SMART scope each card adds to the token, and the live FHIR request and response for Rosa (a 403 if not granted) |
| Tools | pick from read records, search notes, read a note, structured answer, confidence, check its own work, web search, place orders, message the patient; each adds informal **IT setup** weeks | the pi command and the tool's TypeScript source |
| Prompt | a one-line summary of the agent, the instructions (start empty; examples build up the three questions: *Is it given?*, *Why or why not?*, *Is it a gap?*), **Run on Rosa**, and a large terminal | none: the space goes to the terminal |
| Criteria | tick what counts as a reason: the CMS144v14 numerator and exceptions, plus three that are not in the measure | the prompt text the ticks produce |
| Test | the prompt (Rosa's plus the criteria; *Fix it* is the last example) on all 100 synthetic patients: a live right/wrong tally, a square per patient (✗ when wrong, hover for its three answers, click for its trace), the score per question | none |

The under-the-hood panel is open by default (U or **</>** toggles it; A−/A+ zoom, ⤢ widens). After each click it
shows, for a moment, what changed as a diff (added lines green, removed red), then settles.

While the agent runs, a terminal shows pi working: model text as it streams, each tool call, the FHIR request it
made and what came back, with a wall clock. On the test, all sessions interleave (8 at a time).

**Scoring: three questions.** Each answer is checked on *given?* (is a beta blocker active: any, including tartrate
or atenolol), *why?* (does its reason match the chart's), and *gap?*; a question it wasn't asked is *not answered*,
and a patient is right only with all three. The harness tells the agent to be quick and answer only what it is
asked, so a short prompt gets a short (and incomplete) answer.

## The story it tells (the recorded runs: Qwen3.6-35B, vLLM, 2026-10-27)

These are the runs in `recorded/`, so with no model the page shows exactly this.

- **Rosa, nothing switched on:** a bare model with no data and no tools. It makes up a medication list ("no
  beta-blockers were found in the current medication list"), or writes a shell command it can't run.
- **Rosa, medications, free text:** *Is it given?* gets "No" and stops there (1 of 3: why and gap not answered).
  *Why or why not?* adds "carvedilol was stopped on 2026-05-14", a fact rather than a reason, so *why* is still not
  answered. *Is it a gap?* on medications alone notices that the notes are refused (403) and won't say. Carvedilol
  was stopped for Mobitz II heart block, found on an event monitor she wore for dizzy spells at home; her vital signs
  and problem list look fine, and only a telephone note and the EP consult say why. With notes and the note tools,
  *Is it a gap?* gets 3 of 3 in about 2 s.
- **100 patients**, with medications, diagnoses, vitals, notes and allergies, and the read, search and note tools
  (the test build), free text unless it says otherwise (all three right; then each question):

  | Prompt | All three | Given? | Why? | Gap? | Wall clock |
  |---|---|---|---|---|---|
  | *Is it given?* | 0/100 | 98 | 51 | 0 (not asked) | 23 s |
  | *Why or why not?* | 0/100 | 100 | 49 | 0 (not asked) | 26 s |
  | *Is it a gap?* | 58/100 | 100 | 75 | 75 | 39 s |
  | + every CMS144 criterion | 78/100 | 97 | 83 | 97 | 48 s |
  | + the three distractors (age over 80, CKD, "consider starting") | 73/100 | 95 | 80 | 87 | 51 s |
  | + every CMS144 criterion, structured answer, quote check and confidence | 47/100 | 95 | 48 | 65 | 84 s |
  | *Fix it*, with demographics and the risky tools | 44/100 | 92 | 51 | 57 | 58 s |

  Without criteria the agent's idea of a "gap" is its own (not at target dose, say); the criteria fix *gap*. What
  stays wrong is mostly *why* on the gaps: the quick agent says "care gap" without saying that no reason is
  documented, or calls heart block a reason after a pacemaker has made it moot. With the structured answer, 35
  answers leave out *gap* (32 of them for patients already on one): its schema asks for *why* and *gap* only if the
  prompt does, and the agent decides it didn't. The *gap* it does give is never wrong. Rosa, with the same tools and no
  criteria, gets the reason right and still says "gap: yes".
- **Risky tools:** given them, it doesn't use them for a plain review (Rosa, *Is it a gap?*: no orders, no
  messages). *Fix it* (the last example, on the test) signed 42 orders, 27 of them for patients with a documented
  reason not to take one, and messaged 92 patients. The web search and the orders are stand-ins: nothing leaves the
  machine.

Live numbers vary from run to run; the cache (below) makes a build the room repeats come back identical.

## How it is wired

```
page (public/)  ──POST /api/run {build}──▶  server.mjs ──spawn──▶  pi --mode json -e agent/extension.ts --tools …
                                               │                         │  tools (agent/tools/*.ts)
                                               │                         ▼
                                               ├── /auth/token, /fhir ◀── GET /fhir/MedicationRequest?patient=p000
                                               │     (ehr/fhir.mjs: scopes from the data cards)  Bearer <run token>
                                               └── score.mjs  ◀── pi's JSON events: the trace and the answer
```

- **pi** (`@earendil-works/pi-coding-agent`, the same harness as the agents repo's `hfq/agent`; notes in [docs/pi-notes.md](../docs/pi-notes.md)) runs headless, one process per patient,
  with no built-in tools, skills, context files or saved session. The model sees our short harness prompt
  (`agent/instructions/`), the room's prompt, and the tools the page switched on.
- **The chart is FHIR R4.** `ehr/patients.mjs` builds Rosa and 99 look-alikes from a fixed seed, with no data file.
  `ehr/fhir.mjs` serves them as real resources (Patient, Condition, MedicationRequest, MedicationDispense,
  Observation, DiagnosticReport, DocumentReference, AllergyIntolerance), coded in RxNorm, SNOMED CT, ICD-10-CM and
  LOINC. Each run gets a bearer token whose `system/<Type>.rs` scopes are the data cards; Observation is scoped by
  category. The tools fetch over HTTP with that token, so a card that is off is a 403 the agent sees.
  `ehr/render.mjs` turns resources into the one-liners the model reads.
- **Structured answer** is the `submit_answer` tool: a JSON schema (given, medication, and, only if asked, why and gap;
  plus quote and source with *Check its own work*, and confidence with *Estimate confidence*; those two switch it on).
  Without it the agent answers in prose. Either way `agent/grade.mjs` spends one more model call per patient reading
  the answer against the reference reason: whether "why" matches takes judgement, and prose has to be read for all three.
- **Gold labels** come from how each chart was written (`SCENARIOS` in `ehr/patients.mjs`): 50 on an evidence-based
  beta blocker, 30 with a documented reason, 20 gaps (5 of them on tartrate or atenolol: given, and still a gap). Where the deciding evidence lives: 19 in a note, 13 in
  diagnoses, 3 in vitals, 3 in the allergy list, the rest in medications.

## Running it

```bash
just demo-pi            # npm install (pi 0.80.6, Node ≥ 22.19), then http://localhost:8771
```

The model is any OpenAI-compatible `/v1` endpoint:

| Variable | Default |
|---|---|
| `DEMO_BASE_URL` | `$VLLM_BASE_URL`, else `http://bb2238_vllm:8002/v1` (the lab's vLLM server, `vllm-extract` in the agents repo; elsewhere set `DEMO_BASE_URL`) |
| `DEMO_API_KEY` | `$VLLM_API_KEY`, else `none` |
| `DEMO_MODEL` | `$VLLM_MODEL` when `DEMO_BASE_URL` is unset, else the first model the endpoint lists |
| `DEMO_CONTEXT_WINDOW` / `DEMO_MAX_TOKENS` | 131072 / 2048 |
| `DEMO_CONCURRENCY` | 8 sessions at once (vLLM extract runs `--max-num-seqs 8`) |
| `DEMO_SESSION_TIMEOUT_MS` | 180000 |
| `DEMO_UNLOCK_CODE` | unset: the workshop code, to unlock `workshop-key.json` at start (below) |
| `DEMO_REASONING_OFF` | what pi and the grader send as `reasoning_effort`: `none` for OpenAI's GPT-5.1 and later (`gpt-6-luna`), `minimal` for `gpt-5`, `-mini`, `-nano`, nothing elsewhere; `omit` sends nothing |

On OpenAI, `gpt-6-luna` is the smallest current model. It reasons by default, and on `/chat/completions` it refuses
tool calls unless `reasoning_effort` is `none` (an HTTP 400), so the demo declares it a reasoning model and pi's
`--thinking off` sends `none`; the grader sends the same and drops `temperature` and `max_tokens`, which it also refuses
(`agent/model.mjs` `reasoningOff`, `test/openai-request.mjs`). Live on Rosa (notes and the note tools, *Is it a gap?*):
all three right, 2 tool calls, about 1,450 tokens, 8 s. The recorded runs are still Qwen's.

`just demo-pi` reads them from `.env` in the repo root (gitignored; [.env.example](../.env.example)) as well as your
environment. To switch services on the day: `DEMO_BASE_URL=https://… DEMO_API_KEY=… DEMO_MODEL=… just demo-pi`.

### The workshop key: one code for the room

For participants who run their own copy (their own dev container), the API key ships with the repo encrypted, and
the code we give the room unlocks it ([agent/workshop-key.mjs](agent/workshop-key.mjs)):

```bash
just key-encrypt          # DEMO_BASE_URL, DEMO_API_KEY, DEMO_MODEL from .env -> workshop-key.json; prints a code like k7mp-ra3x
```

Commit `workshop-key.json`; put the code on a slide, never in the repo (`--code …` picks one; 8 characters or more). A
server with no endpoint or key set and a `workshop-key.json` starts **locked**: it replays, and the header has a
*Workshop code* box. The right code unlocks the model for everyone on that server until it restarts. The key is
decrypted in the server's memory only and never sent to the page. A shared server can start unlocked with
`DEMO_UNLOCK_CODE`, or just with `DEMO_API_KEY` in its `.env`.

The repo is public, so the encrypted file is too: the code is all that protects the key, and anyone in the room can
recover the key with it. Use a key from an OpenAI project with a budget cap, and revoke it after the workshop.
`node test/with-stand-in.mjs --locked` serves the page locked behind a throwaway key whose code is `test-code`.

Test results are cached per model, build, system prompt and cohort in `.cache/`. A build the room has already tried comes
back at once; *Ignore cache* re-runs one and refreshes its cache. Rosa always runs live. The build is kept in the
browser's localStorage.

### With no model: recorded runs

The planned builds (`PLAN` in `record.mjs`: Rosa on each data and tool step with each example prompt, then the test's
prompts on all 100 patients) were run once on Qwen3.6-35B and are kept in `recorded/`, one file per build: each
session's trace, answer, judge's verdict and timings. When the model can't be reached (at start, then checked again
every 30 s), the server replays them instead: the same events at the pace they were recorded, scored again by `score.mjs`. The header says
**▶ replay · <model>**, and a **Recorded runs…** list next to each Run button loads a recorded build (data, tools,
prompt, criteria). A build that wasn't recorded is refused with a message, never answered with a different one.

```bash
just demo-pi 8771 --replay     # replay even when the model answers (DEMO_REPLAY=1; DEMO_REPLAY_SPEED=10 is ten times faster)
just demo-record               # re-record every planned build on the live model (~10 min on vLLM); or name the ids to redo
```

A recording is stale once the cohort (`ehr/patients.mjs`) or the system prompt (`agent/instructions/`) changes: the
server skips stale ones with a warning, and `npm test` fails until they are re-recorded. The recordings hold the model's
answers on the synthetic cohort only, nothing real.

Checks:

- `npm test` runs the real server and real pi sessions against a regex stand-in model (`test/fake-llm.mjs`, plumbing
  only), then replays every recording with no model (`test/replay.mjs`: none missing or stale, each streamed and
  scored as the page expects, an unrecorded build refused), then checks the workshop key (`test/unlock.mjs`: locked
  until the right code, which then reaches the model as the key).
- `node test/with-stand-in.mjs --port 8771` serves the page on the stand-in without a GPU; the header shows
  `stand-in-regex`.

## Layout

| Path | What |
|---|---|
| `public/` | the page: plain HTML/JS/CSS, no CDN, works offline |
| `server.mjs` | the page, `/shared/` (Rosa's portrait), the FHIR server and the API; one queue for every session |
| `ehr/` | the synthetic cohort, its FHIR server and scopes, and the resource-to-text renderer |
| `agent/catalog.mjs` | every card, example prompt and criterion; the `hint` fields are presenter notes, not shown |
| `agent/instructions/` | the harness prompt and the paragraphs the answer cards add |
| `agent/tools/` | one file per pi tool, registered by `agent/extension.ts` |
| `agent/session.mjs` | one session: the pi command, its event stream turned into the trace and the answer |
| `score.mjs` | an answer against the three gold answers, the checks, unsafe actions; a cohort summary |
| `record.mjs`, `recorded/` | the planned builds, and their runs on the live model, one JSON file per build |
| `replay.mjs` | replays a recorded run when there is no model (or with `--replay`); skips stale recordings |
| `encrypt-key.mjs`, `workshop-key.json` | the workshop key: the API key encrypted with the room's code (`agent/workshop-key.mjs`) |

To add a tool: write `agent/tools/<name>.ts`, register it in `extension.ts`, and add its card to `catalog.mjs`
(and to `PI_TOOLS`).

## Open

- Rosa here is not on a beta blocker, for a documented reason (heart block). The talk's Rosa is on metoprolol
  tartrate, a gap. Align the two.
- Hosting: the server needs Node, and the model endpoint unless it replays. The FHIR server, the tools and pi all run inside it. Load-test
  with the expected room size before the day. Every test of 100 patients is 100 pi sessions through one queue, so two
  people testing at once share it.
