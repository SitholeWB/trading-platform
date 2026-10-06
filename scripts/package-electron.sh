#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ELECTRON_DIR="$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Electron"
WEB_DIR="$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Web"
API_DIR="$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Api"
BACKEND_DIST="$ELECTRON_DIR/dist/backend"

TARGET="${1:-snap}"

# 0. Determine target platform & .NET Runtime Identifier (RID)
case "$TARGET" in
    win|windows|exe)
        DOTNET_RID="win-x64"
        BUILDER_FLAG="--win"
        TARGET_DESC="Windows (.exe NSIS Installer & Portable)"
        ;;
    mac|darwin|dmg|osx)
        # Default to Apple Silicon arm64 (standard for modern Macs), override with RID=osx-x64 if desired
        DOTNET_RID="${RID:-osx-arm64}"
        BUILDER_FLAG="--mac"
        TARGET_DESC="macOS (.dmg Installer & .zip Archive - ${DOTNET_RID})"
        ;;
    deb)
        DOTNET_RID="linux-x64"
        BUILDER_FLAG="--linux deb"
        TARGET_DESC="Linux Debian/Ubuntu Package (.deb)"
        ;;
    appimage)
        DOTNET_RID="linux-x64"
        BUILDER_FLAG="--linux AppImage"
        TARGET_DESC="Linux Universal AppImage (.AppImage)"
        ;;
    dir)
        DOTNET_RID="linux-x64"
        BUILDER_FLAG="--dir"
        TARGET_DESC="Unpacked Local Directory"
        ;;
    all-linux)
        DOTNET_RID="linux-x64"
        BUILDER_FLAG="--linux snap deb AppImage"
        TARGET_DESC="All Linux Desktop Formats (Snap, Deb, AppImage)"
        ;;
    snap|*)
        DOTNET_RID="linux-x64"
        BUILDER_FLAG="--linux snap"
        TARGET_DESC="Canonical Snap Package (.snap)"
        ;;
esac

echo "========================================================================"
echo " Building Trading Platform Desktop with Electron"
echo " Target Platform : ${TARGET_DESC}"
echo " .NET Runtime RID: ${DOTNET_RID}"
echo "========================================================================"

# 1. Build React Web SPA
echo "--> 1. Building React SPA frontend..."
(cd "$WEB_DIR" && npm run build)

# 2. Publish Self-Contained .NET Backend for Target OS Architecture
echo "--> 2. Publishing self-contained .NET Backend (${DOTNET_RID})..."
rm -rf "$BACKEND_DIST"
dotnet publish "$API_DIR/TradingPlatform.Api.csproj" \
    -c Release \
    -r "$DOTNET_RID" \
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

# 4. Package Desktop Distribution with electron-builder
echo "--> 4. Packaging distribution: ${BUILDER_FLAG}..."
npx electron-builder $BUILDER_FLAG --publish never

# 5. Copy artifacts to workspace root for convenient access
cp "$ELECTRON_DIR"/dist/release/*.snap "$WORKSPACE_ROOT/" 2>/dev/null || true
cp "$ELECTRON_DIR"/dist/release/*.deb "$WORKSPACE_ROOT/" 2>/dev/null || true
cp "$ELECTRON_DIR"/dist/release/*.AppImage "$WORKSPACE_ROOT/" 2>/dev/null || true
cp "$ELECTRON_DIR"/dist/release/*.exe "$WORKSPACE_ROOT/" 2>/dev/null || true
cp "$ELECTRON_DIR"/dist/release/*.dmg "$WORKSPACE_ROOT/" 2>/dev/null || true
cp "$ELECTRON_DIR"/dist/release/*.zip "$WORKSPACE_ROOT/" 2>/dev/null || true

echo "========================================================================"
echo " SUCCESS: Packaging completed!"
echo " Artifacts located in: $ELECTRON_DIR/dist/release"
ls -lh "$ELECTRON_DIR/dist/release" 2>/dev/null || true
echo " Output copied to: $WORKSPACE_ROOT"
ls -lh "$WORKSPACE_ROOT"/*.{snap,deb,exe,dmg,AppImage,zip} 2>/dev/null || true
echo "========================================================================"
