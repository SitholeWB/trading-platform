# Algorithmic Trading Platform & Charting Workstation Documentation

Welcome to the complete technical and operational documentation for the **Enterprise Modular Trading Platform (.NET 10 LTS & React/TypeScript)**.

This system is an all-in-one institutional trading workstation combining **TradingView-grade interactive multi-timeframe charting** with an **autonomous algorithmic execution and risk management engine**.

---

## 📚 Documentation Index

| Guide | Description |
| :--- | :--- |
| **[1. System Architecture](architecture.md)** | Clean Architecture, CQRS mediator, Hexagonal ports & adapters, idempotency guarantees, and project structure. |
| **[2. Charting Workstation](charting-workstation.md)** | Interactive candlestick engine, viewport zoom locking, multi-chart grid layouts (1x2, 2x2), persistent drawings CRUD, on-chart trade overlay, and audio price alerts. |
| **[3. Market Data & Failover](market-data-providers.md)** | Zero-key market feeds, automated Yahoo cookie/crumb session manager, European Central Bank (Frankfurter) integration, Binance public streams, and multi-tier auto-failover. |
| **[4. Rule Engine & Bot Execution](rule-engine-and-bots.md)** | Dynamic strategy compilation, Skender indicator calculator, closed-candle invariant, near-miss radar, and trade execution. |
| **[5. Risk Management & Kill Switch](risk-management-and-killswitch.md)** | 10-second equity heartbeat monitor, maximum daily drawdown protection, emergency kill switch, and broker lockout. |
| **[6. REST API Reference](api-reference.md)** | Complete specification of all API endpoints across market data, orders, positions, strategies, audit logs, and chart state. |
| **[7. Deployment & Operations](deployment-and-operations.md)** | Quick start, local development, Docker deployment, MetaTrader 5 ZeroMQ EA setup, and troubleshooting. |

---

## 🌟 Key System Capabilities

```mermaid
flowchart TD
    subgraph Market Ingestion & Keyless Data
        Binance[Binance Public Spot REST/WS]
        Yahoo[Yahoo Finance Crumb Authenticated]
        ECB[European Central Bank Frankfurter API]
        Oanda[OANDA v20 Streaming]
        MT5[MetaTrader 5 ZeroMQ Bridge]
    end

    subgraph Core Platform (.NET 10 LTS)
        Failover[Composite Market Data & Failover Circuit]
        CQRS[Custom CQRS Mediator Pipeline]
        Rules[Microsoft.RulesEngine + Quantitative Scanner]
        Risk[Risk Management & 10s Equity Heartbeat]
        Store[(SQLite Database + Unique Constraints)]
    end

    subgraph Presentation & Terminal
        API[ASP.NET Core REST API]
        UI[React 18 + Lightweight Charts Workstation]
        Worker[Headless Scanning & Execution Worker]
    end

    Binance --> Failover
    Yahoo --> Failover
    ECB --> Failover
    Oanda --> Failover
    MT5 --> Failover

    Failover --> CQRS
    CQRS --> Rules
    Rules --> Risk
    Risk --> Store
    CQRS --> Store

    API <--> UI
    Worker <--> CQRS
    Store <--> API
```

### Highlights:
1. **Institutional Interactive Charting**:
   - Zero-jump, viewport-anchored infinite history loading.
   - Multi-chart split views (1x2, 2x2 grid) with independent timeframe analysis.
   - Persistent drawing tools (trendlines, channels, rectangles, Fibonacci) saved per symbol.
   - Interactive on-chart order lines: click & drag SL/TP, floating PnL, and 1-click execution.
   - Price level alarms with Web Audio API chime and animated alert banners.
2. **100% Out-of-the-Box Keyless Feeds**:
   - Instant live multi-asset data across Crypto, Forex, Stocks, Indices, and Commodities without needing paid broker keys.
   - Automated Yahoo cookie/crumb session manager with transparent 401/403 auto-healing.
   - Multi-tier failover circuit routing to European Central Bank (Frankfurter) and Binance Public.
3. **Institutional Execution & Risk Protection**:
   - Swappable broker adapters: OANDA v20 REST/streaming and MetaTrader 5 NetMQ bridge.
   - Strict Closed-Candle invariant preventing false triggers on forming bars.
   - Database-enforced fingerprint idempotency preventing duplicate orders.
   - Automated 10-second equity heartbeat and emergency kill switch.
