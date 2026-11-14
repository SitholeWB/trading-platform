#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUNDLE_DIR="$DESKTOP_DIR/build/linux/x64/release/bundle"
ICON_SRC="$DESKTOP_DIR/assets/icon.png"

APP_ID="com.tradingplatform.desktop"
PKG_NAME="trading-platform"
VERSION="${1:-3.0.2}"
ARCH="amd64"
STAGE_DIR="$DESKTOP_DIR/build/deb-stage"
OUT_DEB="$DESKTOP_DIR/build/${PKG_NAME}_${VERSION}_${ARCH}.deb"

if [[ ! -d "$BUNDLE_DIR" ]]; then
  echo "Error: Release bundle not found at $BUNDLE_DIR"
  echo "Run: cd desktop && flutter build linux --release --dart-define-from-file=.env.json"
  exit 1
fi

rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR/DEBIAN"
mkdir -p "$STAGE_DIR/opt/trading-platform"
mkdir -p "$STAGE_DIR/usr/bin"
mkdir -p "$STAGE_DIR/usr/share/applications"

cp -a "$BUNDLE_DIR"/. "$STAGE_DIR/opt/trading-platform/"
chmod +x "$STAGE_DIR/opt/trading-platform/trading_platform"
for lib in libcef.so libGLESv2.so libvk_swiftshader.so libvulkan.so.1 libEGL.so libflutter_linux_gtk.so libwebview_cef_plugin.so; do
  if [[ -f "$STAGE_DIR/opt/trading-platform/lib/$lib" ]]; then
    strip --strip-unneeded "$STAGE_DIR/opt/trading-platform/lib/$lib" || true
  fi
done

cat > "$STAGE_DIR/usr/bin/trading-platform" <<'EOF'
#!/usr/bin/env bash
exec /opt/trading-platform/trading_platform "$@"
EOF
chmod 0755 "$STAGE_DIR/usr/bin/trading-platform"

sed 's|Exec=trading-platform %U|Exec=/opt/trading-platform/trading_platform %U|' \
  "$SCRIPT_DIR/${APP_ID}.desktop" > "$STAGE_DIR/usr/share/applications/${APP_ID}.desktop"
chmod 0644 "$STAGE_DIR/usr/share/applications/${APP_ID}.desktop"

for size in 48 64 128 256 512; do
  ICON_DIR="$STAGE_DIR/usr/share/icons/hicolor/${size}x${size}/apps"
  mkdir -p "$ICON_DIR"
  if command -v python3 >/dev/null 2>&1 && python3 -c "import PIL" 2>/dev/null; then
    python3 - <<PY
from PIL import Image
im = Image.open("$ICON_SRC").convert("RGBA")
im = im.resize(($size, $size), Image.Resampling.LANCZOS)
im.save("$ICON_DIR/${APP_ID}.png")
PY
  elif command -v convert >/dev/null 2>&1; then
    convert "$ICON_SRC" -resize "${size}x${size}" "$ICON_DIR/${APP_ID}.png"
  else
    cp "$ICON_SRC" "$ICON_DIR/${APP_ID}.png"
  fi
done

cat > "$STAGE_DIR/DEBIAN/control" <<EOF
Package: ${PKG_NAME}
Version: ${VERSION}
Section: finance
Priority: optional
Architecture: ${ARCH}
Maintainer: Trading Platform <support@tradingplatform.local>
Depends: libgtk-3-0, libglib2.0-0
Description: Native Algorithmic Trading Platform Desktop
 Native Flutter Linux desktop terminal featuring multi-charting, TradingView Live,
 Strategy Studio, Robotic Market Scanner, Risk Console, and AI Quant Copilot.
EOF

cat > "$STAGE_DIR/DEBIAN/postinst" <<'EOF'
#!/usr/bin/env bash
set -e
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -f -t /usr/share/icons/hicolor || true
fi
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database /usr/share/applications || true
fi
EOF
chmod 0755 "$STAGE_DIR/DEBIAN/postinst"

dpkg-deb --build "$STAGE_DIR" "$OUT_DEB"
echo "Built Debian package: $OUT_DEB"
