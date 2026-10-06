#!/bin/bash
set -e

# Package DEB using official Electron Builder workflow
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================================================"
echo " Building Official Trading Platform Desktop DEB (Electron + .NET)"
echo "========================================================================"

"$SCRIPT_DIR/package-electron.sh" deb
