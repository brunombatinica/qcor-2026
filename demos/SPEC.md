# QCOR 2026 · Ten demos of clinical agents: shared spec

Ten standalone interactive web pages for the AHA 2026 QCOR workshop ("Agentic AI in Cardiovascular Care"). Each is
one take on the same question: *what is a clinical AI agent, and why does it matter?* Together they run about
**10 minutes** (about 1 minute each, presenter-driven), but each must also work as a toy someone plays with alone on
a laptop or phone after the session. `index.html` is the hub that links them in order.

## The audience

Cardiologists, nurses, quality and outcomes researchers. Smart, busy, not engineers.

- **No unexplained jargon.** When a technical word is worth teaching (agent, model, token, context window, tool,
  prompt, skill, orchestration, hallucination, FHIR, evaluation), introduce it as a small "unpacked" moment:
  the word, then a one-line plain-English meaning, ideally with a clinical analogy. Example: *"Context window:
  how much the model can hold in mind at once. Think of it as the size of the desk, not the size of the library."*
- **First principles.** Build ideas up from something they already know (an intern, a chart review, a protocol,
  a sign-out). Show *why* each part exists by showing what goes wrong without it.
- **Visual storytelling over text.** Big type, few words per screen, things that move to show cause and effect.
  If a sentence can be an animation, make it an animation.
- **Honest.** Agents make mistakes; show them. The human stays in charge. Don't oversell.

## The shared patient (synthetic, no PHI)

Every demo uses the same patient so the hour has one thread. **Mrs. Rosa Delgado, 71**, heart failure with reduced
ejection fraction (HFrEF). The clinical question: *for each guideline heart-failure drug class (GDMT), is she on it,
is there a documented reason she isn't, or is it a real gap?*

Her chart (use these texts verbatim where you show notes):

