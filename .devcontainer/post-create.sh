#!/usr/bin/env bash
# Runs once, as the container user, after the container is created (postCreateCommand). Not on restarts.
# Safe to rerun by hand from the repo root:  bash .devcontainer/post-create.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# the volumes (devcontainer.json "mounts") are created root-owned
sudo chown "$(id -u):$(id -g)" demo_pi/node_modules pptx/node_modules ~/.claude

(cd demo_pi && npm ci --no-audit --no-fund)
(cd pptx && npm ci --no-audit --no-fund)

# Claude Code (`claude`; log in on first run). For working on the repo only: the demo doesn't use it.
curl -fsSL https://claude.ai/install.sh | bash
grep -q '.local/bin' ~/.bashrc || echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc

if [ ! -f .env ]; then
    echo "post-create: no .env, so the demo replays its recorded runs. For a live model: cp .env.example .env, fill it in, then just demo-restart"
fi
