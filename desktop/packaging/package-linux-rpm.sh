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

RPM_TOPDIR="$DESKTOP_DIR/build/rpm-stage"
STAGE_FILES="$RPM_TOPDIR/STAGE"
OUT_RPM="$DESKTOP_DIR/build/${PKG_NAME}_${VERSION}_${ARCH}.rpm"

rm -rf "$RPM_TOPDIR"
mkdir -p "$RPM_TOPDIR"/{BUILD,RPMS,SOURCES,SPECS,SRPMS,BUILDROOT}

stage_linux_bundle "$STAGE_FILES" "$BUNDLE_DIR" "$ICON_SRC" "$SCRIPT_DIR/${APP_ID}.desktop" "$APP_ID"

cat > "$RPM_TOPDIR/SPECS/${PKG_NAME}.spec" <<EOF
%global _build_id_links none
%global __os_install_post %{nil}

Name:           ${PKG_NAME}
Version:        ${VERSION}
Release:        1
Summary:        Native Algorithmic Trading Platform Desktop
License:        Proprietary
URL:            https://github.com/SitholeWB/trading-platform
BuildArch:      ${ARCH}
AutoReqProv:    no

%description
Native Flutter Linux desktop terminal featuring multi-charting, TradingView Live,
Strategy Studio, Robotic Market Scanner, Risk Console, and AI Quant Copilot.

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}
cp -a "${STAGE_FILES}/." %{buildroot}/

%post
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -f -t /usr/share/icons/hicolor >/dev/null 2>&1 || true
fi
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database /usr/share/applications >/dev/null 2>&1 || true
fi

%files
/opt/trading-platform
/usr/bin/trading-platform
/usr/share/applications/${APP_ID}.desktop
/usr/share/icons/hicolor/48x48/apps/${APP_ID}.png
/usr/share/icons/hicolor/64x64/apps/${APP_ID}.png
/usr/share/icons/hicolor/128x128/apps/${APP_ID}.png
/usr/share/icons/hicolor/256x256/apps/${APP_ID}.png
/usr/share/icons/hicolor/512x512/apps/${APP_ID}.png
EOF

rpmbuild -bb \
  --define "_topdir $RPM_TOPDIR" \
  --target "$ARCH" \
  "$RPM_TOPDIR/SPECS/${PKG_NAME}.spec"

BUILT_RPM="$(find "$RPM_TOPDIR/RPMS" -name '*.rpm' | head -n 1)"
if [[ -z "$BUILT_RPM" || ! -f "$BUILT_RPM" ]]; then
  echo "Error: rpmbuild did not produce an .rpm file"
  exit 1
fi

cp -f "$BUILT_RPM" "$OUT_RPM"
echo "Built RPM package: $OUT_RPM"
