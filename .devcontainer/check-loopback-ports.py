#!/usr/bin/env python3
"""Refuse to create or start the dev container if it would publish a port beyond this computer's loopback.

Runs on the host before every create and start (initializeCommand in devcontainer.json). The container's sshd is meant
for this computer only, so every published port must be 127.0.0.1:...; host networking, -P and appPort are refused.

    python3 .devcontainer/check-loopback-ports.py [devcontainer.json]
"""

import json
import re
import sys
from pathlib import Path


def strip_jsonc(text: str) -> str:
    """devcontainer.json allows // and /* */ comments and trailing commas; drop them, leaving strings alone."""
    text = re.sub(r'"(?:\\.|[^"\\])*"|//[^\n]*|/\*.*?\*/', lambda m: m.group(0) if m.group(0).startswith('"') else "", text, flags=re.S)
    return re.sub(r",(\s*[}\]])", r"\1", text)


def problems(config: dict) -> list[str]:
    found = []
    if "appPort" in config:
        found.append("appPort publishes on every interface; use runArgs -p 127.0.0.1:<port>:<port>")
    args = [str(a) for a in config.get("runArgs", [])]
    for i, arg in enumerate(args):
        value = None
        if arg in ("-p", "--publish"):
            value = args[i + 1] if i + 1 < len(args) else ""
        elif arg.startswith("--publish="):
            value = arg.split("=", 1)[1]
        elif arg.startswith("-p") and len(arg) > 2 and not arg.startswith("--"):
            value = arg[2:].lstrip("=")
        if value is not None and not value.startswith("127.0.0.1:"):
            found.append(f"{arg} {value if arg in ('-p', '--publish') else ''}".strip() + ": publish on 127.0.0.1 only (127.0.0.1:<host port>:<container port>)")
        if arg in ("-P", "--publish-all"):
            found.append(f"{arg} publishes every exposed port on every interface")
        net = args[i + 1] if arg in ("--network", "--net") and i + 1 < len(args) else arg.split("=", 1)[1] if arg.startswith(("--network=", "--net=")) else None
        if net == "host":
            found.append("host networking puts the container's ports on every interface of this computer")
    return found


if __name__ == "__main__":
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name("devcontainer.json")
    found = problems(json.loads(strip_jsonc(path.read_text())))
    if found:
        print(f"check-loopback-ports: refusing to start, {path}:", *[f"  - {p}" for p in found], sep="\n", file=sys.stderr)
        sys.exit(1)
    print("check-loopback-ports: every published port is on 127.0.0.1")
