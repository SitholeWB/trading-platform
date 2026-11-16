#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUNDLE_DIR="$DESKTOP_DIR/build/linux/x64/release/bundle"
ICON_SRC="$DESKTOP_DIR/assets/icon.png"
APP_ID="com.tradingplatform.desktop"
PKG_NAME="trading-platform"
VERSION="${1:-3.1.1}"
ARCH="x86_64"

if [[ ! -d "$BUNDLE_DIR" ]]; then
  echo "Error: Release bundle not found at $BUNDLE_DIR"
  exit 1
fi

source "$SCRIPT_DIR/linux-stage-helpers.sh"

STAGE_DIR="$DESKTOP_DIR/build/arch-stage"
OUT_PKG="$DESKTOP_DIR/build/${PKG_NAME}_${VERSION}_${ARCH}.pkg.tar.zst"

rm -rf "$STAGE_DIR"
stage_linux_bundle "$STAGE_DIR" "$BUNDLE_DIR" "$ICON_SRC" "$SCRIPT_DIR/${APP_ID}.desktop" "$APP_ID"

INSTALL_SIZE="$(du -sb "$STAGE_DIR" | awk '{print $1}')"
BUILD_DATE="$(date +%s)"

cat > "$STAGE_DIR/.PKGINFO" <<EOF
pkgname = ${PKG_NAME}
pkgbase = ${PKG_NAME}
pkgver = ${VERSION}-1
pkgdesc = Native Algorithmic Trading Platform Desktop
url = https://github.com/SitholeWB/trading-platform
builddate = ${BUILD_DATE}
packager = Trading Platform <support@tradingplatform.local>
size = ${INSTALL_SIZE}
arch = ${ARCH}
license = custom:Proprietary
depend = gtk3
depend = glib2
EOF

tar --zstd -cf "$OUT_PKG" -C "$STAGE_DIR" .PKGINFO opt usr
echo "Built Arch package: $OUT_PKG"
