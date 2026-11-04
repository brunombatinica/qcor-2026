#!/usr/bin/env bash
# Starts the QCOR 2026 agent demo in tmux session "demo", at every container start (postStartCommand), so a
# deployed container serves it with no one logged in. It restarts the server if it exits.
#
#   tmux attach -t demo     watch it (Ctrl-b d to leave it running)
#   just demo-restart       after editing .env or the code
#   just demo-stop          free port 8771, e.g. for `just demo-pi`
#
# .env (repo root, gitignored) sets the model (DEMO_BASE_URL, DEMO_API_KEY, DEMO_MODEL, ...); without one, or with no
# model reachable, the demo replays its recorded runs. QCOR_AUTOSTART=0 there skips this; DEMO_PORT moves it.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env ]; then set -a; source .env; set +a; fi
if [ "${QCOR_AUTOSTART:-1}" = "0" ]; then echo "start-demo: QCOR_AUTOSTART=0, not starting"; exit 0; fi

port="${DEMO_PORT:-8771}"
tmux kill-session -t demo 2>/dev/null || true
# the loop re-reads .env each time, so a restart picks up edits to it
tmux new-session -d -s demo -c "$PWD" \
    "while true; do (set -a; [ -f .env ] && source .env; set +a; exec node demo_pi/server.mjs --port $port); echo 'server exited; restarting in 3 s'; sleep 3; done"
echo "start-demo: http://localhost:$port (tmux attach -t demo)"
