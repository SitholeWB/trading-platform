#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUNDLE_DIR="$DESKTOP_DIR/build/linux/x64/release/bundle"
ICON_SRC="$DESKTOP_DIR/assets/icon.png"
APP_ID="com.tradingplatform.desktop"
VERSION="${1:-3.1.1}"
ARCH="x86_64"

APPDIR="$DESKTOP_DIR/build/AppDir"
OUT_APPIMAGE="$DESKTOP_DIR/build/Trading_Platform-${VERSION}-${ARCH}.AppImage"
APPIMAGETOOL="$DESKTOP_DIR/build/appimagetool-${ARCH}.AppImage"

if [[ ! -d "$BUNDLE_DIR" ]]; then
  echo "Error: Release bundle not found at $BUNDLE_DIR"
  exit 1
fi

rm -rf "$APPDIR"
mkdir -p "$APPDIR/usr/bin" "$APPDIR/usr/share/applications"

cp -a "$BUNDLE_DIR"/. "$APPDIR/usr/bin/"
chmod +x "$APPDIR/usr/bin/trading_platform"

for lib in libcef.so libGLESv2.so libvk_swiftshader.so libvulkan.so.1 libEGL.so libflutter_linux_gtk.so libwebview_cef_plugin.so; do
  if [[ -f "$APPDIR/usr/bin/lib/$lib" ]]; then
    strip --strip-unneeded "$APPDIR/usr/bin/lib/$lib" || true
  fi
done

cat > "$APPDIR/AppRun" <<'EOF'
#!/usr/bin/env bash
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export LD_LIBRARY_PATH="$HERE/usr/bin/lib:${LD_LIBRARY_PATH:-}"
exec "$HERE/usr/bin/trading_platform" "$@"
EOF
chmod 0755 "$APPDIR/AppRun"

sed 's|Exec=trading-platform %U|Exec=trading_platform %U|' \
  "$SCRIPT_DIR/${APP_ID}.desktop" > "$APPDIR/${APP_ID}.desktop"
cp "$APPDIR/${APP_ID}.desktop" "$APPDIR/usr/share/applications/${APP_ID}.desktop"

if command -v python3 >/dev/null 2>&1 && python3 -c "import PIL" 2>/dev/null; then
  python3 - <<PY
from PIL import Image
im = Image.open("$ICON_SRC").convert("RGBA").resize((256, 256), Image.Resampling.LANCZOS)
im.save("$APPDIR/${APP_ID}.png")
PY
else
  cp "$ICON_SRC" "$APPDIR/${APP_ID}.png"
fi
cp "$APPDIR/${APP_ID}.png" "$APPDIR/.DirIcon"

if [[ ! -x "$APPIMAGETOOL" ]]; then
  curl -fsSL -o "$APPIMAGETOOL" \
    "https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-${ARCH}.AppImage"
  chmod +x "$APPIMAGETOOL"
fi

ARCH="$ARCH" "$APPIMAGETOOL" --appimage-extract-and-run --no-appstream "$APPDIR" "$OUT_APPIMAGE"
echo "Built AppImage: $OUT_APPIMAGE"
