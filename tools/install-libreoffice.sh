#!/usr/bin/env bash
# LibreOffice (Impress) for headless pptx/docx -> pdf, poppler for pdftoppm, and fonts with Office metrics,
# so rendered slides wrap like PowerPoint: Liberation = Arial / Times New Roman / Courier New,
# Carlito = Calibri, Caladea = Cambria. Used to check the deck in pptx/ (`just pptx-render`). Debian/Ubuntu, as root; on a Mac: brew install --cask libreoffice; brew install poppler.
set -euo pipefail

apt-get update
apt-get install -y --no-install-recommends \
    libreoffice-impress libreoffice-writer \
    poppler-utils \
    fonts-liberation2 fonts-crosextra-carlito fonts-crosextra-caladea fonts-dejavu-core
rm -rf /var/lib/apt/lists/*

soffice --version
