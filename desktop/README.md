# Quantum Trading Platform — Flutter Desktop Workstation

Standalone Linux/Desktop algorithmic trading, multi-timeframe charting, journaling, and AI Copilot application.

For a complete visual & architectural walkthrough of every page, service, and AI pipeline, see **[`../docs/desktop-app-guide.md`](../docs/desktop-app-guide.md)**.

## Quick Start

1. **Install dependencies**
   ```bash
   flutter pub get
   ```
2. **Optional: Configure AI API key via `.env.json`** (never committed to git)
   ```json
   {
     "GEMINI_API_KEY": "your-key-here"
   }
   ```
   *(You can also configure Gemini, OpenAI, Anthropic, Groq, OpenRouter, or local Ollama directly in the in-app Settings dialog.)*

3. **Run in debug mode**
   ```bash
   flutter run -d linux --dart-define-from-file=.env.json
   ```

4. **Run tests**
   ```bash
   flutter test --no-pub
   ```

5. **Build Linux release binary**
   ```bash
   flutter build linux --release --dart-define-from-file=.env.json
   ./build/linux/x64/release/bundle/trading_platform
   ```

## Source Structure (`lib/`)

- `lib/main.dart` — App entry point, theme setup, and service initialization.
- `lib/models/trading_models.dart` — Candles, Positions, Strategies, Rules, Journal Entries, Copilot Sessions, Audit Logs.
- `lib/services/` — `MarketDataService`, `IndicatorEngine`, `StrategyScanner`, `AiCopilotService`, `StorageService`, `SymbolCatalog`, `NotificationService`.
- `lib/ui/app_shell.dart` — Navigation rail, top bar, status bar, Copilot drawer host, and global state orchestration.
- `lib/ui/pages/` — `Dashboard`, `Market Scanner`, `Strategies`, `Audit Radar`, `Positions`, `Journal`, `Simulator`, `Live Chart`, `Documentation`.
- `lib/ui/chart/` — Native GPU-accelerated candlestick chart + TradingView CEF live widget.
- `lib/ui/dialogs/` — AI Copilot drawer, Settings, Alerts, Symbol Search, Timezone, Language, Shortcuts.
- `lib/ui/widgets/` — Shared widgets including `MarkdownMessageView`.
