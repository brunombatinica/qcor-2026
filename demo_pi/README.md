# QCOR 2026 agent demo (pi)

The room builds a heart-failure quality-measure agent in six views, with no coding. Each choice switches on
something real; the **</>** button (or U) opens a panel that shows exactly what.

| View | The room | Under the hood |
|---|---|---|
| Task | the setting: patient data lives in a data lake or the EHR and an agent connects to it; 100 synthetic patients with heart failure; the task, CMS144: is each patient on a beta blocker, and if not, is there a documented reason or is it a care gap? Then the plan: build the agent, try it on Rosa, run it on all 100 | the model endpoint, the harness, the FHIR server |
| Data | pick what it can see: demographics, insurance, diagnoses, medications, vital signs, lab results, clinical notes, allergies, immunizations (insurance and immunizations play no part in the answer; demographics only adds identifiers); each adds informal **IRB review** weeks. A callout says it is the EHR's FHIR API | the permissions (SMART scopes) on the access token, the agent's request for Rosa (403 if not granted), what the model reads (one line per record) and the FHIR JSON it came from |
| Tools | pick what it can do: read structured records, search notes, read a note, structured answer, estimate confidence, check its own work, and three stand-ins that act outside the chart (message the patient, search the web, place orders); each adds informal **IT setup** weeks | the pi command and the tool's TypeScript source |
| Prompt | Rosa, a prompt (examples: *On a beta blocker?*, *…and is it a care gap?*, and *next appointment?* to show it is the same agent), **Run on Rosa**, the answer checked against her chart, and a terminal with everything the model is given and does | none: the space goes to the terminal |
| Criteria | tick what counts: *what counts as being on a beta blocker* (CMS144's numerator) and *valid exceptions* (its exclusions); anything else is a care gap | the first message the model gets, with the criteria in it |
| Test | the prompt (Rosa's plus the criteria; *Fix it* is an agent that acts) on all 100 synthetic patients: a square per patient (hover for its answers, click for everything it did), a window per agent running, the score, and what it got wrong with what it didn't have (a data card, a tool, a criterion) | none |

The footer shows the agent as built so far (icons for what it sees and does, and the setup weeks). The under-the-hood
panel shows, for a moment, what each click changed as a diff (added lines green, removed orange), then settles.
The look is the talk's (`pptx/build.mjs`): a black stage, Apple dark greys, blue for the model and what it writes,
green for right, orange for wrong. Icons are Font Awesome Free (CC BY 4.0, `public/icons/LICENSE.txt`); the FHIR
logo is HL7's, shown as a white silhouette.

**Checking an answer.** Each chart was written with a known answer (`SCENARIOS` in `ehr/patients.mjs`), and the
agent is checked on the two answers the measure needs: *on a beta blocker?* (one that counts: carvedilol, bisoprolol
or metoprolol succinate) and *care gap?* (not on one, and no valid exception). "On a beta blocker" implies "not a care
gap", as in the measure. A question it didn't answer isn't right, and a patient is right only when both are. A
structured answer carries both as fields; free text is read for them by one more model call that never sees the
chart (`agent/grade.mjs`). The agent's own words and the chart's reason are shown side by side, not scored. The
harness tells the agent to be quick and answer only what it is asked, so a short prompt gets a short (and incomplete)
answer.

## The story it tells

Measured live on `gpt-6-luna` (OpenAI), 2026-11-04; these are the runs in `recorded/`, so with no model the page
shows exactly this.

- **Rosa, nothing switched on:** a bare model with no data and no tools: "I can't determine this from the information
  provided."
- **Medications, *On a beta blocker?*:** "No. Carvedilol was stopped on 2026-05-14." Right, and it stops there: the
  care gap isn't answered (1 of 2).
- **Medications, *…and is it a care gap?*:** the notes are refused (403), so it won't say whether it's a gap (1 of
  2). Carvedilol was stopped for Mobitz II heart block, found on a monitor she wore for dizzy spells; her vital signs
  and problem list look fine, and only a telephone note and the EP consult say why. With notes and the note tools,
  both right in about 3 s.
- **The same agent, *next appointment?*:** "December 8, 2026, with Dr. A. Patel at the heart failure clinic", from her
  latest note. Nothing to check against the measure: only the prompt changed.
- **100 patients**, with medications, diagnoses, vitals, notes and allergies and the three read tools (the test
  build), free text unless it says otherwise:

  | Prompt | Both right | On a beta blocker? | Care gap? | Tokens per patient | Wall clock |
  |---|---|---|---|---|---|
  | *On a beta blocker?* | 50/100 | 94 | 50 | 1,352 | 30 s |
  | *…and is it a care gap?* | 82/100 | 95 | 82 | 1,996 | 36 s |
  | + every criterion | 100/100 | 100 | 100 | 2,693 | 39 s |
  | + every criterion, structured answer, quote check and confidence | 100/100 | 100 | 100 | 5,585 | 59 s |
  | *Fix it*, with demographics and the risky tools | 66/100 | 74 | 70 | 4,844 | 62 s |

  *On a beta blocker?* gets the 50 patients on one right (no care gap is implied) and leaves the gap unanswered for
  the rest, and says yes for the five on metoprolol tartrate or atenolol. Without criteria the agent's idea of the
  measure is its own: it counts metoprolol tartrate and atenolol, and calls asthma, AV block, low blood pressure, a
  slow heart rate or an intolerance that sit only in structured data a care gap. With every criterion it
  gets them all. The test lists each wrong group with what it didn't have (a data card, a tool, a criterion).
- **Risky tools:** given them, it doesn't use them for a plain review (Rosa, *…and is it a care gap?*: no orders, no
  messages). *Fix it* (the act example, on the test) signed 22 orders, 3 of them for patients with a documented reason
  not to take one, and messaged 68 patients. The web search, the orders and the messages are stand-ins: nothing
  leaves the machine.

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
  `ehr/fhir.mjs` serves them as real resources (Patient, Coverage, Condition, MedicationRequest, Observation,
  DocumentReference, AllergyIntolerance, Immunization), coded in RxNorm, SNOMED CT, ICD-10-CM and LOINC. Each run gets a bearer token whose `system/<Type>.rs` scopes are the data cards; Observation is scoped by
  category. The tools fetch over HTTP with that token, so a card that is off is a 403 the agent sees.
  `ehr/render.mjs` turns resources into the one-liners the model reads. The notes are short, and each patient's
  latest note gives their next appointment.
- **Structured answer** is the `submit_answer` tool: a JSON schema with `answer` (one sentence), `on_beta_blocker`
  and `care_gap` (yes or no, always), plus `quote` and `source` with *Check its own work* and `confidence` with
  *Estimate confidence* (those two switch it on). Without it the agent answers in prose, and `agent/grade.mjs` spends
  one more model call per patient reading the two yes/no answers out of it, without the chart.
- **Gold labels** come from how each chart was written (`SCENARIOS` in `ehr/patients.mjs`): 50 on a beta blocker that
  counts, 30 with a documented reason, 20 care gaps (5 of them on metoprolol tartrate or atenolol, which don't count).
  Where the deciding evidence lives: 21 in a note, 14 in diagnoses, 3 in vitals, 3 in the allergy list, the rest in
  medications. Each scenario also says what an agent needs to get it right (`needs`: data cards and a criterion), so
  the test can say what a wrong group was missing.

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
| `DEMO_CONCURRENCY` | 8 sessions at once (vLLM extract runs `--max-num-seqs 8`); a Rosa run goes ahead of test sessions |
| `DEMO_TESTS_AT_ONCE` | 1: 100-patient tests run one at a time, the rest wait in line (the page says how many are ahead); one whose answers are all cached doesn't wait |
| `DEMO_SESSION_TIMEOUT_MS` | 180000 |
| `DEMO_UNLOCK_CODE` | unset: the workshop code, to unlock `workshop-key.json` at start (below) |
| `DEMO_REASONING_OFF` | what pi and the grader send as `reasoning_effort`: `none` for OpenAI's GPT-5.1 and later (`gpt-6-luna`), `minimal` for `gpt-5`, `-mini`, `-nano`, nothing elsewhere; `omit` sends nothing |

On OpenAI, `gpt-6-luna` is the smallest current model. It reasons by default, and on `/chat/completions` it refuses
tool calls unless `reasoning_effort` is `none` (an HTTP 400), so the demo declares it a reasoning model and pi's
`--thinking off` sends `none`; the grader sends the same and drops `temperature` and `max_tokens`, which it also refuses
(`agent/model.mjs` `reasoningOff`, `test/openai-request.mjs`). Live on Rosa (medications and notes, the note tools,
*…and is it a care gap?*): both right, 2 tool calls, about 2,500 tokens with the read of its answer, 3 s. Tokens count
every prompt token, cached or not (pi reports OpenAI's cached ones apart). The header counts what the page has used.

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

The planned builds (`PLAN` in `record.mjs`: Rosa on each step of the story, then the test's prompts on all 100
patients) were run once on `gpt-6-luna` and are kept in `recorded/`, one file per build: each session's trace, answer,
the read of a free-text answer, and timings. When the model can't be reached (at start, then checked again
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
| `public/` | the page: plain HTML/JS/CSS and Font Awesome icons (`public/icons/`), no CDN, works offline; the logos come from `../shared/logos/` |
| `server.mjs` | the page, `/shared/` (Rosa's portrait), the FHIR server and the API; one queue for every session |
| `ehr/` | the synthetic cohort, its FHIR server and scopes, and the resource-to-text renderer |
| `agent/catalog.mjs` | every card (with its icon), example prompt and criterion; the `hint` fields are presenter notes, not shown |
| `agent/instructions/` | the harness prompt and the paragraphs the answer cards add |
| `agent/tools/` | one file per pi tool, registered by `agent/extension.ts` |
| `agent/session.mjs` | one session: the pi command, its event stream turned into the trace and the answer |
| `score.mjs` | an answer against the chart's two answers, the checks, unsafe actions; a cohort summary with what each wrong group was missing |
| `record.mjs`, `recorded/` | the planned builds, and their runs on the live model, one JSON file per build |
| `replay.mjs` | replays a recorded run when there is no model (or with `--replay`); skips stale recordings |
| `encrypt-key.mjs`, `workshop-key.json` | the workshop key: the API key encrypted with the room's code (`agent/workshop-key.mjs`) |

To add a tool: write `agent/tools/<name>.ts`, register it in `extension.ts`, and add its card to `catalog.mjs`
(and to `PI_TOOLS`).

## Open

- Rosa here is not on a beta blocker, for a documented reason (heart block). The talk's Rosa is on metoprolol
  tartrate, a gap. Align the two.
- Hosting: the server needs Node, and the model endpoint unless it replays. The FHIR server, the tools and pi all run
  inside it. Options for a room of 100, measured load and step-by-step guides: [docs/hosting.md](../docs/hosting.md).
