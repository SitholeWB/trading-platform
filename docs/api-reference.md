# REST API Reference

The platform exposes a comprehensive Minimal API built with **ASP.NET Core (.NET 10 LTS)**.

**Base URL**: `http://localhost:5000/api`  
**OpenAPI Specification**: `http://localhost:5000/openapi/v1.json`

---

## 1. Market Data & Feeds (`/api/market-data`)

### `GET /api/market-data/candles`
Retrieves historical OHLCV candlestick series with backward pagination.

**Query Parameters:**
| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `symbol` | `string` | No | Asset symbol (e.g. `EURUSD`, `BTCUSDT`, `US500`). Default: `EURUSD`. |
| `timeframe` | `string` | No | Candle period (`M1`, `M5`, `M15`, `M30`, `H1`, `H4`, `D1`, `W1`, `MN1`). Default: `M5`. |
| `count` | `int` | No | Number of bars to return (1–1000). Default: `120`. |
| `before` | `long` | No | Unix timestamp in seconds to paginate strictly older bars. |

**Response (200 OK):**
```json
[
  {
    "symbol": "EURUSD",
    "timeframe": "M5",
    "timestamp": "2026-10-03T18:00:00Z",
    "open": 1.08502,
    "high": 1.08545,
    "low": 1.08490,
    "close": 1.08530,
    "volume": 842,
    "isComplete": true
  }
]
```

---

### `GET /api/market-data/symbols`
Returns the multi-asset catalog across Forex, Crypto, Indices, Commodities, and Stocks.

**Query Parameters:**
- `provider`: Filter by provider (`all`, `KeylessPublic`, `Oanda`, `ZeroMQ`).
- `category`: Filter by asset class (`all`, `forex`, `crypto`, `indices`, `commodities`, `stocks`).
- `search`: Search query string matching symbol or company name.

---

### `GET /api/market-data/health`
Returns real-time session health, Yahoo crumb status, and auto-failover metrics.

**Response (200 OK):**
```json
{
  "status": "Healthy",
  "isFailoverEngaged": false,
  "activeFailoverProvider": null,
  "lastFailoverReason": null,
  "lastFailoverUtc": null,
  "yahooSession": {
    "hasActiveSession": true,
    "crumbPreview": "7Q5jM/...",
    "ageMinutes": 1.2
  }
}
```

---

### `GET /api/market-data/providers`
Lists configured data providers, key requirements, and supported intervals.

---

## 2. Positions & Order Execution (`/api/positions`)

### `GET /api/positions`
Retrieves all open positions currently held across active brokers and database records.

---

### `POST /api/positions/order`
Dispatches a manual order (from the chart or trading console).

**Request Body:**
```json
{
  "symbol": "EURUSD",
  "orderType": "Buy",
  "lots": 0.50,
  "price": 1.08520,
  "stopLoss": 1.08200,
  "takeProfit": 1.09100
}
```

---

### `POST /api/positions/{ticket}/modify`
Adjusts Stop Loss (SL) and Take Profit (TP) on an open position.

**Request Body:**
```json
{
  "stopLoss": 1.08250,
  "takeProfit": 1.09200
}
```

---

### `POST /api/positions/{ticket}/close`
Liquidates an open position immediately at market price.

**Query Parameters:**
- `reason`: Optional exit description (e.g. `ManualClose`, `ChartOverlayClose`).

---

## 3. Strategy Studio (`/api/strategies`)

- **`GET /api/strategies`**: Lists all saved quantitative strategies.
- **`GET /api/strategies/{id}`**: Retrieves a specific strategy definition by GUID.
- **`POST /api/strategies`**: Creates a new strategy with rule set JSON.
- **`PUT /api/strategies/{id}`**: Updates existing strategy rules or toggles active status.
- **`DELETE /api/strategies/{id}`**: Deletes a strategy definition.

---

## 4. Signal Audit Logs (`/api/audit-logs`)

- **`GET /api/audit-logs?count=50`**: Returns recent trade execution audits and near-miss logs.
- **`GET /api/audit-logs/{fingerprint}`**: Retrieves details for an evaluation fingerprint.

---

## 5. Risk Management (`/api/risk`)

- **`GET /api/risk`**: Returns current account balance, equity, drawdown %, and kill switch state.
- **`POST /api/risk/kill-switch`**: Manually engages or disengages the emergency kill switch.
  ```json
  {
    "engage": true,
    "reason": "Operator manual emergency stop"
  }
  ```

---

## 6. Workstation Persistence (`/api/chart-drawings` & `/api/chart-alerts`)

- **`GET /api/chart-drawings/{symbol}`**: Returns JSON vector drawings saved for a symbol.
- **`POST /api/chart-drawings/{symbol}`**: Saves/syncs drawings array for a symbol.
- **`DELETE /api/chart-drawings/{symbol}`**: Clears all drawings for a symbol.
- **`GET /api/chart-alerts`**: Retrieves all saved price level alerts.
- **`POST /api/chart-alerts`**: Saves/syncs the alerts array.

---

## 7. Broker Configuration (`/api/settings/broker-config`)

- **`GET /api/settings/broker-config`**: Returns active provider, masked API tokens, and account IDs.
- **`POST /api/settings/broker-config`**: Updates broker credentials and switches active provider.

---

## 8. Symbol Groups & Baskets (`/api/symbol-groups`)

- **`GET /api/symbol-groups`**: Returns all configured symbol baskets (Forex Majors, Crosses, Crypto, Tech, Indices, Commodities, Custom).
- **`GET /api/symbol-groups/{id}`**: Returns a specific symbol bucket.
- **`POST /api/symbol-groups`**: Creates a new symbol basket.
- **`PUT /api/symbol-groups/{id}`**: Updates an existing basket (name, description, category, symbol list, assigned strategy).
- **`DELETE /api/symbol-groups/{id}`**: Deletes a custom symbol basket.

---

## 9. Market Scanner Robot (`/api/scanner`)

- **`POST /api/scanner/live`**: Executes a real-time closed-candle scan across a defined symbol bucket or custom list of symbols. Returns verified matches (100%) and near-misses (60%–99%).
  ```json
  {
    "symbolGroupId": "group-fx-majors",
    "strategyId": "guid-optional",
    "timeframe": "M5"
  }
  ```
- **`POST /api/scanner/historical`**: Executes a bar-by-bar historical scan and trade resolution simulation across $N$ past candles. Returns win rate %, net P&L pips, profit factor, max drawdown, and full trade timeline.
  ```json
  {
    "strategyId": "e2f1...",
    "symbolGroupId": "group-fx-majors",
    "timeframe": "M5",
    "barCount": 200
  }
  ```

