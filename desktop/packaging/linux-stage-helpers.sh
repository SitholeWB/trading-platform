#!/usr/bin/env bash
# Shared staging helpers for Linux packaging scripts.

stage_linux_bundle() {
  local stage_dir="$1"
  local bundle_dir="$2"
  local icon_src="$3"
  local desktop_file="$4"
  local app_id="${5:-com.tradingplatform.desktop}"

  mkdir -p "$stage_dir/opt/trading-platform"
  mkdir -p "$stage_dir/usr/bin"
  mkdir -p "$stage_dir/usr/share/applications"

  cp -a "$bundle_dir"/. "$stage_dir/opt/trading-platform/"
  chmod +x "$stage_dir/opt/trading-platform/trading_platform"

  for lib in libcef.so libGLESv2.so libvk_swiftshader.so libvulkan.so.1 libEGL.so libflutter_linux_gtk.so libwebview_cef_plugin.so; do
    if [[ -f "$stage_dir/opt/trading-platform/lib/$lib" ]]; then
      strip --strip-unneeded "$stage_dir/opt/trading-platform/lib/$lib" || true
    fi
  done

  cat > "$stage_dir/usr/bin/trading-platform" <<'EOF'
#!/usr/bin/env bash
exec /opt/trading-platform/trading_platform "$@"
EOF
  chmod 0755 "$stage_dir/usr/bin/trading-platform"

  sed 's|Exec=trading-platform %U|Exec=/opt/trading-platform/trading_platform %U|' \
    "$desktop_file" > "$stage_dir/usr/share/applications/${app_id}.desktop"
  chmod 0644 "$stage_dir/usr/share/applications/${app_id}.desktop"

  for size in 48 64 128 256 512; do
    local icon_dir="$stage_dir/usr/share/icons/hicolor/${size}x${size}/apps"
    mkdir -p "$icon_dir"
    if command -v python3 >/dev/null 2>&1 && python3 -c "import PIL" 2>/dev/null; then
      python3 - <<PY
from PIL import Image
im = Image.open("$icon_src").convert("RGBA")
im = im.resize(($size, $size), Image.Resampling.LANCZOS)
im.save("$icon_dir/${app_id}.png")
PY
    elif command -v convert >/dev/null 2>&1; then
      convert "$icon_src" -resize "${size}x${size}" "$icon_dir/${app_id}.png"
    else
      cp "$icon_src" "$icon_dir/${app_id}.png"
    fi
  done
}
