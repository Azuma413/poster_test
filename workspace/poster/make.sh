#!/usr/bin/env bash
# Regenerate the poster:  bash make.sh  (needs node + pptxgenjs + sharp, python3 + Pillow)
set -e
cd "$(dirname "$0")"
ROOT="$(cd ../.. && pwd)"
python3 prep_assets.py "$ROOT" ./assets
node build.js ./assets "$ROOT/CoRL2026_Hiratsuka.pptx"
python3 fix_pptx.py "$ROOT/CoRL2026_Hiratsuka.pptx"
