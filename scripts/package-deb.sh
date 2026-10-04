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

echo "=== 2. Building and publishing TradingPlatform.Api in Release mode ==="
dotnet publish "$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Api/TradingPlatform.Api.csproj" \
    -c Release \
    --no-restore \
    -p:NuGetAudit=false \
    -o "$BUILD_DIR/opt/trading-platform"

echo "=== 3. Ensuring frontend assets are bundled in wwwroot ==="
cp -r "$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Api/wwwroot" "$BUILD_DIR/opt/trading-platform/"

echo "=== 4. Setting up Desktop Icons ==="
cp "$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Api/wwwroot/favicon-512x512.png" \
   "$BUILD_DIR/usr/share/icons/hicolor/512x512/apps/trading-platform.png"
cp "$WORKSPACE_ROOT/src/Presentation/TradingPlatform.Api/wwwroot/app-icon.png" \
   "$BUILD_DIR/opt/trading-platform/app-icon.png"

echo "=== 5. Creating .desktop application launcher ==="
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
StartupWMClass=trading-platform
EOF

echo "=== 6. Creating Desktop Window Launcher (/opt/trading-platform/trading-platform) ==="
cat << 'EOF' > "$BUILD_DIR/opt/trading-platform/trading-platform"
#!/usr/bin/env python3
"""
Trading Platform Native Desktop Launcher
Starts the background TradingPlatform.Api server and launches a dedicated native application window.
"""
import os
import sys
import time
import signal
import subprocess
import urllib.request

APP_URL = "http://localhost:5000"
APP_DIR = "/opt/trading-platform"
API_BIN = os.path.join(APP_DIR, "TradingPlatform.Api")
ICON_PATH = "/usr/share/icons/hicolor/512x512/apps/trading-platform.png"
if not os.path.exists(ICON_PATH):
    ICON_PATH = os.path.join(APP_DIR, "app-icon.png")

backend_proc = None

def is_server_ready(url=APP_URL, timeout=0.8):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'TradingPlatformLauncher'})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status in (200, 301, 302)
    except Exception:
        return False

def start_backend():
    global backend_proc
    if is_server_ready():
        return None

    user_data_dir = os.path.expanduser("~/.local/share/trading-platform")
    os.makedirs(user_data_dir, exist_ok=True)
    db_path = os.path.join(user_data_dir, "trading_platform.db")

    env = os.environ.copy()
    env["ASPNETCORE_URLS"] = APP_URL
    env["DOTNET_USE_POLLING_FILE_WATCHER"] = "true"
    env["Spa__AutoLaunchBrowser"] = "false"
    env["ConnectionStrings__DefaultConnection"] = f"Data Source={db_path}"

    cmd = [API_BIN]
    backend_proc = subprocess.Popen(
        cmd,
        cwd=APP_DIR,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    for _ in range(60):
        if is_server_ready():
            break
        time.sleep(0.2)
    return backend_proc

def cleanup(*args):
    global backend_proc
    if backend_proc and backend_proc.poll() is None:
        try:
            backend_proc.terminate()
            backend_proc.wait(timeout=2)
        except Exception:
            backend_proc.kill()

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def launch_native_window():
    try:
        os.environ["GTK_THEME"] = "Adwaita:dark"
        import gi
        gi.require_version('Gtk', '3.0')
        gi.require_version('WebKit2', '4.1')
        from gi.repository import Gtk, WebKit2, GdkPixbuf

        try:
            gtk_settings = Gtk.Settings.get_default()
            if gtk_settings:
                gtk_settings.set_property("gtk-application-prefer-dark-theme", True)
        except Exception:
            pass

        class TradingAppWindow(Gtk.Window):
            def __init__(self):
                super().__init__(title="Trading Platform")
                self.set_default_size(1440, 900)
                self.set_position(Gtk.WindowPosition.CENTER)

                if os.path.exists(ICON_PATH):
                    try:
                        self.set_icon_from_file(ICON_PATH)
                    except Exception:
                        pass

                self.webview = WebKit2.WebView()
                settings = self.webview.get_settings()
                settings.set_enable_developer_extras(False)
                settings.set_enable_javascript(True)
                settings.set_enable_webgl(True)
                settings.set_javascript_can_open_windows_automatically(True)

                self.webview.load_uri(APP_URL)

                scrolled = Gtk.ScrolledWindow()
                scrolled.add(self.webview)
                self.add(scrolled)

                self.connect("destroy", self.on_window_close)

            def on_window_close(self, widget):
                cleanup()
                Gtk.main_quit()

        win = TradingAppWindow()
        win.show_all()
        Gtk.main()
        return True
    except Exception as e:
        return False

def launch_fallback_browser():
    browsers = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "brave-browser", "msedge"]
    for b in browsers:
        try:
            b_path = subprocess.run(["which", b], stdout=subprocess.PIPE, text=True).stdout.strip()
            if b_path:
                subprocess.run([b_path, f"--app={APP_URL}", "--name=trading-platform"], check=True)
                cleanup()
                return
        except Exception:
            pass

    subprocess.run(["xdg-open", APP_URL])

def main():
    start_backend()
    if not launch_native_window():
        launch_fallback_browser()

if __name__ == "__main__":
    try:
        main()
    finally:
        cleanup()
EOF

chmod +x "$BUILD_DIR/opt/trading-platform/trading-platform"
chmod +x "$BUILD_DIR/opt/trading-platform/TradingPlatform.Api"
ln -sf /opt/trading-platform/trading-platform "$BUILD_DIR/usr/bin/trading-platform"

echo "=== 7. Creating DEBIAN package metadata ==="
cat << EOF > "$BUILD_DIR/DEBIAN/control"
Package: ${PKG_NAME}
Version: ${PKG_VERSION}
Section: utils
Priority: optional
Architecture: ${PKG_ARCH}
Depends: libc6, libgcc-s1, libstdc++6, python3
Recommends: python3-gi, gir1.2-gtk-3.0, gir1.2-webkit2-4.1
Maintainer: Trading Platform Team <support@tradingplatform.local>
Description: High-Performance Algorithmic Trading Platform & AI Copilot
 Institutional-grade desktop trading terminal with real-time charting,
 automated multi-strategy scanner, risk management guardrails, and AI Market Copilot.
 Features Demo Simulator mode, OANDA v20, and MT5 ZeroMQ connectivity.
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

chmod +x /opt/trading-platform/TradingPlatform.Api || true
chmod +x /opt/trading-platform/trading-platform || true
chmod +x /usr/bin/trading-platform || true

exit 0
EOF

cat << 'EOF' > "$BUILD_DIR/DEBIAN/prerm"
#!/bin/bash
set -e

pkill -f "/opt/trading-platform/TradingPlatform.Api" || true

exit 0
EOF

chmod 755 "$BUILD_DIR/DEBIAN"
chmod 644 "$BUILD_DIR/DEBIAN/control"
chmod 755 "$BUILD_DIR/DEBIAN/postinst"
chmod 755 "$BUILD_DIR/DEBIAN/prerm"

echo "=== 8. Packaging with dpkg-deb ==="
dpkg-deb --build --root-owner-group "$BUILD_DIR" "$DEB_FILE"

echo "=== 9. Verifying created .deb package ==="
ls -lh "$DEB_FILE"
dpkg-deb --info "$DEB_FILE"
dpkg-deb --contents "$DEB_FILE" | head -n 35

echo "========================================================================"
echo " SUCCESS: Debian package built at: $DEB_FILE"
echo " To install on Ubuntu: sudo dpkg -i $DEB_FILE"
echo "========================================================================"
