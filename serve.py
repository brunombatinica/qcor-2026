"""Serve the QCOR talk, the style book and the shared assets on loopback, for a real browser.

    python3 serve.py [--port 8770]

Static files from this folder, sent with no-store so an edit shows on reload; / opens the talk. The "Build an agent"
demo has its own server: demo_pi/ (`just demo-pi`, port 8771).
"""

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path == "/":
            self.send_response(302)
            self.send_header("Location", "/talk/")
            return self.end_headers()
        return super().do_GET()


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--port", type=int, default=8770)
    p.add_argument("--bind", default="127.0.0.1")
    a = p.parse_args()
    print(f"talk       http://{a.bind}:{a.port}/talk/\nstylebook  http://{a.bind}:{a.port}/stylebook/")
    ThreadingHTTPServer((a.bind, a.port), Handler).serve_forever()


if __name__ == "__main__":
    main()
