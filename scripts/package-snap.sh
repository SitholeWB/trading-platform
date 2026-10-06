#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
STAGE_DIR="$WORKSPACE_ROOT/dist/snap-stage"
PAYLOAD_DIR="$WORKSPACE_ROOT/dist/snap-payload"
SNAP_NAME="trading-platform"
SNAP_VERSION="${1:-1.0.1}"
SNAP_ARCH="amd64"
OUTPUT_SNAP="${WORKSPACE_ROOT}/${SNAP_NAME}_${SNAP_VERSION}_${SNAP_ARCH}.snap"
ARCH_TRIPLET="x86_64-linux-gnu"

echo "========================================================================"
echo " Packaging Snap for: ${SNAP_NAME} v${SNAP_VERSION} (${SNAP_ARCH})"
echo "========================================================================"

# 1. Clean previous staging
echo "--> 1. Cleaning staging directories..."
rm -rf "$STAGE_DIR" "$PAYLOAD_DIR"
rm -f "$OUTPUT_SNAP"
mkdir -p "$STAGE_DIR/meta/gui"
mkdir -p "$STAGE_DIR/bin"
mkdir -p "$PAYLOAD_DIR"

# 2. Verify or build Web SPA
echo "--> 2. Building Web SPA frontend..."
(cd "$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Web" && npm run build)

# 3. Publish Self-Contained Photino.NET Desktop Application
echo "--> 3. Publishing self-contained .NET Desktop application (linux-x64)..."
dotnet restore "$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Desktop/TradingPlatform.Desktop.csproj" \
    -r linux-x64 \
    --packages /home/wb-sithole/.nuget/packages \
    -p:NuGetAudit=false

dotnet publish "$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Desktop/TradingPlatform.Desktop.csproj" \
    -c Release \
    -r linux-x64 \
    --self-contained true \
    --no-restore \
    -p:NuGetAudit=false \
    -o "$PAYLOAD_DIR"

# 4. Copy wwwroot into payload
echo "--> 4. Bundling SPA static assets..."
cp -r "$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Api/wwwroot" "$PAYLOAD_DIR/wwwroot"

# 5. Populate snap-stage payload
echo "--> 5. Preparing snap binaries..."
cp -r "$PAYLOAD_DIR/"* "$STAGE_DIR/bin/"
cp "$WORKSPACE_ROOT/snap/local/launcher.sh" "$STAGE_DIR/bin/launcher.sh"
chmod +x "$STAGE_DIR/bin/launcher.sh"
chmod +x "$STAGE_DIR/bin/TradingPlatform.Desktop"

# 6. Icons & Desktop file & Metainfo
echo "--> 6. Setting up Snap metadata & icons..."
cp "$WORKSPACE_ROOT/snap/gui/trading-platform.desktop" "$STAGE_DIR/meta/gui/trading-platform.desktop"
cp "$WORKSPACE_ROOT/snap/gui/trading-platform.png" "$STAGE_DIR/meta/gui/trading-platform.png"
cp "$WORKSPACE_ROOT/snap/gui/trading-platform.png" "$STAGE_DIR/meta/gui/icon.png"
if [ -f "$WORKSPACE_ROOT/snap/gui/trading-platform.metainfo.xml" ]; then
    cp "$WORKSPACE_ROOT/snap/gui/trading-platform.metainfo.xml" "$STAGE_DIR/meta/gui/trading-platform.metainfo.xml"
fi

# 7. Generate meta/snap.yaml with layout for webkit2gtk-4.0 from gnome-platform
cat << EOF > "$STAGE_DIR/meta/snap.yaml"
name: ${SNAP_NAME}
version: '${SNAP_VERSION}'
summary: Institutional Algorithmic Trading Platform, Live Charts & AI Copilot
description: |
  Trading Platform is an institutional-grade desktop trading terminal featuring:
  - Real-time Multi-Timeframe Candlestick Charts (1m, 5m, 15m, 1h, 4h, 1d)
  - 10+ Technical Indicators (EMA, SMA, RSI, MACD, Bollinger Bands, ATR, VWAP)
  - Autonomous Multi-Strategy Market Scanner
  - Strict Risk Management Guardrails & Quick Order Widget
  - Integrated AI Market Copilot with contextual trade commentary
  - Native Photino.NET lightweight desktop client
architectures:
  - ${SNAP_ARCH}
base: core22
confinement: strict
grade: stable
layout:
  /usr/lib/${ARCH_TRIPLET}/webkit2gtk-4.0:
    bind: \$SNAP/gnome-platform/usr/lib/${ARCH_TRIPLET}/webkit2gtk-4.0
plugs:
  gnome-42-2204:
    interface: content
    target: \$SNAP/gnome-platform
    default-provider: gnome-42-2204
  gtk-3-themes:
    interface: content
    target: \$SNAP/data-dir/themes
    default-provider: gtk-common-themes
  icon-themes:
    interface: content
    target: \$SNAP/data-dir/icons
    default-provider: gtk-common-themes
  sound-themes:
    interface: content
    target: \$SNAP/data-dir/sounds
    default-provider: gtk-common-themes
apps:
  trading-platform:
    command: bin/launcher.sh
    environment:
      WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS: "1"
      WEBKIT_DISABLE_COMPOSITING_MODE: "1"
      WEBKIT_DISABLE_DMABUF_RENDERER: "1"
      WEBKIT_DMABUF_RENDERER_DISABLE_GBM: "1"
      GTK_THEME: "Adwaita:dark"
      TRADING_PLATFORM_DATA_DIR: "\$SNAP_USER_DATA/data"
    plugs:
      - browser-support
      - desktop
      - desktop-legacy
      - wayland
      - x11
      - network
      - network-bind
      - opengl
      - audio-playback
      - home
      - removable-media
EOF

# 8. Check skeleton validity
echo "--> 7. Validating snap skeleton..."
snap pack --check-skeleton "$STAGE_DIR"

# 9. Pack Snap
echo "--> 8. Building .snap package..."
snap pack "$STAGE_DIR" "$WORKSPACE_ROOT"

echo "========================================================================"
echo " SUCCESS: Snap package built at: $OUTPUT_SNAP"
ls -lh "$OUTPUT_SNAP"
echo "========================================================================"
echo ""
echo "Next steps:"
echo " 1. Test local install:"
echo "    sudo snap install --dangerous $OUTPUT_SNAP"
echo "    sudo /usr/lib/snapd/snap-discard-ns trading-platform"
echo " 2. Run your snap:"
echo "    snap run trading-platform"
echo " 3. Publish to Snap Store (after snapcraft register):"
echo "    snapcraft upload --release=candidate,stable $OUTPUT_SNAP"
echo "========================================================================"
