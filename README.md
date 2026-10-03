# Enterprise Modular Forex Scanning & Algorithmic Execution System (.NET 10 LTS)

A production-ready algorithmic trading platform built with **Clean Architecture**, **CQRS (Command Query Responsibility Segregation)**, and a **Hexagonal (Ports and Adapters)** architecture.

---

## 📖 Comprehensive Documentation

Complete technical guides and mermaid architectural diagrams are available in the [`docs/`](docs/README.md) directory:

- 🏗️ **[System Architecture](docs/architecture.md)** — Clean Architecture, CQRS mediator, ports & adapters, and database constraints.
- 📈 **[Charting Workstation](docs/charting-workstation.md)** — Viewport zoom locking, persistent drawings CRUD, multi-chart grid layouts, on-chart trade overlay, and audio alerts.
- 🌐 **[Market Data Feeds & Failover](docs/market-data-providers.md)** — Zero-key feeds, Yahoo Cookie/Crumb session manager, European Central Bank (Frankfurter) fallback, and Binance streams.
- 🤖 **[Rule Engine & Autonomous Bots](docs/rule-engine-and-bots.md)** — Quantitative strategy compilation, closed-candle invariant, and near-miss radar.
- 🛡️ **[Risk Management & Kill Switch](docs/risk-management-and-killswitch.md)** — 10-second equity heartbeat, daily drawdown limits, and emergency liquidation circuit.
- 📡 **[REST API Reference](docs/api-reference.md)** — Complete specification of all API endpoints.
- 🚀 **[Deployment & Operations](docs/deployment-and-operations.md)** — Local setup, MetaTrader 5 ZeroMQ configuration, and production hosting.

---

## 1. Architecture & Design Principles

```text
TradingPlatform/
├── src/
│   ├── Core/
│   │   ├── TradingPlatform.Domain/              # Pure domain entities, value objects, domain events, business invariants
│   │   └── TradingPlatform.Application/         # Custom CQRS mediator, pipeline behaviors, commands, queries, custom validation, custom resilience
│   ├── Infrastructure/
│   │   ├── TradingPlatform.Persistence/         # EF Core DbContext, entity configurations, unique constraints, repositories
│   │   ├── TradingPlatform.RulesEngine/         # Microsoft.RulesEngine integration, React Query Builder compiler, Skender indicator calculator
│   │   ├── TradingPlatform.Broker.Abstractions/ # Ports: IMarketDataStreamer, IOrderExecutionService, IHistoricalDataProvider
│   │   ├── TradingPlatform.Broker.Oanda/        # Adapter: Oanda v20 REST API + streaming HTTP client
│   │   ├── TradingPlatform.Broker.ZeroMQ/       # Adapter: NetMQ PUB/SUB (tcp://5556) & REQ/REP (tcp://5555) MT5 bridge
│   │   └── TradingPlatform.AI.Abstractions/     # Pluggable contracts for AI reasoning, vision verification, & embeddings
│   └── Presentation/
│       ├── TradingPlatform.Worker/              # BackgroundServices for candle ingestion, live scanning, and 10s heartbeat/kill switch
│       └── TradingPlatform.Api/                 # REST API for UI/dashboard management (Strategy CRUD, Trade Audits, Positions, Risk)
└── tests/
    ├── TradingPlatform.UnitTests/               # Unit tests for CQRS, validation, resilience, indicators, rules, execution
    └── TradingPlatform.IntegrationTests/        # E2E pipeline tests, idempotency guards, and WebApplicationFactory API tests
```

---

## 2. Key Architectural Decisions

1. **Custom CQRS & Pipeline Behaviors (No MediatR / Wolverine):**
   - Implemented a lightweight, strongly typed Mediator (`IMediator`, `IRequest<T>`, `ICommand<T>`, `IQuery<T>`) with dynamic pipeline chaining:
     - `LoggingBehavior<TRequest, TResponse>`: Structured execution logging.
     - `PerformanceMetricsBehavior<TRequest, TResponse>`: Execution duration tracking and slow request alerting.
     - `ValidationBehavior<TRequest, TResponse>`: Pipeline validation interceptor.

2. **Custom Validation Framework (No FluentValidation):**
   - Built a custom fluent validation engine (`AbstractValidator<T>`, `RuleFor`, `NotEmpty`, `GreaterThan`, `LessThan`, `Must`) and validation result records.

