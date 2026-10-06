#!/bin/bash
set -e

# Package Snap using official Electron Builder workflow
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================================================"
echo " Building Official Trading Platform Desktop Snap (Electron + .NET)"
echo "========================================================================"

"$SCRIPT_DIR/package-electron.sh" snap
