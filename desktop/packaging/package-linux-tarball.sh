#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUNDLE_DIR="$DESKTOP_DIR/build/linux/x64/release/bundle"
VERSION="${1:-3.1.1}"

STAGE_DIR="$DESKTOP_DIR/build/tar-stage/trading-platform"
OUT_TAR="$DESKTOP_DIR/build/trading-platform_${VERSION}_linux_x64.tar.gz"

if [[ ! -d "$BUNDLE_DIR" ]]; then
  echo "Error: Release bundle not found at $BUNDLE_DIR"
  exit 1
fi

rm -rf "$DESKTOP_DIR/build/tar-stage"
mkdir -p "$STAGE_DIR"
cp -a "$BUNDLE_DIR"/. "$STAGE_DIR/"
chmod +x "$STAGE_DIR/trading_platform"

for lib in libcef.so libGLESv2.so libvk_swiftshader.so libvulkan.so.1 libEGL.so libflutter_linux_gtk.so libwebview_cef_plugin.so; do
  if [[ -f "$STAGE_DIR/lib/$lib" ]]; then
    strip --strip-unneeded "$STAGE_DIR/lib/$lib" || true
  fi
done

tar -czf "$OUT_TAR" -C "$DESKTOP_DIR/build/tar-stage" trading-platform
echo "Built Linux tarball: $OUT_TAR"
