#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ELECTRON_DIR="$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Electron"
WEB_DIR="$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Web"
API_DIR="$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Api"
BACKEND_DIST="$ELECTRON_DIR/dist/backend"

echo "========================================================================"
echo " Building Trading Platform Desktop with Electron"
echo "========================================================================"

# 1. Build React Web SPA
echo "--> 1. Building React SPA frontend..."
(cd "$WEB_DIR" && npm run build)

# 2. Publish Self-Contained .NET Backend
echo "--> 2. Publishing self-contained .NET Backend (linux-x64)..."
rm -rf "$BACKEND_DIST"
dotnet publish "$API_DIR/TradingPlatform.Api.csproj" \
    -c Release \
    -r linux-x64 \
    --self-contained true \
    -p:NuGetAudit=false \
    -o "$BACKEND_DIST"

# Ensure static wwwroot is included in backend
cp -r "$API_DIR/wwwroot" "$BACKEND_DIST/wwwroot"

# 3. Install Electron dependencies
echo "--> 3. Checking Electron dependencies..."
cd "$ELECTRON_DIR"
if [ ! -d "node_modules" ]; then
    echo "Installing electron and electron-builder..."
    npm install
fi

# 4. Package Desktop Distributions
TARGET="${1:-snap}"
echo "--> 4. Packaging target: ${TARGET}..."
case "$TARGET" in
    snap)
        npx electron-builder --linux snap
        ;;
    deb)
        npx electron-builder --linux deb
        ;;
    appimage)
        npx electron-builder --linux AppImage
        ;;
    dir)
        npx electron-builder --dir
        ;;
    all)
        npx electron-builder --linux snap deb AppImage
        ;;
    *)
        npx electron-builder "$@"
        ;;
esac

# Copy artifacts to workspace root for convenient access and deployment
cp "$ELECTRON_DIR"/dist/release/*.snap "$WORKSPACE_ROOT/" 2>/dev/null || true
cp "$ELECTRON_DIR"/dist/release/*.deb "$WORKSPACE_ROOT/" 2>/dev/null || true

echo "========================================================================"
echo " SUCCESS: Electron packaging completed!"
echo " Artifacts located in: $ELECTRON_DIR/dist/release"
ls -lh "$ELECTRON_DIR/dist/release" 2>/dev/null || true
echo " Artifacts copied to: $WORKSPACE_ROOT"
ls -lh "$WORKSPACE_ROOT"/*.snap 2>/dev/null || true
echo "========================================================================"