| Document | Date | Author | Text |
|---|---|---|---|
| Discharge summary | 9/2/2026 | Hospital Medicine | 71-year-old woman with HFrEF (EF 30% on TTE 8/29/2026), CKD stage 3, hypertension, admitted with acute on chronic systolic heart failure. Diuresed with IV furosemide, net -4.2 L. Discharge medications: lisinopril 10 mg daily; metoprolol tartrate 25 mg twice daily; furosemide 40 mg daily. Follow-up: cardiology clinic in 2 weeks, BMP in 1 week. |
| Echocardiogram report | 8/29/2026 | Cardiology | Left ventricle moderately dilated with global hypokinesis. LVEF 30% (biplane Simpson's). Moderate mitral regurgitation. RV systolic function mildly reduced. |
| Nursing note | 8/31/2026 | Nursing | Patient ambulated 150 ft in hallway with walker, no shortness of breath at rest. Tolerating low-sodium diet. Daily weight 69.1 kg. |
| Cardiology clinic | 6/10/2026 | Cardiology | HFrEF follow-up, NYHA class II. We discussed adding an SGLT2 inhibitor (empagliflozin). Patient declines: she had recurrent urinary tract infections on dapagliflozin in 2025 and is worried about cost. Will revisit at next visit. Continue lisinopril and metoprolol. |
| Nephrology clinic | 4/14/2026 | Nephrology | CKD stage 3b, eGFR 38. Potassium 5.9 today. Spironolactone discontinued due to hyperkalemia; would not rechallenge given CKD. Low-potassium diet education provided. Repeat BMP in 1 week. |
| Problem list | last edited 3/2024 | | Heart failure with mildly reduced ejection fraction, HFmrEF (EF 45%). Hypertension. Chronic kidney disease stage 3. |

Medication list: lisinopril 10 mg daily (active); metoprolol tartrate 25 mg twice daily (active); furosemide 40 mg
daily (active); spironolactone 25 mg daily (stopped 4/14/2026). No SGLT2 inhibitor.

Labs and vitals: potassium 5.9 mmol/L (4/14/2026); potassium 4.6 mmol/L (9/1/2026); eGFR 38 (9/1/2026); systolic
BP 112 mmHg (9/2/2026).

**The correct answer (two clinicians' review, "gold"):**

| Question | Answer | Why |
|---|---|---|
| HF type | HFrEF | most recent EF is 30% (echo 8/29/26); the 45% in the problem list is a stale 2024 value |
| ACE inhibitor / ARB / ARNI | on therapy | lisinopril |
| Beta blocker | **GAP** | metoprolol *tartrate* is not one of the evidence-based HF beta blockers (carvedilol, bisoprolol, metoprolol *succinate*); no documented reason |
| MRA | medical exception | spironolactone stopped for hyperkalemia (nephrology note) |
| SGLT2 inhibitor | patient preference | she declined (cardiology note) |

**The three traps** (each one motivates a building block):

1. **Reasons live in notes** → a chatbot that sees only the medication list calls MRA and SGLT2i "gaps". The agent
   needs **tools** to go and search/read the notes.
2. **The rule is subtle** → "metoprolol" looks fine, but *tartrate* doesn't count. This was the single largest error
   of plain LLMs in the study. The fix is a **skill**: a protocol written in plain English, by clinicians.
3. **Old values are copied forward** → the problem list says EF 45%. Getting "most recent" right needs **breaking
   the task into small steps** (find all EFs, date them, take the latest).

**Canonical scores** (use these wherever you score the five answers):

- **Chatbot** (one question, the discharge summary pasted in, no tools): **2/5**. HF type HFrEF ✓, RAS on
  therapy ✓, BB "on therapy" ✗, MRA "GAP" ✗, SGLT2i "GAP" ✗.
- **+ Tools** (can search and read the notes): **4/5**. Finds the nephrology and cardiology reasons, so MRA ✓ and
  SGLT2i ✓; BB still "on therapy" ✗ because nobody told it the tartrate rule.
- **+ Skill** (the plain-English protocol): **5/5**. BB GAP ✓.
- If you show the problem-list trap separately: an approach that trusts the problem list says HFmrEF (EF 45%) ✗.

The agent's tools, when you need names: `search_notes(query)`, `read_note(id)`, `get_medications()`, `get_labs()`.

The skill file (the agent's protocol, in plain English):

```
---
name: gdmt-gaps
description: Decide, for an HFrEF patient, whether each guideline
  drug class is used, excused, or a real gap.
---
HF type: use the most recent dated LVEF. Ignore old values
copied into problem lists. HFrEF means LVEF 40% or less.

Beta blocker counts only if: carvedilol, bisoprolol or
metoprolol succinate.
Metoprolol tartrate does not count.

Look back 12 months. Before calling anything a gap, search
the notes for a documented reason. Not a gap if the chart
documents any of:
  - a medical reason (e.g. hyperkalemia, low BP, asthma)
  - the patient declined it (patient preference)

Quote the sentence you relied on for every answer.
```

## Real study numbers (preliminary; label them "preliminary" on screen)

From the team's ACC.27 abstract (Yale; agents powered by a local 35B-parameter open-weight model; 18 clinical data
elements, 3 HF care domains; 1,000 HF patients, 2 health systems, 2 clinician annotators):

- HF type and NYHA class: agents 97–100% accurate.
- GDMT gaps: agents 96–98%; structured data alone 42–70%; structured data + keywords 79–89%; single LLM call 82–85%.
- Agents reading the live EHR interface (FHIR) 93–99%, close to 96–100% on research data extracts.
- Applied to all **4,078** Yale HF patients hospitalized in 2025: **1,134** with reduced EF; **36%** of these had at
  least one gap across the 3 assessed GDMT classes without a documented exception.
  The 3 assessed classes are ACEi/ARB/ARNI, beta blocker and MRA (`backup/v0/figures/evaluation.py` in the agents repo); SGLT2i was not one of
  them. Mrs. Delgado's question includes SGLT2i; the population numbers don't.

Don't invent other numbers. Illustrative numbers (e.g. "a manual chart review takes ~15 minutes") must be labelled
"illustrative".

## Visual language (all ten share it)

- Dark stage: background `#000` (or `#05070a`), text `#F2F2F2`, dim text `#8C8C8C`, lines `#2a2a2a`.
- Colours carry meaning, consistently:
  - **AMBER `#FFB020`**: the patient and her chart, quotes from notes
  - **CYAN `#22D3EE`**: the agent, tools, data flowing
  - **GREEN `#4ADE80`**: humans, clinicians, the correct answer, "approved"
  - **PINK `#FF4FA3`**: the EHR / FHIR / the hospital's systems
  - **RED `#FF4D4D`**: errors, gaps, boundaries, danger
  - **WHITE**: fixed rules / deterministic logic
- Fonts: system sans (`-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, "Helvetica Neue", Arial, sans-serif`),
  mono (`"SF Mono", ui-monospace, Menlo, Consolas, "DejaVu Sans Mono", monospace`). No web fonts.
- **Draw your own SVG icons inline** (heart, stethoscope, chart/folder, note, pill, magnifier, robot-ish agent mark,
  clinician, checkmark, shield, etc.). Line icons, ~2px strokes, rounded caps, in the palette. **No emoji, no icon
  fonts, no external images.**
- Animation: CSS transitions/keyframes, SVG + `requestAnimationFrame`, `<canvas>` where many particles are needed.
  Motion should *explain* (things flow from source to answer; a missing piece makes something fail). Respect
  `prefers-reduced-motion` by shortening animations.

## Technical rules

- **One self-contained `.html` file per demo.** All CSS/JS/SVG inline. **No network requests at all** (no CDNs,
  fonts, libraries, APIs): conference Wi-Fi can't be trusted. Must work from `file://`.
- Everything is **scripted / simulated**: no live model calls. Make the simulation feel alive (typing effects,
  staged reveals), but it must be deterministic.
- **Presenter controls**: `→`/`Space`/click-on-"Next" advance; `←` goes back; `R` restarts; `F` fullscreen. Show a
  small step indicator. On-screen buttons too, so it works on a phone (touch) with no keyboard.
- Layout: designed for a 16:9 projector (1600×900 reference) but **responsive**: must remain usable at 390×844
  (phone portrait). A fixed 1600×900 stage scaled with `transform: scale()` is fine for the presentation view, as
  long as text stays legible and controls reachable on a phone; or use a fluid layout.
- Header comment at the top of the file: title, the one idea it teaches, controls, and "Patient and notes are
  synthetic. No PHI."
- A small link back to `index.html` (top-left, unobtrusive), and "next demo →" at the end.
- Each demo ends on a single **takeaway line** in big type.
- No console errors. Keep each file under ~120 KB.
- Footer, small and dim: "QCOR 2026 · synthetic patient · illustrative simulation".

## Files

| File | Take |
|---|---|
| `01-next-word.html` | From autocomplete to agent: what a language model is, from first principles |
| `02-the-loop.html` | Think → act → look: the agent loop on Mrs. Delgado's chart |
| `03-race.html` | Chatbot vs agent, side by side |
| `04-you-are-the-agent.html` | The audience plays the agent: limited view, choose tools |
| `05-the-intern.html` | Onboarding the new intern: assemble the agent part by part |
| `06-the-skill.html` | Rules in plain English: edit the protocol, watch behaviour change |
| `07-the-desk.html` | Context window and retrieval: the desk vs the library |
| `08-show-your-work.html` | No quote, no answer: evidence links, checking, human sign-off |
| `09-one-to-4078.html` | From one patient to a health system |
| `10-the-team.html` | Orchestration: a team of agents and a human who closes the loop |
