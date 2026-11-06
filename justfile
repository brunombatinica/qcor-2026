# QCOR 2026 workshop: run `just` to list recipes. Needs Node >= 22.19 (pi) and Python 3.
# Or open the folder in its dev container (.devcontainer/), which has all of them.

default:
    @just --list

# the QCOR 2026 agent demo: real pi sessions on DEMO_BASE_URL (from .env, if there is one); no model, or --replay: the recorded runs
demo-pi port="8771" *ARGS:
    set -a; [ ! -f .env ] || . ./.env; set +a; cd demo_pi && npm install --no-audit --no-fund --silent && node server.mjs --port {{port}} {{ARGS}}

# the dev container's always-on demo (.devcontainer/start-demo.sh): restart it after editing .env or the code
demo-restart:
    bash .devcontainer/start-demo.sh

# stop the dev container's always-on demo, e.g. to run `just demo-pi` on its port
demo-stop:
    tmux kill-session -t demo

# the deploy image (Dockerfile, what Railway runs), built and run here with the model settings from .env; needs Docker
docker-demo port="8771":
    docker build -t qcor-demo .
    set -a; [ ! -f .env ] || . ./.env; set +a; docker run --rm --init -p 127.0.0.1:{{port}}:8771 -e DEMO_BASE_URL -e DEMO_API_KEY -e DEMO_MODEL -e DEMO_MAX_TOKENS -e DEMO_CONCURRENCY -e DEMO_PER_TEST -e DEMO_SESSION_TIMEOUT_MS -e DEMO_MAX_OPEN qcor-demo

# re-record the demo's planned builds on the live model, after editing its cohort or instructions (IDS: only those)
demo-record *IDS:
    set -a; [ ! -f .env ] || . ./.env; set +a; cd demo_pi && npm install --no-audit --no-fund --silent && node record.mjs {{IDS}}

# encrypt DEMO_API_KEY (from .env) into demo_pi/workshop-key.json and print the code for the room; commit the file, never the code
key-encrypt *ARGS:
    set -a; [ ! -f .env ] || . ./.env; set +a; cd demo_pi && node encrypt-key.mjs {{ARGS}}

# serve the ten interactive demos (the hub is index.html) on loopback
demos port="8771":
    @echo "http://localhost:{{port}}/index.html"
    python3 -m http.server {{port}} --bind 127.0.0.1 --directory demos

# build Bruno's PowerPoint section -> pptx/qcor-bruno-agents.pptx
pptx:
    cd pptx && npm install --no-audit --no-fund --silent && node build.mjs

# render the PowerPoint to PDF + PNGs in pptx/render/ for checking (LibreOffice + poppler: tools/install-libreoffice.sh)
pptx-render: pptx
    mkdir -p pptx/render
    soffice --headless --convert-to pdf --outdir pptx/render pptx/qcor-bruno-agents.pptx >/dev/null
    pdftoppm -png -r 60 pptx/render/qcor-bruno-agents.pdf pptx/render/slide
    @echo "pptx/render/"

# the demo's tests: a stand-in model end to end, and the recorded replays
test:
    cd demo_pi && npm install --no-audit --no-fund --silent && npm test
