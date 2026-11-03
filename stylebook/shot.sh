#!/bin/sh
# Screenshot one page of the style book: ./shot.sh <id> [out.png] [port]
# Needs the QCOR server running (just view, or the qcor preview config on 8770).
id="$1"; out="${2:-/tmp/stylebook-$1.png}"; port="${3:-8770}"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="$(mktemp -d)" --window-size=1600,1240 --virtual-time-budget=3000 \
  --screenshot="$out" "http://localhost:$port/stylebook/?only=$id" >/dev/null 2>&1
echo "$out"
