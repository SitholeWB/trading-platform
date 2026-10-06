# Snap Store Listing Guide for Trading Platform

This guide explains how to set up your **App Icon/Logo** and **Screenshots** on the Canonical Snap Store (Ubuntu Software & [snapcraft.io/trading-platform](https://snapcraft.io)).

---

## 1. App Icon / Logo

### Automatic Sync via the `.snap` Package
- The package already bundles `meta/gui/icon.png` (512×512 RGBA PNG) and `meta/gui/trading-platform.png`.
- When you run `snapcraft upload ...`, Canonical's store ingestion automatically reads `meta/gui/icon.png` and displays it on the web listing.

### Manual Upload (Recommended for Instant High-Res Rendering)
1. Go to the [Snapcraft Developer Dashboard](https://dashboard.snapcraft.io/snaps/trading-platform/listing/).
2. Under **App Icon**, click **Change icon** or **Upload icon**.
3. Select:
   ```
   store-assets/icon-512x512.png
   ```
4. Click **Save** at the bottom of the page.

---

## 2. Adding Screenshots

Canonical does not embed screenshot image files inside the binary `.snap` package (to keep download sizes fast for end users). Instead, screenshots are published via the **Snapcraft Dashboard**:

### How to Upload Screenshots
1. Open [dashboard.snapcraft.io/snaps/trading-platform/listing/](https://dashboard.snapcraft.io/snaps/trading-platform/listing/).
2. Scroll to the **Screenshots** section.
3. Click **Add screenshot** (you can upload up to 10 screenshots).
4. Recommended format:
   - **Aspect Ratio**: 16:9 (e.g., 1920×1080 or 1280×720) or 4:3.
   - **Format**: PNG or JPEG.
   - **Size limit**: Up to 2 MB per screenshot.

### Capturing Live Screenshots from your Running App
Now that the app runs on your Linux desktop:
1. Launch the app:
   ```bash
   snap run trading-platform
   ```
2. Take screenshots of key views using the Ubuntu shortcut:
   - **`PrtScn`** or **`Shift + PrtScn`** (or open the **Screenshot** app).
   - Capture:
     1. **Live Charts & Indicators**: Main trading terminal with candlestick chart, volume, and indicators (EMA, RSI, MACD).
     2. **Dynamic Strategy Studio**: Visual rule builder showing entry/exit conditions.
     3. **Watchlist & Quick Order Widget**: Real-time quotes and buy/sell execution.
     4. **AI Market Copilot**: Real-time AI analysis & trade commentary.
3. Save the screenshots in `store-assets/screenshots/`.
4. Upload them directly to the **Listing** page.

---

## 3. Store Listing Copy (Ready to Paste)

### Title
```
Trading Platform
```

### Summary (1 line)
```
Institutional Algorithmic Trading Platform, Live Charts & AI Copilot
```

### Categories
- **Finance** (Primary)
- **Office** (Secondary)

### Description (Markdown supported)
```markdown
Trading Platform is an institutional-grade desktop trading terminal combining real-time multi-timeframe candlestick charting, automated multi-strategy market scanning, strict risk guardrails, and an integrated AI Market Copilot.

### Key Capabilities:
- **Real-Time Candlestick Charts**: Sub-second price ticks across 1m, 5m, 15m, 1h, 4h, and 1d timeframes.
- **10+ Technical Indicators**: Built-in support for Multi-period EMAs (9, 21, 50, 200), SMA, RSI, MACD, Bollinger Bands, ATR, and VWAP.
- **Autonomous Strategy Scanner**: Visual query builder for designing algorithmic rules that scan across Forex, Equities, and Cryptocurrencies.
- **Risk Management Guardrails**: Capital preservation controls including max daily drawdown limits, stop-loss enforceability, and quick order execution.
- **AI Market Copilot**: Machine-learning powered contextual market commentary and strategy validation.
```
