# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright>=1.48", "pillow>=10"]
# ///
"""Snapshot the talk as a PDF: every slide in its end state (?review), 1600x900 at 2x, controls hidden.

    just talk-pdf                # -> talk/talk.pdf
    uv run tools/talk_pdf.py [--out talk/talk.pdf] [--port 8779]

talk.pdf is a snapshot, not a build product: regenerate it when you mean to, not after every edit.
First run: `uvx playwright install chromium` (downloads the browser).
"""

import argparse
import io
import socket
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent


def wait_for(port, timeout=10):
    end = time.time() + timeout
    while time.time() < end:
        with socket.socket() as s:
            if s.connect_ex(("127.0.0.1", port)) == 0:
                return
        time.sleep(0.1)
    sys.exit(f"serve.py did not start on port {port}")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--out", default=str(ROOT / "talk" / "talk.pdf"))
    p.add_argument("--port", type=int, default=8779)
    a = p.parse_args()

    server = subprocess.Popen([sys.executable, str(ROOT / "serve.py"), "--port", str(a.port)], stdout=subprocess.DEVNULL)
    try:
        wait_for(a.port)
        shots = []
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            page = browser.new_page(viewport={"width": 1600, "height": 900}, device_scale_factor=2)
            page.goto(f"http://127.0.0.1:{a.port}/talk/?review", wait_until="networkidle")
            page.wait_for_function("window.Reveal && Reveal.isReady()")
            page.evaluate("Reveal.configure({controls: false, progress: false, slideNumber: false})")
            n = page.evaluate("Reveal.getTotalSlides()")
            for i in range(n):
                page.evaluate(f"Reveal.slide({i})")
                page.wait_for_timeout(900)  # let the slide settle into its end state
                shots.append(Image.open(io.BytesIO(page.screenshot())).convert("RGB"))
                print(f"slide {i + 1}/{n}", end="\r", flush=True)
            browser.close()
        shots[0].save(a.out, save_all=True, append_images=shots[1:], resolution=200)
        print(f"\n{a.out}: {len(shots)} slides")
    finally:
        server.terminate()


if __name__ == "__main__":
    main()