3. **Custom Resilience Engine (No Polly):**
   - Implemented an industrial-grade resilience framework without third-party dependencies:
     - `CircuitBreakerPolicy`: State machine (`Closed` $\rightarrow$ `Open` $\rightarrow$ `HalfOpen`), failure threshold counter, break duration timer, and execution gates.
     - `RetryPolicy`: Exponential backoff with random jitter and exception filters.
     - `TimeoutPolicy`: Linked cancellation token management.
     - `ResiliencePipeline`: Unified wrapper combining retry, circuit breaking, and timeouts.

4. **Swappable Broker Ports & Adapters:**
   - `OandaGateway`: Chunked HTTP streaming for market data pricing streams and REST order dispatch.
   - `ZeroMqGateway`: Native `NetMQ` `SubscriberSocket` (`tcp://localhost:5556`) and `RequestSocket` (`tcp://localhost:5555`) to interface with MetaTrader 5 (MT5) MQL5 Expert Advisors.

5. **Dynamic Rule Compilation & Near-Miss Auditing:**
   - Uses `Microsoft.RulesEngine` with a bidirectional compiler supporting both native RulesEngine schemas and React Query Builder JSON syntax (`combinator`, `field`, `operator`, `value`, `valueSource`).
   - Supports deterministic multi-stage pattern tracking:
     - `FullyMet`: 100% of conditions satisfied $\rightarrow$ triggers execution.
     - `NearMiss`: $\ge 60\%$ of conditions satisfied $\rightarrow$ journals near-miss pattern and failure analysis for quantitative auditing.

6. **Strict Operational Invariants:**
   - **Never Trade on Incomplete Candles:** Strict gatekeeping checks `Candle.IsComplete == true`. Incomplete candles are kept for tick monitoring only.
   - **Strict Idempotency:** DB unique constraint on `SignalAuditLog.SignalFingerprint` (`$"{Symbol}_{Timeframe}_{CandleTimestamp:yyyyMMddHHmm}_{StrategyId}"`) physically prevents double execution across parallel worker threads.
   - **10s Heartbeat & Kill Switch Worker:** Monitors broker connectivity and account equity every 10 seconds. Breached drawdown immediately engages the kill switch and liquidates all open positions.

---

## 3. Running and Testing

### Run All Unit and Integration Tests
```bash
dotnet test TradingPlatform.slnx
```

### Run the Background Worker
```bash
dotnet run --project src/Presentation/TradingPlatform.Worker/TradingPlatform.Worker.csproj
```

### Run the Management REST API & Web Workstation
```bash
dotnet run --project src/Presentation/TradingPlatform.Api/TradingPlatform.Api.csproj
```
- **Web Terminal UI**: Open `http://localhost:5000` in any browser to access the complete trading terminal.
- **OpenAPI / Swagger**: Available at `http://localhost:5000/openapi/v1.json`.

### Frontend Development Mode (Vite + React)
```bash
cd src/Presentation/TradingPlatform.Web
npm install
npm run dev
```
Hot-reloading workstation will be available at `http://localhost:5173` proxying API requests to `http://localhost:5000`.

To build the frontend directly into the .NET API static file host:
```bash
cd src/Presentation/TradingPlatform.Web
npm run build
```

---

## 4. Frontend Workstation Modules

The terminal (`TradingPlatform.Web`) features:
1. **Interactive Candlestick & Indicator Chart:**
   - Powered by TradingView Lightweight Charts.
   - Overlays EMA 20/50/200, Ichimoku Cloud boundaries, RSI(14) oscillator panel, and trade entry/exit markers.
2. **Visual Rule Studio (React Query Builder):**
   - No-code rule builder for technical parameters (`Close`, `Rsi14`, `Ema20`, `Ema50`, `Ema200`, `Atr14`, `BodyRatio`, `UpperWickRatio`, `LowerWickRatio`).
   - Dynamic compilation to Microsoft.RulesEngine JSON schemas.
3. **Near-Miss Radar & Auditing:**
   - Real-time inspector showing patterns meeting $\ge 60\%$ but $< 100\%$ of rule conditions.
   - Shows the exact rule that caused the near-miss (e.g. `VolumeSurgeCheck` failed).
4. **Live Positions & Ledger:**
   - Displays tickets, entry price, mark price, stop loss, take profit, and live P&L.
   - One-click manual position liquidation.
5. **Risk Console & Kill Switch:**
   - Real-time dials for daily drawdown, total open positions, currency pair exposure, and spread guards.
   - High-priority Emergency Kill Switch that immediately halts auto-trading and closes all open positions across connected brokers.
6. **Market Simulator:**
   - Inject simulated tick or completed candle data to test indicator calculations, strategy rules, near-miss logging, and broker order execution.
