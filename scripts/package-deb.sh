#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="/home/wb-sithole/.gemini/antigravity/scratch/deb_build"
PKG_NAME="trading-platform"
PKG_VERSION="1.0.0"
PKG_ARCH="amd64"
DEB_FILE="${WORKSPACE_ROOT}/${PKG_NAME}_${PKG_VERSION}_${PKG_ARCH}.deb"

echo "=== 1. Cleaning previous staging directories ==="
rm -rf "$BUILD_DIR"
rm -f "$DEB_FILE"
mkdir -p "$BUILD_DIR/DEBIAN"
mkdir -p "$BUILD_DIR/opt/trading-platform"
mkdir -p "$BUILD_DIR/usr/bin"
mkdir -p "$BUILD_DIR/usr/share/applications"
mkdir -p "$BUILD_DIR/usr/share/icons/hicolor/512x512/apps"

echo "=== 2. Building and publishing TradingPlatform.Desktop (Photino.NET Self-Contained) ==="
dotnet publish "$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Desktop/TradingPlatform.Desktop.csproj" \
    -c Release \
    -r linux-x64 \
    --self-contained true \
    --no-restore \
    -p:NuGetAudit=false \
    -o "$BUILD_DIR/opt/trading-platform"

echo "=== 3. Ensuring frontend SPA assets are bundled in wwwroot ==="
cp -r "$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Api/wwwroot" "$BUILD_DIR/opt/trading-platform/"

echo "=== 4. Setting up Desktop Icons ==="
cp "$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Api/wwwroot/favicon-512x512.png" \
   "$BUILD_DIR/usr/share/icons/hicolor/512x512/apps/trading-platform.png"
cp "$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Api/wwwroot/app-icon.png" \
   "$BUILD_DIR/opt/trading-platform/app-icon.png"

echo "=== 5. Setting up WebKitGTK 4.0 Compatibility Symlinks ==="
WEBKIT41=$(ldconfig -p | grep "libwebkit2gtk-4.1.so.0" | awk '{print $NF}' | head -n 1)
[ -z "$WEBKIT41" ] && WEBKIT41=$(find /usr/lib -name "libwebkit2gtk-4.1.so.0" 2>/dev/null | head -n 1)
if [ -n "$WEBKIT41" ]; then
    ln -sf "$WEBKIT41" "$BUILD_DIR/opt/trading-platform/libwebkit2gtk-4.0.so.37"
fi

JSCORE41=$(ldconfig -p | grep "libjavascriptcoregtk-4.1.so.0" | awk '{print $NF}' | head -n 1)
[ -z "$JSCORE41" ] && JSCORE41=$(find /usr/lib -name "libjavascriptcoregtk-4.1.so.0" 2>/dev/null | head -n 1)
if [ -n "$JSCORE41" ]; then
    ln -sf "$JSCORE41" "$BUILD_DIR/opt/trading-platform/libjavascriptcoregtk-4.0.so.18"
fi

echo "=== 6. Creating .desktop application launcher ==="
cat << 'EOF' > "$BUILD_DIR/usr/share/applications/trading-platform.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=Trading Platform
GenericName=Trading Terminal
Comment=Algorithmic Trading Platform, Live Charts & AI Copilot
Exec=/usr/bin/trading-platform
Icon=trading-platform
Terminal=false
Categories=Office;Finance;Network;
Keywords=Trading;Stocks;Crypto;Forex;Finance;Investing;Charts;
StartupNotify=true
StartupWMClass=TradingPlatform.Desktop
EOF

echo "=== 7. Creating /usr/bin/trading-platform wrapper ==="
cat << 'EOF' > "$BUILD_DIR/usr/bin/trading-platform"
#!/bin/bash
APP_DIR="/opt/trading-platform"

# Ensure WebKitGTK 4.0 compatibility on modern Ubuntu (22.04 / 24.04 / 26.04)
if [ ! -e "$APP_DIR/libwebkit2gtk-4.0.so.37" ]; then
    WEBKIT41=$(ldconfig -p 2>/dev/null | grep "libwebkit2gtk-4.1.so.0" | awk '{print $NF}' | head -n 1)
    [ -z "$WEBKIT41" ] && WEBKIT41=$(find /usr/lib -name "libwebkit2gtk-4.1.so.0" 2>/dev/null | head -n 1)
    
    JSCORE41=$(ldconfig -p 2>/dev/null | grep "libjavascriptcoregtk-4.1.so.0" | awk '{print $NF}' | head -n 1)
    [ -z "$JSCORE41" ] && JSCORE41=$(find /usr/lib -name "libjavascriptcoregtk-4.1.so.0" 2>/dev/null | head -n 1)
    
    USER_COMPAT="$HOME/.local/share/trading-platform/compat"
    mkdir -p "$USER_COMPAT"
    [ -n "$WEBKIT41" ] && ln -sf "$WEBKIT41" "$USER_COMPAT/libwebkit2gtk-4.0.so.37"
    [ -n "$JSCORE41" ] && ln -sf "$JSCORE41" "$USER_COMPAT/libjavascriptcoregtk-4.0.so.18"
    
    export LD_LIBRARY_PATH="$USER_COMPAT:$APP_DIR:${LD_LIBRARY_PATH}"
