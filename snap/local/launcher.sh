#!/bin/bash
set -e

# 1. Disable WebKit internal namespace sandbox & hardware compositing
# Hardware EGL compositing fails inside strict AppArmor sandbox (EGL_BAD_PARAMETER)
export WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS=1
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export WEBKIT_DISABLE_DMABUF_RENDERER=1
export WEBKIT_DMABUF_RENDERER_DISABLE_GBM=1
unset WEBKIT_FORCE_SANDBOX
export GTK_MODULES=""

# 2. Force Dark Theme
export GTK_THEME="${GTK_THEME:-Adwaita:dark}"

# 3. GNOME Platform & Architecture Environment
ARCH_TRIPLET="${SNAP_ARCH_TRIPLET:-x86_64-linux-gnu}"

if [ -d "$SNAP/gnome-platform" ]; then
    export XDG_DATA_DIRS="$SNAP/gnome-platform/usr/share:$SNAP/usr/share:${XDG_DATA_DIRS:-/usr/share}"
    export GSETTINGS_SCHEMA_DIR="$SNAP/gnome-platform/usr/share/glib-2.0/schemas:${GSETTINGS_SCHEMA_DIR}"
    export LD_LIBRARY_PATH="$SNAP/gnome-platform/usr/lib/$ARCH_TRIPLET:$SNAP/gnome-platform/usr/lib:$SNAP/gnome-platform/lib/$ARCH_TRIPLET:$SNAP/gnome-platform/lib:${LD_LIBRARY_PATH}"
fi

# 4. User data & compatibility directories
export TRADING_PLATFORM_DATA_DIR="$SNAP_USER_DATA/data"
mkdir -p "$TRADING_PLATFORM_DATA_DIR"
mkdir -p "$SNAP_USER_DATA/.local/share/trading-platform"
COMPAT_DIR="$SNAP_USER_DATA/.local/share/trading-platform/compat"
mkdir -p "$COMPAT_DIR"

# 5. Ensure Photino.Native symlink
if [ ! -f "$COMPAT_DIR/libPhotino.Native.so" ]; then
    if [ -f "$SNAP/bin/Photino.Native.so" ]; then
        ln -sf "$SNAP/bin/Photino.Native.so" "$COMPAT_DIR/libPhotino.Native.so"
    elif [ -f "$SNAP/Photino.Native.so" ]; then
        ln -sf "$SNAP/Photino.Native.so" "$COMPAT_DIR/libPhotino.Native.so"
    fi
fi

# 6. Library Search Path
export LD_LIBRARY_PATH="$SNAP/bin:$COMPAT_DIR:${LD_LIBRARY_PATH}"

# 7. Launch native desktop executable
if [ -f "$SNAP/bin/TradingPlatform.Desktop" ]; then
    exec "$SNAP/bin/TradingPlatform.Desktop" "$@"
else
    exec "$SNAP/TradingPlatform.Desktop" "$@"
fi
