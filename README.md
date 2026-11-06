# AHA 2026 QCOR workshop

An interactive demonstration/presentation for the QCOR workshop at AHA Scientific Sessions 2026. It draws on the
agent work in the [agents](https://github.com/brunombatinica/agents) repo (the HFQ extraction strategies, the
accuracy and deployment studies), where this repo is included as the submodule `dissemination/qcor-2026/`. It is
self-contained: everything here runs from a plain clone.

## Getting started

Requirements: [just](https://github.com/casey/just), Python 3, Node ≥ 22.19 (pi needs it; on Node 20 npm silently
installs an old pi). Optional: LibreOffice and poppler for `just pptx-render` (`sudo tools/install-libreoffice.sh` on Debian/Ubuntu).

```sh
git clone https://github.com/brunombatinica/qcor-2026.git && cd qcor-2026
just                 # list recipes
just demo-pi         # the QCOR 2026 agent demo: http://localhost:8771/  (no model reachable: replays recorded runs)
just demos           # the ten small interactive demos: http://localhost:8771/index.html
just pptx            # build pptx/qcor-bruno-agents.pptx
just test            # the demo's tests (a stand-in model, no network)
```

### In the dev container

`.devcontainer/` builds everything above from this repo alone (Node 22, Python 3, just, uv, and Claude Code: `claude`,
logged in once and kept across rebuilds), and is how the demo is deployed. The container is `qcor-2026-dev` (hostname `qcor-2026`); its user `node` has passwordless `sudo`. SSH, from this computer only: `ssh qcor-dev` once your public key is in
`.devcontainer/ssh_authorized_keys` ([.devcontainer/README.md](.devcontainer/README.md#ssh-from-this-computer-only)). Open the folder in VS Code (*Reopen in Container*), GitHub Codespaces, or `npx @devcontainers/cli up
--workspace-folder .`. At every start the container serves the demo on port 8771 in tmux session `demo` (`tmux attach
-t demo` to watch it, `just demo-restart` after editing `.env` or the code, `just demo-stop` to free the port;
`QCOR_AUTOSTART=0` in `.env` turns it off). `node_modules` live in container volumes, so a Mac's and the container's
don't mix. `LIBREOFFICE: "true"` in `devcontainer.json` adds what `just pptx-render` needs.

The model: copy `.env.example` to `.env` (gitignored) and set `DEMO_BASE_URL`, `DEMO_API_KEY` and `DEMO_MODEL`, or
use Codespaces secrets of the same names. With neither, the demo replays its recorded runs, or, if there is a
`demo_pi/workshop-key.json`, waits for the workshop code on the page ([demo_pi/README.md](demo_pi/README.md#the-workshop-key-one-code-for-the-room)).

Opened as the agents repo's submodule (`dissemination/qcor-2026/`), the container runs everything, but git inside it
can't reach the submodule's history, which lives in the agents repo: commit from the host, or deploy from a plain
clone of this repo.

## Working together

Everyone works on `main` in this repo: `git pull` before you start, commit small changes, `git push` when they work.
If a push is rejected, someone pushed first: `git pull --rebase`, check it still runs, push again. The
PowerPoint generator (`pptx/build.mjs`) and the demo (`demo_pi/`, including the recorded runs it replays) are plain
files in git; `node_modules/`, the demo's result cache and pi's session state stay local and
rebuild themselves.

In the agents repo this is the submodule `dissemination/qcor-2026/`: commit and push here first, then commit the
updated pointer there (`just qcor-pull` there fetches everyone's latest).

Working on a remote machine: forward the ports, e.g. `ssh -L 8771:localhost:8771 <host>`.

## What is here

| Path | What |
|---|---|
| `pptx/` | Bruno's section as PowerPoint (26 slides, animations, speaker notes): model → model + context → agent, then setting one up like a remote colleague (task, from Phyllis's list; model (open, then closed) and how fast models improve, data, tools, prompt; guardrails hands over to Lovedeep). The template is Bruno's AHA 2026 faculty talk (title and disclosure slides, look, icons, animation code); the slides before the setup are shared with it, and its language-model, "text is a universal interface" and agent slides are ported in blue, with Rosa. Blue is the model, green right, orange made up. `just pptx` runs `build.mjs`, which writes `qcor-bruno-agents.pptx`. The chat bubbles are the faculty talk's iMessage geometry (`bubble.mjs`); the agent is the model, in its harness (a ring), in its loop. It also applies the colour theme (`theme.mjs`) |
| `pptx/intro/` | Phyllis's talk, the first of the three, in two versions. `AIAgents.pptx` is the first as received (7 slides). `AIAgents-restyled.pptx` is her update in this deck's look (9 slides): a title slide laid out like Bruno's and Lovedeep's, then, under a strip of the case, the data, agentic AI and today's task: Rosa, her path to this admission, could it have been prevented, large language models accelerate care, her chart, beyond chatbots, agentic tasks, today's task |
| `pptx/lovedeep/` | Lovedeep's talk, the last of the three, as received: `qcor-lovedeep-trust-but-verify.pptx` ("Trust, but Verify: guardrails for clinical AI agents", 26 slides) |
| `pptx/qcor-2026-combined.pptx` | the whole session in one deck (60 slides): Phyllis's talk (9), Bruno's (25: the Disclosures slide is left out here), Lovedeep's (26), each keeping its own look, notes and animations, in four sections (Phyllis; Bruno's "What is an agent?" and "Setting one up"; Lovedeep). It is a copy of the three decks above, last saved in PowerPoint, not generated: when one of them changes, join them again |
| `demo_pi/` | the QCOR 2026 agent demo, with pi: an overview, the task, a mock EHR to find the answer by hand, then data, tools, prompt, criteria and a test on 100 synthetic patients. The agent is checked on two answers (care gap? why?) against the answer each chart was written with; each choice is a FHIR scope, a pi tool or a line of the prompt, shown under the hood. Live on a model, or with none it replays runs recorded on gpt-6-luna ([demo_pi/README.md](demo_pi/README.md), `just demo-pi`, port 8771) |
| `demos/` | ten single-page interactive demos and their spec (`demos/SPEC.md`, `just demos`) |
| `shared/` | Rosa (`rosa.svg` + `portraits/`), `icons.js`, logos (model makers from lobehub/icons, CarDS Lab, HL7 FHIR), published charts (METR, OWID) |
| `docs/pi-notes.md` | notes on the pi agent harness the demo runs on |
| `docs/hosting.md` | serving the demo to the room: Railway (what we use), Yale Spinup, EC2 and Colab, with measured load |
| `tools/` | `install-libreoffice.sh` (for rendering the PowerPoint) |
| `.devcontainer/` | the dev container: image, post-create (`npm ci`), and the demo's autostart (`start-demo.sh`) |
| `Dockerfile` | the deploy image: the demo alone, what Railway builds from `main` (`just docker-demo` runs it here) |
| `.env.example` | the settings `.env` can hold: the model endpoint and key, concurrency, autostart |
| `NOTES.md` | working notes and open questions |

All patients here are synthetic (Rosa and the 100-patient cohort in `demo_pi/ehr/`). No real patient data goes in
this repo.

Status: first drafts for review.
