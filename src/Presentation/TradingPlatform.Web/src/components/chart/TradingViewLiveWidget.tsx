import React, { useEffect, useRef } from 'react';
import { Timeframe } from '../../types/trading';
import { ChartType } from './types';

interface TradingViewLiveWidgetProps {
  symbol: string;
  timeframe: Timeframe;
  chartType?: ChartType;
  timezone?: string;
}

/**
 * Maps internal platform symbols to TradingView's exchange:ticker format
 */
export function mapSymbolToTradingView(symbol: string): string {
  const clean = symbol.trim().toUpperCase().replace('/', '').replace('_', '').replace('=X', '');

  // If user already passed EXCHANGE:TICKER format
  if (clean.includes(':')) return clean;

  // 1. Major Global Indices
  switch (clean) {
    case 'US500':
    case 'SPX':
    case 'SPX500':
    case '^GSPC':
      return 'FOREXCOM:SPXUSD';
    case 'NAS100':
    case 'NDX':
    case 'US100':
    case 'NASDAQ':
    case '^IXIC':
      return 'FOREXCOM:NSXUSD';
    case 'US30':
    case 'DJI':
    case 'DOW':
    case '^DJI':
      return 'FOREXCOM:DJI';
    case 'GER40':
    case 'DAX':
    case 'DE30':
    case 'DE40':
    case '^GDAXI':
      return 'FOREXCOM:GRXEUR';
    case 'UK100':
    case 'FTSE':
    case 'FTSE100':
    case '^FTSE':
      return 'FOREXCOM:UKXGBP';
    case 'JP225':
    case 'NIKKEI':
    case '^N225':
      return 'TVC:NI225';
    case 'US2000':
    case 'RUT':
    case '^RUT':
      return 'TVC:RUT';
    case 'VIX':
    case '^VIX':
      return 'TVC:VIX';
  }

  // 2. Commodities
  switch (clean) {
    case 'XAUUSD':
    case 'GOLD':
    case 'GC=F':
      return 'OANDA:XAUUSD';
    case 'XAGUSD':
    case 'SILVER':
    case 'SI=F':
      return 'OANDA:XAGUSD';
    case 'USOIL':
    case 'WTI':
    case 'CRUDE':
    case 'OIL':
    case 'CL=F':
      return 'TVC:USOIL';
    case 'UKOIL':
    case 'BRENT':
    case 'BZ=F':
      return 'TVC:UKOIL';
    case 'NATGAS':
    case 'NG':
    case 'NG=F':
      return 'TVC:NG1!';
    case 'COPPER':
    case 'HG':
    case 'HG=F':
      return 'OANDA:XCUUSD';
  }

  // 3. Cryptocurrencies
  if (
    clean.endsWith('USDT') ||
    clean.endsWith('BUSD') ||
    ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD', 'ADAUSD', 'DOGEUSD', 'AVAXUSD', 'LINKUSD'].includes(clean)
  ) {
    const binanceTicker = clean.endsWith('USD') ? `${clean}T` : clean;
    return `BINANCE:${binanceTicker}`;
  }

  // 4. US Equities & ETFs
  const equities = new Set([
    'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'GOOG', 'META', 'AMD',
    'NFLX', 'COIN', 'PLTR', 'INTC', 'SPY', 'QQQ', 'IWM', 'DIA', 'BABA',
  ]);
  if (equities.has(clean)) {
    return clean;
  }

  // 5. Default Forex Pairs (e.g., EURUSD, GBPUSD, USDJPY, USDZAR)
  if (clean.length === 6) {
    return `OANDA:${clean}`;
  }

  return clean;
}

/**
 * Maps internal Timeframe to TradingView interval code
 */
function mapTimeframeToTradingViewInterval(tf: Timeframe): string {
  switch (tf) {
    case 'M1':
      return '1';
    case 'M5':
      return '5';
    case 'M15':
      return '15';
    case 'M30':
      return '30';
    case 'H1':
      return '60';
    case 'H4':
      return '240';
    case 'D1':
      return 'D';
    case 'W1':
      return 'W';
    case 'MN1':
      return 'M';
    default:
      return '5';
  }
}

/**
 * Maps ChartType to TradingView style code
 */
function mapChartTypeToTradingViewStyle(chartType?: ChartType): string {
  switch (chartType) {
    case 'bar':
      return '0';
    case 'candlestick':
      return '1';
    case 'line':
      return '2';
    case 'area':
      return '3';
    case 'heikin_ashi':
      return '8';
    case 'baseline':
      return '10';
    default:
      return '1';
  }
}

export const TradingViewLiveWidget: React.FC<TradingViewLiveWidgetProps> = ({
  symbol,
  timeframe,
  chartType = 'candlestick',
  timezone = 'Etc/UTC',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const tvSymbol = mapSymbolToTradingView(symbol);
  const tvInterval = mapTimeframeToTradingViewInterval(timeframe);
  const tvStyle = mapChartTypeToTradingViewStyle(chartType);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous widget instance before mounting updated configuration
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.width = '100%';
    widgetDiv.style.height = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;

    const config = {
      autosize: true,
      symbol: tvSymbol,
      interval: tvInterval,
      timezone: timezone || 'Etc/UTC',
      theme: 'dark',
      style: tvStyle,
      locale: 'en',
      backgroundColor: 'rgba(9, 13, 22, 1)',
      gridColor: 'rgba(30, 41, 59, 0.45)',
      allow_symbol_change: true,
      hide_side_toolbar: false,
      withdateranges: true,
      save_image: true,
      calendar: false,
      studies: ['STD;EMA'],
      support_host: 'https://www.tradingview.com',
    };

    script.innerHTML = JSON.stringify(config);
    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [tvSymbol, tvInterval, tvStyle, timezone]);

  return (
    <div className="w-full h-full flex flex-col bg-[#090d16] relative overflow-hidden">
      <div
        ref={containerRef}
        className="tradingview-widget-container w-full h-full flex-1"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

