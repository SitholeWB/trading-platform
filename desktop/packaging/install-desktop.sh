#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUNDLE_DIR="$DESKTOP_DIR/build/linux/x64/release/bundle"
ICON_SRC="$DESKTOP_DIR/assets/icon.png"

APP_ID="com.tradingplatform.desktop"
INSTALL_DIR="${HOME}/.local/share/trading-platform"
BIN_LINK="${HOME}/.local/bin/trading-platform"
APPS_DIR="${HOME}/.local/share/applications"
ICONS_BASE="${HOME}/.local/share/icons/hicolor"

if [[ ! -d "$BUNDLE_DIR" ]]; then
  echo "Error: Release bundle not found at $BUNDLE_DIR"
  echo "Run: cd desktop && flutter build linux --release --dart-define-from-file=.env.json"
  exit 1
fi

echo "Installing Trading Platform bundle to $INSTALL_DIR..."
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR" "$(dirname "$BIN_LINK")" "$APPS_DIR"
cp -a "$BUNDLE_DIR"/. "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/trading_platform"

cat > "$BIN_LINK" <<EOF
#!/usr/bin/env bash
exec "$INSTALL_DIR/trading_platform" "\$@"
EOF
chmod +x "$BIN_LINK"

echo "Installing hicolor launch icons..."
for size in 48 64 128 256 512; do
  TARGET_DIR="$ICONS_BASE/${size}x${size}/apps"
  mkdir -p "$TARGET_DIR"
  if command -v python3 >/dev/null 2>&1 && python3 -c "import PIL" 2>/dev/null; then
    python3 - <<PY
from PIL import Image
im = Image.open("$ICON_SRC").convert("RGBA")
im = im.resize(($size, $size), Image.Resampling.LANCZOS)
im.save("$TARGET_DIR/${APP_ID}.png")
PY
  elif command -v convert >/dev/null 2>&1; then
    convert "$ICON_SRC" -resize "${size}x${size}" "$TARGET_DIR/${APP_ID}.png"
  else
    cp "$ICON_SRC" "$TARGET_DIR/${APP_ID}.png"
  fi
done

sed "s|Exec=trading-platform %U|Exec=${INSTALL_DIR}/trading_platform %U|" \
  "$SCRIPT_DIR/${APP_ID}.desktop" > "$APPS_DIR/${APP_ID}.desktop"
chmod +x "$APPS_DIR/${APP_ID}.desktop"

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -f -t "$ICONS_BASE" || true
fi
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APPS_DIR" || true
fi

echo "Done! Launch 'Trading Platform' from your application menu or run: $BIN_LINK"
