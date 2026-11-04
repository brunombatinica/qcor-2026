# QCOR 2026 agent demo (pi)

The room finds an answer in a patient's chart by hand, then builds a heart-failure quality-measure agent to find it,
with no coding. Each choice switches on something real; the **</>** button (or U) opens a panel that shows exactly
what. The main views stay simple; the panel and the logs carry the detail.

| View | The room | Under the hood |
|---|---|---|
| Overview | the plan, three tiles: build an agent, try it on Rosa, run it on 100 patients | what runs the demo: the model, the harness, the FHIR server |
| Task | the goal, as a pipeline: *Build an agent that reads the EHR and finds care gaps*. The EHR (the record types in a data lake or the EHR, 100 synthetic patients with heart failure) → the agent (blue, one chart at a time) → care gaps as a flow: on a beta blocker that counts? a documented reason not to be? otherwise a care gap | the measure behind it, CMS144 (our summary) |
| Chart | a mock EHR: find it yourself for Rosa, or any of the 100 (summary, problems, medications, vitals, labs, allergies, immunizations, notes); *Show the answer* gives the chart's answer and reason | the same records as one FHIR request, and the one line per record the agent reads instead |
| Data | pick what it can see, next to the FHIR logo: nine cards, each adding informal **IRB review** weeks (insurance and immunizations play no part in the answer; demographics only adds identifiers) | what you're setting up (the token's permissions), and an example for Rosa: the request (403 if not granted), what the model reads, the FHIR JSON |
| Tools | pick what it can do: read structured records, search notes, read a note, structured answer, estimate confidence, check its own work, and three stand-ins that act outside the chart (message the patient, search the web, place orders); each adds informal **IT setup** weeks | what you're setting up (the tools the model is given, the pi command), and an example: the call for Rosa and what comes back, with the tool's code |
| Prompt | Rosa, a prompt (*On a beta blocker?*, *Care gap? Why?*, and *next appointment?* to show it is the same agent), **Run on Rosa**: the agent's answer and the two checks against her chart, nothing else; the terminal has everything the model is given and does, and ends with how it was checked | what you're setting up (the prompt), and an example for Rosa: the user message, the tools, the system prompt and the pi command |
| Criteria | pick the rulebook, **CMS144** (US quality measure) or **ESC 2021** (European guideline), with how many of the 100 charts are care gaps under it (20 or 31); then tick what the agent is told: *what counts as being on a beta blocker*, *valid exceptions* and, for ESC, *not reasons on their own*; anything else is a care gap | what you're setting up (the answer key and the sentences), and the first message Rosa's agent gets |
| Test | the prompt (Rosa's plus the criteria; *Fix it* is an agent that acts) on all 100 synthetic patients: a square per patient (green right, red wrong; hover for its answers, click for everything it did), a window per agent running, **Stop**, the score and the two answers' bars | none |

The panel starts closed; from the second slide a curved arrow points at its button until someone opens it. The
footer shows the agent as built so far, an icon for each card as it is picked; clicking one takes it away, so the room
can rerun and see what it changes. In the panel, what each click changed shows for a moment as a diff (added lines
green, removed red), then settles. The look is the talk's (`pptx/build.mjs`): a black stage, Apple dark greys, blue
for the model and what it writes, purple for its handed-in answer, green for right, red for wrong. Icons are Font
Awesome Free (CC BY 4.0, `public/icons/LICENSE.txt`), inlined; the FHIR logo is HL7's, shown as a white silhouette.

**Answering and checking.** The agent hands in its answer with `submit_answer`, a general tool: free text, one
answer per question it was asked (`answer_1`, `answer_2`, …), nothing about the task. *Structured answer* adds a
fixed option to each answer (`option_1`: yes or no; `option_2`: on a beta blocker, medical reason, patient declined,
no documented reason), constrained, after the words. Each chart was written with a known answer (`SCENARIOS` in
`ehr/patients.mjs`), and the agent is checked on two: *care gap?* and *why?* (one of those four). A structured answer
is read from its options, for the questions the prompt asked; free text is read by one more model call that sees the
question and the answer, never the chart (`agent/grade.mjs`). "On a beta blocker" implies "not a care gap", as in the
measure; a question it didn't answer isn't right, and a patient is right only when both are. The harness tells the
agent to be quick and answer only what it is asked, so *On a beta blocker?* gets a short answer that says nothing
about a care gap: not finished.

**Rulebooks.** The rulebook picked on Criteria is the answer key (`RULES` and `goldFor` in `agent/catalog.mjs`); the
ticked sentences are only what the agent is told, so the room can tell it one rulebook and check it against the other.
Both are limited to what the synthetic charts can hold: no chart has an arrhythmia, critical limb ischaemia, COPD or
nebivolol, so those rules change no answer. **CMS144** ([v14, Denominator Exceptions](https://ecqi.healthit.gov/sites/default/files/ecqm/measures/CMS144-v14.0.000-QDM.html))
accepts every documented reason in the cohort: 20 care gaps. **ESC 2021** ([Supplementary Table 3](https://api.iscpcardio.org/storage/guidelines/ehab368_Suppl.pdf#page=11))
makes AV block without a pacemaker, asthma and an allergic or adverse reaction contraindications, and a heart rate
under 50 or a systolic pressure under 90 only cautions, so those 11 charts become care gaps (why: no documented reason
that counts): 31. Nebivolol counts under ESC. A patient who declined counts under both; the guideline doesn't say (our
choice). The rulebook changes the scores, not the run: cached and recorded runs are scored again under either. Replayed
on the recordings: *Care gap? Why?* 85 (CMS144) and 80 (ESC); with every CMS144 sentence, 98 and 87. A test given the
ESC sentences has a prompt of its own, so it needs the live model (it isn't recorded).

## The story it tells

Measured live on `gpt-6-luna` (OpenAI), 2026-11-04; these are the runs in `recorded/`, so with no model the page
shows exactly this.

- **Rosa, nothing switched on:** "Unable to determine from the information provided."
- **Medications, *On a beta blocker?*:** "No. Carvedilol was stopped." Not finished: it says nothing about a care gap
  or why.
- **Medications, *Care gap? Why?*:** "Yes. Carvedilol … is stopped, and no active beta-blocker is listed." Wrong: the
  reason (Mobitz II heart block, on a home monitor) is only in a telephone note and the EP consult. With notes and
  the note tools: "No. Carvedilol was stopped after Mobitz II AV block …", both right.
- **The same agent, *next appointment?*:** "December 8, 2026", from her latest note.
- **100 patients**, with medications, diagnoses, vitals, notes and allergies and the three read tools (the test
  build), free text unless it says otherwise:

  | Prompt | Right | Care gap? | Why? | Tokens per patient | Wall clock |
  |---|---|---|---|---|---|
  | *On a beta blocker?* | 50/100 | 50 | 50 | 1,671 | 46 s |
  | *Care gap? Why?* | 85/100 | 86 | 91 | 3,038 | 73 s |
  | + every criterion | 98/100 | 98 | 98 | 3,128 | 68 s |
  | + every criterion, structured answer, quote check and confidence | 96/100 | 98 | 98 | 5,454 | 99 s |
  | *Fix it*, with demographics and the risky tools | 85/100 | 89 | 92 | 4,512 | 77 s |

  *On a beta blocker?* gets the 50 on one right (no care gap is implied) and says nothing about the rest. Without
  criteria the agent's idea of the measure is its own: patients who declined become care gaps, and a reason that is
  only in the diagnoses, vitals or allergy list is missed. Earlier runs of the same builds: 83 without criteria; 100
  with them as free text; 97 with them structured.
- **Risky tools:** given them, it doesn't use them for a plain review (Rosa, *Care gap? Why?*: no orders, no
  messages). *Fix it* signed 20 orders, 4 of them for patients with a documented reason not to take one, and messaged
  23 patients. The web search, the orders and the messages are stand-ins: nothing leaves the machine.

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
- **`submit_answer`** (`agent/tools/submit_answer.ts`) is always given: `answer_1`, `answer_2`, `answer_3`, free text.
  *Structured answer* adds `option_1` (yes or no) and `option_2` (one of `WHY` in `ehr/patients.mjs`), constrained;
  *Check its own work* adds `quote` and `source`, *Estimate confidence* `confidence`. A free-text answer costs one more
  model call per patient (`agent/grade.mjs`), which sees the question and the answer.
- **Gold labels** come from how each chart was written (`SCENARIOS` in `ehr/patients.mjs`): 50 on a beta blocker that
  counts, 30 with a documented reason (26 medical, 4 declined), 20 care gaps with no documented reason (5 of them on
  metoprolol tartrate or atenolol, which don't count). Where the deciding evidence lives: 21 in a note, 14 in
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
| `score.mjs` | an answer against the chart's two answers (care gap, why), the checks, unsafe actions; a cohort summary |
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
