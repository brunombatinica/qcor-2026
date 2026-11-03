# qcor_2026 dev container: everything this repo runs on, and nothing from the agents repo.
# Node 22 (pi needs >= 22.19), Python 3 (serve.py), just, uv, tmux (the demo's autostart session).
# LIBREOFFICE=true adds LibreOffice + poppler for `just pptx-render` (about 600 MB, so off by default).
FROM mcr.microsoft.com/devcontainers/javascript-node:22-bookworm

ARG LIBREOFFICE=false
ARG JUST_VERSION=1.56.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends tmux ripgrep \
    && rm -rf /var/lib/apt/lists/*

COPY --chmod=0755 tools/install-libreoffice.sh /tmp/install-libreoffice.sh
RUN if [ "$LIBREOFFICE" = "true" ]; then /tmp/install-libreoffice.sh; fi && rm /tmp/install-libreoffice.sh

# just's release tags carry no "v" prefix (1.56.0, not v1.56.0)
RUN curl -fsSL https://just.systems/install.sh | bash -s -- --tag "$JUST_VERSION" --to /usr/local/bin \
    && just --version
RUN curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=/usr/local/bin sh
