#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DESKTOP_DIR="$WORKSPACE_ROOT/desktop"

echo "========================================================================"
echo " Building Trading Platform Desktop Snap (Flutter Native + Self-Contained)"
echo "========================================================================"

cd "$DESKTOP_DIR"
if [[ -f ".env.json" ]]; then
  flutter build linux --release --dart-define-from-file=.env.json
else
  flutter build linux --release
fi

cd "$WORKSPACE_ROOT"
mkdir -p snap/gui
cp -f desktop/assets/icon.png snap/gui/icon.png

if [[ "${SNAPCRAFT_DESTRUCTIVE:-0}" == "1" ]]; then
  snapcraft pack --destructive-mode
else
  snapcraft pack
fi

echo "Done! Built .snap package(s) in $WORKSPACE_ROOT:"
ls -lh "$WORKSPACE_ROOT"/*.snap
