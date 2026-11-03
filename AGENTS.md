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
- `talk/talk.pdf` is a snapshot. Don't regenerate it after editing the talk; only when someone asks (`just talk-pdf`).
- The PowerPoint is generated: edit `pptx/build.mjs`, then `just pptx`. Check it with `just pptx-render`; look for
  overlapping text and boxes that sit too close together.

## Running things

- `just view` serves on port 8770 and `just demo-pi` on 8771. On a remote machine, forward those ports over SSH.
- The demo runs on any OpenAI-compatible endpoint: `DEMO_BASE_URL`, `DEMO_API_KEY`, `DEMO_MODEL`
  ([demo_pi/README.md](demo_pi/README.md)). Keys go in your environment, never in the repo.
