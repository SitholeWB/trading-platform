import 'package:flutter/material.dart';
import 'localization_service.dart';
import 'section_docs_l10n.dart';

class SectionDoc {
  final String id;
  final String title;
  final String category;
  final IconData icon;
  final String markdown;

  const SectionDoc({
    required this.id,
    required this.title,
    required this.category,
    required this.icon,
    required this.markdown,
  });
}

class SectionDocs {
  static const List<SectionDoc> all = [
    SectionDoc(
      id: 'dashboard',
      title: 'Dashboard — Account, Watchlist & Quick Execution',
      category: 'Workspace & Trading',
      icon: Icons.dashboard_outlined,
      markdown: '''
### What Dashboard Does
The **Dashboard** is your command center for paper/demo account health, live watchlist quotes, open positions, and fast order entry.

### How to Use It
- **Account KPIs:** Monitor **Balance**, **Equity**, **Unrealized P&L**, and **Daily Drawdown %** against your configured daily risk limit.
- **Watchlist:** Click any symbol in the watchlist to switch the active instrument across the platform, or jump straight to **Live Chart**.
- **Quick Order Ticket:** Place instant **Buy** or **Sell** paper orders with lot sizing and optional Stop-Loss / Take-Profit.
''',
    ),
    SectionDoc(
      id: 'scanner',
      title: 'Market Scanner — Multi-Asset Technical Radar',
      category: 'Scanner & Risk',
      icon: Icons.radar,
      markdown: '''
### What Market Scanner Does
The **Market Scanner** scans Forex, Crypto, Indices, Commodities, and Stocks locally using **EMA 20/50 alignment**, **RSI(14)**, and **ATR(14)** volatility—using **0 AI tokens**.

### How to Use It
1. Choose your **Category** filter (All, Forex, Crypto, Indices, Commodities, Stocks) and **Timeframe**.
2. Click **Scan Market** to rank instruments by signal strength (`Strong Buy`, `Buy`, `Neutral`, `Sell`, `Strong Sell`).
3. Click **Chart** on any row to inspect the setup on **Live Chart**, or use **Quick Buy/Sell** directly.
''',
    ),
    SectionDoc(
      id: 'strategies',
      title: 'Strategies — Nested Rules, AI Compiler & 0-Token Backtester',
      category: 'Rule Studio & AI',
      icon: Icons.bolt,
      markdown: '''
### What Strategies (Rule Studio) Does
Build, compile, backtest, and run algorithmic strategies with **0-token local execution** in Dart.

### Key Features & How to Use Them
1. **Plain-Text AI Strategy Compiler (Sparkle Button):** Describe your strategy and target universe in plain English (e.g. *"Major FX H1 with H4 200 EMA trend filter: ADX >= 20 AND (RSI < 35 OR Bullish Engulfing)"*).
   - **Cloud/Local LLM (Gemini, OpenAI, Anthropic, Ollama):** Compiles full nested `AND`/`OR` logic, HTF filters, and trade management in 1 call (~500 tokens).
   - **Built-in Keyword Compiler:** Limited fallback if no external AI is configured; it warns you when complex nested logic cannot be parsed.
2. **Nested AND/OR Rule Tree:** Combine non-negotiable filters in an outer `AND` group with multiple entry triggers in a nested `OR` group (`+ Nested Group`).
3. **Supported Indicators & Price Action:**
   - Trend & MAs: `EMA_CROSS`, `SMA_CROSS`, `EMA_TREND`, `SUPERTREND`, `VWAP_CROSS`, `ICHIMOKU_BULL`, `ADX_TREND`
   - Momentum & Volatility: `RSI_OS`, `RSI_OB`, `MACD_CROSS`, `BB_BREAK`, `ATR_VOLATILITY`
   - Price Action & Filters: `DONCHIAN_BREAK`, `ENGULFING`, `PIN_BAR`, `VOLUME_SPIKE`, `SESSION_UTC`
4. **Trade Management & Guardrails:** Configure **Direction Mode** (`LongOnly`, `Both` auto-mirrored, `ShortOnly`), **HTF Trend Filter** (`H1`/`H4`/`D1`), **Break-Even (R)**, **Trailing ATR**, **Max Hold Bars**, **SL Cooldown Bars**, **Spread (bps)**, and **Optional Exit Rules**.
5. **Risk & Evaluation Tab (0 Tokens):**
   - **Run Backtest:** Tests 100–5,000 historical bars on 1 symbol or across an entire **Universe** (`MAJORS`, `FOREX`, `CRYPTO`, `METALS`, etc.).
   - **Scan Universe:** Evaluates all pairs in your universe locally; click **AI 2nd Opinion** on any triggered hit to have AI review only that setup.
''',
    ),
    SectionDoc(
      id: 'radar',
      title: 'Audit Radar — Signal & Near-Miss Diagnostics',
      category: 'Scanner & Risk',
      icon: Icons.track_changes,
      markdown: '''
### What Audit Radar Does
**Audit Radar** logs every strategy evaluation (`Executed`, `NearMiss`, `Rejected`) with exact match scores and rule breakdowns.

### How to Use It
- Inspect **NearMiss** entries (e.g. 2 out of 3 rules matched) to see which condition blocked an entry.
- Verify why paused strategies or risk-gated signals were **Rejected**.
''',
    ),
    SectionDoc(
      id: 'positions',
      title: 'Positions — Open & Closed Trade Ledger',
      category: 'Workspace & Trading',
      icon: Icons.work_outline,
      markdown: '''
### What Positions Does
Tracks all open and closed paper trades with real-time unrealized P&L, SL/TP editing, and post-trade review metadata.

### How to Use It
- **Modify SL/TP** or **Close** any open position in 1 click.
- **Trade Review:** Add a **Setup Tag**, **Execution Rating (1–5 stars)**, and **Trade Note** to build your performance history.
''',
    ),
    SectionDoc(
      id: 'journal',
      title: 'Journal — Split-Pane Markdown Trading Notebook',
      category: 'Workspace & Trading',
      icon: Icons.edit_note,
      markdown: '''
### What Journal Does
A full-featured **Markdown trading notebook** for pre-market plans, trade reviews, lessons learned, and saved AI Copilot analyses.

### How to Use It
- **Side Menu (Left):** Search by symbol, title, or keyword, filter by **Tag**, and click any note to read it.
- **Full-Page Editor (Right):** Click **New Note** or **Edit** to open the inline editor with **Write**, **Split** (side-by-side live preview), and **Preview** modes, plus quick Markdown & template chips.
- **From AI Copilot:** Save any single AI message or an **Entire Session**—either as a **New Note** or **Appended to an Existing Note**.
''',
    ),
    SectionDoc(
      id: 'sandbox',
      title: 'Simulator — Synthetic Market & Risk Stress-Test Lab',
      category: 'Scanner & Risk',
      icon: Icons.science_outlined,
      markdown: '''
### What Simulator Does
> **Note:** Uses **SYNTHETIC / FAKE DATA** (not real market prices). Unlike the **Strategy Tester** (which tests real past candles), the Simulator tests how your **strategies, SL/TP sizing, alerts, and risk management** survive extreme or synthetic conditions.

### Two Modes
1. **Strategy Stress-Test (Multi-Month Fake Data):**
   - Pick any saved strategy, choose **1M / 3M / 6M / 1Y** of generated candles, and select a regime (**Bullish Trend**, **Bearish Trend**, **Sideways / Whipsaw Chop**, or **High-Volatility & Flash Crashes**).
   - Inspect **Max Drawdown %**, **SL vs TP Exits**, **Worst Loss Streak**, and re-roll multiple synthetic runs.
2. **Live Shock Replay:**
   - Inject instant **Breakout +1.5%**, **Flash Crash -2.5%**, **Stop-Hunt Wicks**, or **Weekend Auto-Replay (1s)** ticks onto the live chart to verify SL/TP exits and price alerts, then click **Reset Live** to restore real market data.
''',
    ),
    SectionDoc(
      id: 'chart',
      title: 'Live Chart — Dual Chart Engines & Dynamic Precision',
      category: 'Charts & Precision',
      icon: Icons.candlestick_chart,
      markdown: '''
### What Live Chart Does
Switch seamlessly between the **Native GPU Bot Chart** and the embedded **TradingView Live** widget from the top bar.

### How to Use It
- **Indicators & Layouts:** Toggle `EMA`, `SMA`, `Bollinger Bands`, `VWAP`, `Supertrend`, `Ichimoku`, `RSI`, and `MACD`, or switch between **Single**, **Split**, and **Quad** chart grids.
- **Dynamic Precision:** Automatically displays up to 10+ decimals for micro-cap crypto tokens and exact pip precision for FX/Indices.
- **Drawings & Trade Overlay:** Draw trendlines, horizontal levels, Fibonacci retracements, rectangles, and view open position Entry / SL / TP lines directly on the chart.
''',
    ),
    SectionDoc(
      id: 'docs',
      title: 'AI Copilot, Sessions & Keyboard Shortcuts',
      category: 'Rule Studio & AI',
      icon: Icons.auto_awesome,
      markdown: '''
### AI Copilot Drawer
- **Persistent Sessions:** Every conversation is saved automatically (up to 30 sessions) so you can switch back and continue any prior analysis.
- **Expandable Workspace:** Toggle between side-drawer and full-width expanded view.
- **1-Click Actions:** Copilot replies can include executable buttons to place paper orders, set price alerts, create strategies, close positions, or save notes.
- **Local & Cloud AI:** Supports **Google Gemini**, **OpenAI**, **Anthropic**, **Groq**, **OpenRouter**, **Local Ollama**, and the **Built-in Quant** fallback.

### Keyboard Shortcuts
| Shortcut | Action |
| :--- | :--- |
| `Ctrl+K` | Quick Symbol Search |
| `Ctrl+J` | Quick New Journal Note |
| `Ctrl+B` | Toggle AI Copilot Drawer |
| `F1` | Open Documentation |
''',
    ),
  ];

  static List<SectionDoc> allForLanguage(String languageCode) {
    final map = kSectionDocsL10n[languageCode];
    if (map == null) return all;
    return all.map((doc) {
      final loc = map[doc.id];
      if (loc == null) return doc;
      return SectionDoc(
        id: doc.id,
        title: loc.title,
        category: AppL10n.t(languageCode, loc.categoryKey, doc.category),
        icon: doc.icon,
        markdown: loc.markdown,
      );
    }).toList();
  }

  static SectionDoc forSectionId(String id, {String languageCode = 'en'}) {
    final list = allForLanguage(languageCode);
    return list.firstWhere(
      (d) => d.id == id,
      orElse: () => list.first,
    );
  }
}
