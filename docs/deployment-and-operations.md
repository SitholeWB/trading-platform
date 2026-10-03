# Deployment & Operations Guide

This guide covers setting up, running, configuring, and deploying the Trading Platform in development and production environments.

---

## 1. Prerequisites

- **.NET 10.0 SDK** (LTS) or higher:
  ```bash
  dotnet --version
  ```
- **Node.js** (v18.0 or higher) & **npm**:
  ```bash
  node -v && npm -v
  ```
- *(Optional)* **MetaTrader 5 Desktop Terminal** (if using the local ZeroMQ bridge).

---

## 2. Quick Start

### 1. Build and Run All Tests
```bash
dotnet test TradingPlatform.slnx
```

### 2. Run the Web Workstation & API Host
```bash
dotnet run --project src/Presentation/TradingPlatform.Api/TradingPlatform.Api.csproj
```
- **Web Terminal**: Open `http://localhost:5000` in any browser.
- **Swagger / OpenAPI**: Accessible at `http://localhost:5000/openapi/v1.json`.

### 3. Run the Headless Ingestion & Execution Worker
In a separate terminal:
```bash
dotnet run --project src/Presentation/TradingPlatform.Worker/TradingPlatform.Worker.csproj
```

---

## 3. Frontend Development (Vite Hot-Reload)

To run the frontend in standalone development mode with Vite hot-reloading:

```bash
cd src/Presentation/TradingPlatform.Web
npm install
npm run dev
```
The development server will launch at `http://localhost:5173`, automatically proxying `/api` requests to the .NET backend running at `http://localhost:5000`.

### Recompiling Frontend for Production:
```bash
cd src/Presentation/TradingPlatform.Web
npm run build
```
This compiles the TypeScript application and emits static assets into `src/Presentation/TradingPlatform.Api/wwwroot/`.

---

## 4. Broker Configuration

### Option A: Keyless Public Feeds (Default)
Out of the box, no configuration is required. The platform connects automatically to:
- **Binance Public** for Crypto.
- **Crumb-Authenticated Yahoo Finance** for Forex, Stocks, and Commodities.
- **European Central Bank (Frankfurter)** for automatic Forex fallback.

### Option B: MetaTrader 5 (MT5) ZeroMQ Bridge
To execute live trades and pull raw ticks directly from MetaTrader 5:
1. Attach the NetMQ MQL5 Expert Advisor to your target chart in MT5.
2. The EA will bind:
   - **`tcp://localhost:5556`** (PUB socket for streaming ticks & candle closes).
   - **`tcp://localhost:5555`** (REP socket for order dispatch & modifications).
3. In the Web UI, open **Settings** $\rightarrow$ set Active Provider to **"MetaTrader 5 ZeroMQ Bridge"**.

### Option C: OANDA v20 REST & Streaming
To trade directly through an OANDA Practice or Live account:
1. In the Web UI, open **Settings**.
2. Enter your **OANDA API Personal Access Token** and **Account ID**.
3. Select Environment (`Practice` or `Live`).
4. Set Active Provider to **"OANDA v20"**.

---

## 5. Production Deployment (Linux / Docker)

### Systemd Service Setup (Ubuntu / Debian VPS)
To run the platform as a persistent system daemon on a Linux server:

1. Create service unit `/etc/systemd/system/trading-platform-api.service`:
   ```ini
   [Unit]
   Description=Trading Platform API & Workstation
   After=network.target

   [Service]
   WorkingDirectory=/opt/TradingPlatform/src/Presentation/TradingPlatform.Api
   ExecStart=/usr/bin/dotnet run --project TradingPlatform.Api.csproj -c Release --urls "http://0.0.0.0:5000"
   Restart=always
   RestartSec=10
   SyslogIdentifier=trading-api
   User=trader
   Environment=ASPNETCORE_ENVIRONMENT=Production

   [Install]
   WantedBy=multi-user.target
   ```

2. Enable and start:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now trading-platform-api
   ```

---

## 6. Troubleshooting & Diagnostics

| Symptom | Diagnostic Step | Solution |
| :--- | :--- | :--- |
| **Yahoo returns 401 or 403** | Check `GET /api/market-data/health` | The session manager auto-heals on failure. If your VPS IP is temporarily flagged, the composite provider automatically switches Forex to European Central Bank (Frankfurter) and Crypto to Binance. |
| **ZeroMQ connection fails** | Verify MT5 EA is running and "Allow DLL imports" is enabled | Ensure no other process is bound to ports `5555` or `5556` (`netstat -tuln \| grep 555`). |
| **Kill switch engaged unexpectedly** | Check `GET /api/risk` for reason | Daily drawdown limit was reached or equity dipped. Open the Kill Switch modal and click **Disengage** after risk verification. |
| **Drawings not syncing to backend** | Inspect browser console for network errors | Drawings are stored in `localStorage` first (offline-first), so no drawings are ever lost even if the backend is temporarily offline. |
