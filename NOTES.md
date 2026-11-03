# QCOR 2026 workshop: working notes

Handoff notes for picking the brainstorm back up in a new session. To restart, tell Claude:
"read NOTES.md and let's continue the QCOR brainstorm."

## demo (2026-10-27): one demo, with recorded runs

The user: the simulated demo (`demo/` on port 8770) was out of date; use the pi demo (port 8771) and give it recorded
runs instead of keeping a separate demo. Done: `demo/`, `serve.py`'s model proxy and `just qcor-demo` are gone, and
`serve.py` serves only the talk and the style book. `demo_pi/` replays the planned builds, recorded on Qwen into
`recorded/`, when there is no model or with `--replay` (`demo_pi/README.md`, "With no model: recorded runs").

## talk (2026-10-27): simplify the LLM part, drop RL and FHIR

The user's notes from the review:

- Introduce the LLM as the thing that can *understand* the chart (the abstractor's job).
- Remove reinforcement learning.
- The spine is **model → model + context → agent**: introduce it once, early, as the frame for the LLM parts. It is
  crucial, so the slides should hang off it.
- The slides already exist: avoid repeating them, mix them around and simplify.
- Remove everything about FHIR.

Done (50 → 38 slides, six parts):

- The bridge slide after the abstractor is now the ladder (model → model + context → agent); the tracker names parts
  1–3 after the rungs. The old ladder slide before the tool call is gone; "send everything" now ends on "let it fetch".
- Removed: the reinforcement-learning slide (and its generators and CSS), in-context learning (its school/desk idea
  and "rules in the prompt" moved into "Put the facts in the prompt"), Think-Act-Observe (folded into the replay),
  "pick the model" (repeated "many models"), the whole "Into the EHR" part (all seven FHIR slides), the FHIR draft
  order on "From reading to acting", and "jagged" from the ghost slide (the jagged-frontier slide covers it).
- Training notes shortened; post-training is one sentence ("further training on example conversations").

## demo_pi (2026-10-20, fifth pass)

The user's changes, all made:

- **Data:** pharmacy fills and ECG & echo are gone. Five cards play no part in the answer (insurance,
  immunizations, family history, social history, appointments). Every card adds informal IRB review weeks.
- **Tools:** every tool adds informal IT setup weeks.
- **Under the hood:** open by default, with highlighting, zoom and widen. After each click it shows a short diff
  (green added, red removed), then settles. It is not shown on Prompt or Test.
- **Three questions:** the review now asks whether a beta blocker is given, why or why not, and whether this is a
  care gap. Each is scored separately by a judge call (`agent/grade.mjs`), and a patient is right only with all three.
- **Examples:** they build up the three questions. *Fix it* moved to the Test view as the last example.
- **Harness:** tells the agent to be quick and answer only what is asked; the tool budget is 6. As a result, short
  prompts get short, incomplete answers.
- **Test:** fixed at 100 patients, with a live right/wrong tally, ✗ squares, a hover card per patient and a legend.

Measured on 100 patients: 0 → 59 → 77 with the criteria, 69 with the distractors (table in `demo_pi/README.md`).
Judge pitfall, now fixed: yes/no fields were read as "does it say whether…", so they use `on`/`not_on` and
`gap`/`no_gap`.

## demo_pi (2026-10-17, fourth pass)

Restructured to the user's brief: six views (brief → data → tools → prompt → criteria → test), black and minimal,
with an under-the-hood panel and a pi terminal with a wall clock. The changes:

- **Data:** the data cards are FHIR R4 resources behind a scoped token (`ehr/fhir.mjs`).
- **Prompt:** the prompt is free text; the old fixed `task.md` is gone.
- **Criteria:** CMS144v14 criteria (checked on eCQI, v14 QDM HTML) plus three distractors that aren't in the measure.
- **Rosa:** her reason is heart block (Mobitz II on a home event monitor), recorded only in notes.
- **Generator:** the patient generator lives in `ehr/`. The old `data/patients.mjs` was caught by the repo's `data/`
  gitignore and never committed.

Run against the real vLLM model: Rosa goes wrong → right with the "Find out why" prompt plus notes. 100 patients: 88
→ 100 with the criteria, 92 with the distractors; about 1 to 2 minutes per 100 at 8 concurrent. Numbers are in
`demo_pi/README.md`. The Rosa mismatch with the talk still stands.

## demo_pi (2026-10-16, third pass)

The user asked for a second demo built on pi with real code behind a simple page: `demo_pi/`. It covers one
medication (beta blockers in HFrEF). The room's choices are data, tools and checks (quotes or confidence), and some
of them are wrong on purpose (fills, problem list, billing codes, web search, orders). It runs on Rosa, then 100
synthetic patients. The constraints: 5 minutes, no coding, synthetic data is fine, nothing from the HFQ paper. It is
tested only against a regex stand-in model; it has not been run against vLLM yet. Rosa's beta-blocker story there
(stopped for Mobitz I, a documented reason) differs from the talk's (metoprolol tartrate, a gap): pick one.

## Where we are (2026-10-16, second pass)

The user found the first deck "terrible and boring". It has been rebuilt:

- **No title slide and no catchphrases.** It opens with a case presentation of Rosa, and the question is broadened to
  "is she getting appropriate care, and where could it be better?"
- **Seven signposted parts:** the case, what an LLM is, context, agents, setting one up, into the EHR, and safety and
  the real world. A tracker at the top shows where you are.
- **Animated mechanics:**
  - next-token generation with live probability bars
  - a training widget: guess → compare → nudge → repeat
  - the guess with no chart vs. the answer once the echo report is in context
  - in-context learning
  - copy-paste by hand with a moving cursor
  - a SQL query that later breaks
  - a context flood with an accuracy curve
  - a tool call generated token by token
  - harness packets
  - a replay of the agent working through Rosa's chart
- **Real material:**
  - model logos, open vs. closed
  - METR and OWID charts
  - the Karpathy ghost tweet (text from fxtwitter)
  - raw FHIR JSON, then the harness translating it to one line
  - SMART scopes
  - ChatEHR and Shah's "build from within"
- **Colours:** black background with amber accent; blue = context, violet = tools, green/red = right/wrong.
- **Assets:** six Rosa styles and a shared icon set (`shared/icons.js`); see `gallery.html`. `rosa.svg` is now the
  "flat" style.
- **Demo:** simplified to five guided steps. The user's message was cut off at "have 'wrong answers t…"; I read it as
  "show wrong answers and why". With the simulated model the ladder is 1/5 → 2/5 or 3/5 → 4/5 → 5/5.
- **Licensing to check before the day:** the METR images and the Karpathy avatar were downloaded for the draft.
  OWID is CC BY. Logos are MIT-licensed icons of others' trademarks.

## First pass (2026-10-16)

First drafts built, for review (the sections below 2026-10-13 are the earlier brainstorm):

- **`talk/`:** one deck covering both talks, black background, one idea per slide, talking points in the speaker
  notes (S).
  - **Phyllis, slides 1–16:** LLM → LLM + context → agent. Covers next-word prediction, training data, model sizes,
    post-training, recent wins, "it's a ghost", hallucination, context, who gathers context, context rot,
    Think → Act → Observe, and the harness.
  - **Bruno, slides 17–28:** set it up like a remote colleague (Task · Data · Tools · Rules · Checks). Covers
    small checkable tasks, plain-English rules, Clarity vs FHIR, tool boundaries, no quote no answer, human
    in/on/out of the loop, reading → acting, ChatEHR, "build from within", and the handoff to Lovedeep.
- **`demo/`:** the "Build an agent" pipeline builder (see `demo/README.md`). The same five words plus Model. It runs on
  Rosa and on 100 generated synthetic patients with gold labels, and compares runs. Tested with the simulated model
  and, for the HTTP/proxy path, a stand-in endpoint. **Not yet run against the real vLLM model.**
- **Dropped from the brainstorm:** the "race" (D5, beat the agent). The "team" idea (room-vs-room scoring) was only in
  chat, so there was nothing to remove from the board.
- **Facts checked (2026-10-16):**
  - OpenAI's Navier–Stokes proof was claimed on 8 Sep 2026 and is unverified (Quanta, CNN), so the slide says
    "claimed · under review".
  - ChatEHR: 1,075 users, 23,000 sessions in 3 months, 7 automations, and the "maintain agency via a vendor-agnostic,
    internally governed LLM platform" quote, from Shah et al., arXiv 2602.00074 (2026). The Nature Medicine Comment
    on ChatEHR exists but was paywalled.
  - Karpathy, "Animals vs Ghosts", Oct 2025.

## Earlier brainstorm (2026-10-13)

- **Source:** `QCOR 2026 AI Session Proposal_v2_share.docx` (this folder, untracked). The session runs 60–75 min:
  - Rohan, 2 min: why now
  - Phyllis, 5 min: what makes an agent
  - **Bruno, 5 min: "Under the hood"**
  - Lovedeep, 5 min: trust/evaluation
  - Rosemary, 5 min: patients
  - **Ryan/Bruno/Lovedeep, 15 min: live build**
  - 20 min panel

  The user said all sections are preliminary: don't anchor on the outline.
- **Audience:** clinicians. Keep it extremely simple; principles, not details. It must include a practical demo.
  Last year: Ollama plus a shared Colab notebook running small LLMs on sample data.
- **Sketches made, not yet reviewed with the user** (in `sketches/`, uncommitted):
  - `index.html`: the brainstorm board (core message, session arc, 5 talk framings, 9 demo options, a 15-minute
    plan, risks, open questions).
  - `talk.html`: draft 8-slide deck for Bruno's 5 minutes (arrow keys).
  - `workbench.html`: offline, *scripted* prototype of the live demo.

## Core proposals

1. **One synthetic patient for the whole hour.** "Mrs. Rosa Delgado", 71, HFrEF. The question: GDMT gap, or a
   documented reason? Her chart has a trap for each building block:
   - **Notes:** MRA stopped for hyperkalemia (nephrology note) and SGLT2i declined (cardiology note). The med list
     alone calls both gaps. Finding the reasons needs tools.
   - **Rules:** metoprolol *tartrate* isn't an evidence-based beta blocker, and was the largest direct-LLM error in
     the study. Fixing it needs a skill.
   - **Old values:** a copied-forward EF 45% in the 2024 problem list. Getting "most recent" right needs
     decomposition.

   Gold: HFrEF; RAS on therapy; BB **GAP**; MRA medical exception; SGLT2i patient preference.
2. **Bruno's talk framing (recommended): "onboarding the new intern".** Five parts:
   - job → task
   - protocol → skills
   - Epic login → tools
   - to-do list → plan / orchestration
   - sign-out template plus attending → proof / oversight

   The middle of the talk replays the agent's chart review. Key lines: "Let the AI read; let the rules decide",
   "the rules are written in plain English, by clinicians". Alternatives: kitchen, climb-the-ladder,
   one-patient-one-minute, agents-building-agents.
3. **Demo: switch the parts on one at a time.**
   - Chatbot: 2/5
   - Plus tools: 4/5
   - Plus skill: 5/5
   - Then attendees edit the skill on their phones and see it follow a bad rule (governance lesson)
   - A checker switch shows "no quote, no answer" sends unsupported claims to a human

   Plan: open with "You are the agent" (room votes on tools), then the leaderboard on 50 synthetic patients
   (Lovedeep), then drafting the PCP note with a human approving it. Colab is the take-home.
4. **Delivery (recommended):** a web page via QR code, using a small proxy we host with one rate-limited, capped key
   (no attendee accounts), synthetic data only, and recorded replays as the Wi-Fi fallback. Free Gemini keys are
   fiddly on the day (per-project quota, key restrictions, not free in the UK/EU). `google.colab.ai` may be Pro-only.

## Open questions for the user

1. Will the other speakers adopt the shared patient?
2. Intern framing or kitchen?
3. Who owns which demo step?
4. Will a QCOR room bring phones or laptops?
5. Live model or replay, and an open-weight or commercial model?
6. Is the 4,078 / 1,134 / 36% deployment result cleared to show, and who presents it?
7. Build FHIR sandbox (D7) and outside-fax (D8) or keep them as stretch goals?
8. Keep the patient's name?

## Caveats

- **Visuals mostly unchecked:** the sketches' logic was tested with jsdom (all switch combinations score as designed).
  Only `talk.html` has been rendered (2026-10-14, headless Chromium with its missing libraries and fonts unpacked
  from `apt-get download` debs into a scratch dir, since the container has neither and no root). `index.html` and
  `workbench.html` are still unrendered.
- **The Claude desktop app's file preview doesn't run scripts** (confirmed 2026-10-14: talk.html's hint read
  "scripts off"). talk.html therefore falls back to one scrolling page with every step shown; workbench.html can't
  work there at all. For the interactive versions, `just view` and open them in a laptop browser.
- **Preliminary numbers:** study numbers come from the ACC.27 abstract (`dissemination/ACC27_abstract/submitted/` in the agents repo).
- **Speculative:** plans for the other speakers' slots are guesses.

## Ten demos (2026-10-15)

`demos/` holds ten self-contained, offline HTML demos plus a hub (`index.html`); `demos/SPEC.md` is the shared brief
they were built from. Serve with `just demos` (port 8771). All ten were screenshot-checked in headless Chromium at
1600×900 and 390×844 and stress-tested by rapid key presses, with no console errors. Not yet reviewed with the user.

| # | Demo | Teaches |
|---|---|---|
| 01 | next-word | a model guesses the next word; a "request" word makes it an agent (token, hallucination) |
| 02 | the-loop | think → act → look on her chart; a fixed-script toggle shows what choosing the next step buys |
| 03 | race | chatbot (2/5, fast) vs agent (5/5); then the study's accuracy ranges |
| 04 | you-are-the-agent | a game: 8 turns, 4 tools, fog of war; the player's path vs the agent's |
| 05 | the-intern | task, tools, skill, plan, oversight as onboarding an intern; add/remove parts, score changes |
| 06 | the-skill | edit the plain-English protocol live; the agent obeys a bad rule; sign-off and versioning |
| 07 | the-desk | context window vs retrieval: pasting everything loses the buried notes |
| 08 | show-your-work | every answer linked to its sentence; a checker catches a hallucination; a clinician signs |
| 09 | one-to-4078 | 4,078 → 1,134 → 36% with gaps; documented exceptions aren't failures; a worklist |
| 10 | the-team | a coordinator and five helpers in parallel; checker; PCP draft; closing the loop |

Choices and caveats to check:
- Illustrative numbers, all labelled on screen: ~15 min per manual review, the fixed-script 3/5 (02), the
  paste-everything 3/5 (03, 07), tool-call counts 14 → 6 (05), helper timings and the Dec 2026 re-check (10), the
  green/amber split of the 726 non-gap patients and the ghost dots (09).
- 07 gives the protocol to both "paste everything" and "retrieve", so it scores 3/5 vs 5/5, not the chatbot's 2/5.
- 09: the synthetic cohort's gaps use only the study's 3 classes (ACEi/ARB/ARNI, BB, MRA).
- 02 counts 8 tool calls for the full trace; 04's agent path takes 6 (it reads search snippets rather than every note).
- The phone layouts work but some text in 01, 07 and 10 is small (about 8–10 px).
- Played in full, several demos run past 60 s; the presenter can advance early.