else
    export LD_LIBRARY_PATH="$APP_DIR:${LD_LIBRARY_PATH}"
fi

export GTK_THEME="Adwaita:dark"
exec "$APP_DIR/TradingPlatform.Desktop" "$@"
EOF
chmod +x "$BUILD_DIR/usr/bin/trading-platform"
chmod +x "$BUILD_DIR/opt/trading-platform/TradingPlatform.Desktop"

echo "=== 8. Creating DEBIAN package metadata ==="
cat << EOF > "$BUILD_DIR/DEBIAN/control"
Package: ${PKG_NAME}
Version: ${PKG_VERSION}
Section: utils
Priority: optional
Architecture: ${PKG_ARCH}
Depends: libc6, libgcc-s1, libstdc++6
Recommends: libwebkit2gtk-4.1-0 | libwebkit2gtk-4.0-37 | gir1.2-webkit2-4.1
Maintainer: Trading Platform Team <support@tradingplatform.local>
Description: High-Performance Algorithmic Trading Platform & AI Copilot
 Institutional-grade desktop trading terminal with real-time charting,
 automated multi-strategy scanner, risk management guardrails, and AI Market Copilot.
 Self-contained native Photino.NET desktop application.
EOF

cat << 'EOF' > "$BUILD_DIR/DEBIAN/postinst"
#!/bin/bash
set -e

if which update-desktop-database >/dev/null 2>&1; then
    update-desktop-database -q /usr/share/applications || true
fi

if which gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
fi

# Ensure WebKitGTK 4.0 -> 4.1 symlinks exist in /opt/trading-platform
if [ ! -e /opt/trading-platform/libwebkit2gtk-4.0.so.37 ]; then
    WEBKIT41=$(ldconfig -p 2>/dev/null | grep "libwebkit2gtk-4.1.so.0" | awk '{print $NF}' | head -n 1)
    [ -z "$WEBKIT41" ] && WEBKIT41=$(find /usr/lib -name "libwebkit2gtk-4.1.so.0" 2>/dev/null | head -n 1)
    if [ -n "$WEBKIT41" ]; then
        ln -sf "$WEBKIT41" /opt/trading-platform/libwebkit2gtk-4.0.so.37 || true
    fi
fi

if [ ! -e /opt/trading-platform/libjavascriptcoregtk-4.0.so.18 ]; then
    JSCORE41=$(ldconfig -p 2>/dev/null | grep "libjavascriptcoregtk-4.1.so.0" | awk '{print $NF}' | head -n 1)
    [ -z "$JSCORE41" ] && JSCORE41=$(find /usr/lib -name "libjavascriptcoregtk-4.1.so.0" 2>/dev/null | head -n 1)
    if [ -n "$JSCORE41" ]; then
        ln -sf "$JSCORE41" /opt/trading-platform/libjavascriptcoregtk-4.0.so.18 || true
    fi
fi

chmod +x /opt/trading-platform/TradingPlatform.Desktop || true
chmod +x /usr/bin/trading-platform || true

exit 0
EOF

cat << 'EOF' > "$BUILD_DIR/DEBIAN/prerm"
#!/bin/bash
set -e

pkill -f "/opt/trading-platform/TradingPlatform.Desktop" || true

exit 0
EOF

chmod 755 "$BUILD_DIR/DEBIAN"
chmod 644 "$BUILD_DIR/DEBIAN/control"
chmod 755 "$BUILD_DIR/DEBIAN/postinst"
chmod 755 "$BUILD_DIR/DEBIAN/prerm"

echo "=== 9. Packaging with dpkg-deb ==="
dpkg-deb --build --root-owner-group "$BUILD_DIR" "$DEB_FILE"

echo "=== 10. Verifying created .deb package ==="
ls -lh "$DEB_FILE"
dpkg-deb --info "$DEB_FILE"
dpkg-deb --contents "$DEB_FILE" | head -n 35

echo "========================================================================"
echo " SUCCESS: Self-contained Photino Debian package built at: $DEB_FILE"
echo " To install on Ubuntu: sudo dpkg -i $DEB_FILE"
echo "========================================================================"
