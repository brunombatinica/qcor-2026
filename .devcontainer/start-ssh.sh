#!/usr/bin/env bash
# Starts sshd at every container start (postStartCommand), for `ssh qcor-dev` from this computer (.devcontainer/README.md).
# Off unless .devcontainer/ssh_authorized_keys exists (gitignored: your public key, one per line).
#
# Two locks besides the key: the port is published on the host's 127.0.0.1 only (devcontainer.json,
# check-loopback-ports.py), and sshd itself only lets node in from the container's own Docker networks, the way
# published-port connections arrive. Safe to rerun by hand: bash .devcontainer/start-ssh.sh
set -euo pipefail
cd "$(dirname "$0")/.."

keys=.devcontainer/ssh_authorized_keys
if [ ! -s "$keys" ]; then echo "ssh: off (no $keys)"; exit 0; fi

install -d -m 700 ~/.ssh
install -m 600 "$keys" ~/.ssh/authorized_keys

# the host key lives in a volume, so it survives rebuilds
hostkey=/etc/ssh/qcor_host_keys/ssh_host_ed25519_key
sudo test -f "$hostkey" || sudo ssh-keygen -q -t ed25519 -N "" -C qcor-2026 -f "$hostkey"

# node, from the container's Docker networks only (each interface's IPv4 network, in CIDR)
nets=$(ip -o -4 addr show scope global | awk '{print $4}' | python3 -c 'import ipaddress, sys; print(" ".join(sorted({str(ipaddress.ip_interface(l.strip()).network) for l in sys.stdin if l.strip()})))')
if [ -z "$nets" ]; then echo "ssh: no Docker network found; leaving sshd refusing everyone" >&2; exit 1; fi
echo "AllowUsers $(for n in $nets; do printf 'node@%s ' "$n"; done)" | sudo tee /etc/ssh/sshd_config.d/20-allowed-sources.conf >/dev/null

sudo /usr/sbin/sshd -t
if [ -f /run/sshd.pid ] && sudo kill -0 "$(cat /run/sshd.pid)" 2>/dev/null; then sudo kill -HUP "$(cat /run/sshd.pid)"; else sudo /usr/sbin/sshd; fi
echo "ssh: on, key login as node from $nets (ssh qcor-dev; port 2226 on the host's 127.0.0.1)"
