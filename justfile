# QCOR 2026 workshop: run `just` to list recipes. Needs Node >= 22.19 (pi), Python 3 and, for some recipes, uv.

default:
    @just --list

# serve the talk, the style book and shared/ on loopback (/ opens the talk)
view port="8770":
    python3 serve.py --port {{port}}

# the "Build an agent" demo: real pi sessions on DEMO_BASE_URL; no model, or --replay: the recorded runs
demo-pi port="8771" *ARGS:
    cd demo_pi && npm install --no-audit --no-fund --silent && node server.mjs --port {{port}} {{ARGS}}

# re-record the demo's planned builds on the live model, after editing its cohort or instructions (IDS: only those)
demo-record *IDS:
    cd demo_pi && npm install --no-audit --no-fund --silent && node record.mjs {{IDS}}

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

# snapshot the talk as talk/talk.pdf (only when you mean to; first run: uvx playwright install chromium)
talk-pdf:
    uv run tools/talk_pdf.py

# the demo's tests: a stand-in model end to end, and the recorded replays
test:
    cd demo_pi && npm install --no-audit --no-fund --silent && npm test
