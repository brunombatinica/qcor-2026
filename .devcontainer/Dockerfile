# qcor-2026 dev container: everything this repo runs on, and nothing from the agents repo.
# Node 22 (pi needs >= 22.19), Python 3 (`just demos`), just, uv, tmux (the demo's autostart session).
# LIBREOFFICE=true adds LibreOffice + poppler for `just pptx-render` (about 600 MB, so off by default).
FROM mcr.microsoft.com/devcontainers/javascript-node:22-bookworm

ARG LIBREOFFICE=false
ARG JUST_VERSION=1.56.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends tmux ripgrep \
    && rm -rf /var/lib/apt/lists/*

# sshd, for `ssh qcor-dev` from this computer only (.devcontainer/README.md): key login as node, nothing else. The port
# is published on 127.0.0.1 only (devcontainer.json, enforced by check-loopback-ports.py), and start-ssh.sh limits
# logins to the container's own Docker networks; until it runs, 20-allowed-sources.conf refuses everyone.
RUN apt-get update && apt-get install -y --no-install-recommends openssh-server && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/ssh/ssh_host_* && mkdir -p /run/sshd \
    && printf '%s\n' \
        'HostKey /etc/ssh/qcor_host_keys/ssh_host_ed25519_key' \
        'PubkeyAuthentication yes' \
        'PasswordAuthentication no' \
        'KbdInteractiveAuthentication no' \
        'PermitEmptyPasswords no' \
        'PermitRootLogin no' \
        'AllowTcpForwarding local' \
        'AllowAgentForwarding no' \
        'X11Forwarding no' \
        'PermitTunnel no' \
        'GatewayPorts no' \
        'LogLevel VERBOSE' \
        > /etc/ssh/sshd_config.d/10-qcor.conf \
    && echo 'AllowUsers nobody@127.0.0.2' > /etc/ssh/sshd_config.d/20-allowed-sources.conf

COPY --chmod=0755 tools/install-libreoffice.sh /tmp/install-libreoffice.sh
RUN if [ "$LIBREOFFICE" = "true" ]; then /tmp/install-libreoffice.sh; fi && rm /tmp/install-libreoffice.sh

# just's release tags carry no "v" prefix (1.56.0, not v1.56.0)
RUN curl -fsSL https://just.systems/install.sh | bash -s -- --tag "$JUST_VERSION" --to /usr/local/bin \
    && just --version
RUN curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=/usr/local/bin sh
