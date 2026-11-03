# AHA 2026 QCOR workshop

An interactive demonstration/presentation for the QCOR workshop at AHA Scientific Sessions 2026. It draws on the
agent work in the [agents](https://github.com/brunombatinica/agents) repo (the HFQ extraction strategies, the
accuracy and deployment studies), where this repo is included as the submodule `dissemination/qcor_2026/`. It is
self-contained: everything here runs from a plain clone.

## Getting started

Requirements: [just](https://github.com/casey/just), Python 3, Node ≥ 22.19 (pi needs it; on Node 20 npm silently
installs an old pi). Optional: [uv](https://docs.astral.sh/uv/) for `just talk-pdf`; LibreOffice and poppler for
`just pptx-render` (`sudo tools/install-libreoffice.sh` on Debian/Ubuntu).

```sh
git clone https://github.com/brunombatinica/qcor_2026.git && cd qcor_2026
just                 # list recipes
just view            # the talk and the style book: http://localhost:8770/  (/ opens the talk)
just demo-pi         # the "Build an agent" demo: http://localhost:8771/  (no model reachable: replays recorded runs)
just demos           # the ten small interactive demos: http://localhost:8771/index.html
just pptx            # build pptx/qcor-bruno-agents.pptx
just test            # the demo's tests (a stand-in model, no network)
```

## Working together

Everyone works on `main` in this repo: `git pull` before you start, commit small changes, `git push` when they work.
If a push is rejected, someone pushed first: `git pull --rebase`, check it still runs, push again. The talk
(`talk/`), the PowerPoint generator (`pptx/build.mjs`) and the demo (`demo_pi/`, including the recorded runs it
replays) are all plain files in git; `node_modules/`, the demo's result cache and pi's session state stay local and
rebuild themselves.

In the agents repo this is the submodule `dissemination/qcor_2026/`: commit and push here first, then commit the
updated pointer there (`just qcor-pull` there fetches everyone's latest).

Working on a remote machine: forward the ports, e.g. `ssh -L 8770:localhost:8770 -L 8771:localhost:8771 <host>`.

## What is here

| Path | What |
|---|---|
| `talk/` | the deck for Phyllis's and Bruno's talks: 38 animated slides in six signposted parts (reveal.js + `talk.js`; S for speaker notes, `?review` shows end states). `talk.pdf` is a snapshot (`just talk-pdf`) |
| `pptx/` | Bruno's section as PowerPoint (15 slides, speaker notes): what an agent is, how it works, and setting one up. `just pptx` runs `build.mjs`, which writes `qcor-bruno-agents.pptx` and applies the colour theme (`theme.mjs`) |
| `gallery.html` | the first asset gallery (superseded by the style book's asset pages; kept for now) |
| `stylebook/` | thirty-five candidate looks, one page each (a man and a woman, the same slide, ten icons), ★ to pick; its last four pages are the assets: people, duotone icons and colour, logos by group, charts ([stylebook/README.md](stylebook/README.md)) |
| `demo_pi/` | "Build an agent, with pi": six views (brief, data, tools, prompt, criteria, test). Each choice is a FHIR scope, a pi tool or a line of the prompt, shown under the hood. Rosa (heart block, recorded only in the notes), then 100 synthetic patients scored against gold labels. Live on a model, or with none it replays runs recorded on Qwen ([demo_pi/README.md](demo_pi/README.md), `just demo-pi`, port 8771) |
| `demos/` | ten single-page interactive demos and their spec (`demos/SPEC.md`, `just demos`) |
| `shared/` | Rosa (`rosa.svg` + `portraits/`), `icons.js`, model logos (lobehub/icons), published charts (METR, OWID) |
| `serve.py` | serves the talk, the style book and `shared/` (`just view`, port 8770) |
| `sketches/` | the earlier brainstorm board and drafts (superseded by `talk/` and `demo_pi/`) |
| `docs/pi-notes.md` | notes on the pi agent harness the demo runs on |
| `tools/` | `talk_pdf.py` (the talk snapshot), `install-libreoffice.sh` (for rendering the PowerPoint) |
| `NOTES.md` | working notes and open questions |

All patients here are synthetic (Rosa and the 100-patient cohort in `demo_pi/ehr/`). No real patient data goes in
this repo.

Status: first drafts for review.
