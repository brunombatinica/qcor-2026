# Agent conventions

Working conventions for people and AI coding agents (Claude Code, Codex, pi) in this repo. `CLAUDE.md` points here.
Start with [README.md](README.md) (layout, `just` recipes) and [NOTES.md](NOTES.md) (working notes, open questions).

## Git

- Several people work here. Pull before you start; keep commits small and focused with a clear subject line.
- Commit only when asked. Agents: end commit messages with your co-author trailer.
- This repo is the submodule `dissemination/qcor-2026/` of the agents repo. Work and commit here; the agents repo
  only records which commit it points at.

## Data

- Synthetic patients only. Never commit real patient data (PHI), MIMIC content or any row-level study data.
- Study numbers on slides come from published or submitted work (see NOTES.md); quote them, don't recompute them here.

## Slides

- Text on a slide is either an exact quote, in “curly quotes” with its source, or our own summary. Our choices and
  interpretations are set in a different colour from quoted material. Use full measure names; no footnote-style subtext.
- Every citation links to the exact page or text anchor (a PDF page, `#:~:text=`), never a landing page.
- The PowerPoint is generated: edit `pptx/build.mjs`, then `just pptx`. Check it with `just pptx-render`; look for
  overlapping text and boxes that sit too close together.
- In the PowerPoint each colour means one thing: blue is the model and what it writes (and its context, on the map),
  green is right (it matches the chart), orange is made up. Everything else is white or grey. Keep the words on a slide
  few; the talk is in the notes. Slides have no titles until the setup, where the title is the step. The model sits on
  the left and what it is given on the right; chats are iMessage bubbles, yours grey, the model's blue.
- PowerPoint's Morph also pairs unnamed shapes of the same kind, which gives strange moves. Use it only where something
  should move (objects named `!!id` on both slides), and let every other object on a Morph slide enter by animation.
  Otherwise fade.

## Running things

- `just demo-pi` serves on port 8771. On a remote machine, forward it over SSH.
- The hosted demo (Railway, [docs/hosting.md](docs/hosting.md)) redeploys from `main` on every push that touches
  `demo_pi/`, `shared/` or the `Dockerfile`, with a few seconds of downtime. Push nothing there while it is in use.
- The demo runs on any OpenAI-compatible endpoint: `DEMO_BASE_URL`, `DEMO_API_KEY`, `DEMO_MODEL`
  ([demo_pi/README.md](demo_pi/README.md)). Keys go in your environment, never in the repo.
