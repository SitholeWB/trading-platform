import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Check,
  Globe,
  Coins,
  Flame,
  BarChart3,
  Layers,
  Database,
  SlidersHorizontal,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SymbolCatalogItem, MarketCategory } from '../../types/trading';
import { tradingApi } from '../../api/tradingClient';

// Built-in catalog fallback in case backend API is temporarily unreachable
const FALLBACK_SYMBOLS: SymbolCatalogItem[] = [
  // Indices
  {
    symbol: 'US500',
    name: 'S&P 500 Index',
    aliases: ['SPX', 'S&P 500', 'SP500', '^GSPC'],
    category: 'indices',
    exchange: 'CBOE / NYSE',
    price: '5,782.40',
    change: '+0.52%',
    isPositive: true,
    spreadPips: '0.5',
    tradingHours: 'US Market (09:30 - 16:00 ET)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: '^GSPC (Yahoo Finance)',
      Oanda: 'SPX500_USD',
      ZeroMQ: 'US500',
    },
    description: "Standard & Poor's 500 benchmark index of 500 top US corporations.",
  },
  {
    symbol: 'NAS100',
    name: 'Nasdaq 100 Index',
    aliases: ['NDX', 'NASDAQ', 'US100', '^IXIC', 'QQQ'],
    category: 'indices',
    exchange: 'NASDAQ',
    price: '20,140.50',
    change: '+0.88%',
    isPositive: true,
    spreadPips: '1.0',
    tradingHours: 'US Market (09:30 - 16:00 ET)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: '^IXIC (Yahoo Finance)',
      Oanda: 'NAS100_USD',
      ZeroMQ: 'NAS100',
    },
    description: 'Top 100 non-financial tech, biotechnology, and growth innovators.',
  },
  {
    symbol: 'US30',
    name: 'Dow Jones Industrial Average',
    aliases: ['DJI', 'DOW', 'WALL STREET 30', '^DJI'],
    category: 'indices',
    exchange: 'NYSE',
    price: '42,352.00',
    change: '+0.35%',
    isPositive: true,
    spreadPips: '1.5',
    tradingHours: 'US Market (09:30 - 16:00 ET)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: '^DJI (Yahoo Finance)',
      Oanda: 'US30_USD',
      ZeroMQ: 'US30',
    },
    description: 'Price-weighted benchmark of 30 blue-chip American industry giants.',
  },
  {
    symbol: 'GER40',
    name: 'DAX 40 Index',
    aliases: ['DAX', 'DE40', 'GERMANY 40', '^GDAXI'],
    category: 'indices',
    exchange: 'XETRA',
    price: '19,450.20',
    change: '+0.28%',
    isPositive: true,
    spreadPips: '1.2',
    tradingHours: 'European Market (09:00 - 17:30 CET)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: '^GDAXI (Yahoo Finance)',
      Oanda: 'DE30_EUR',
      ZeroMQ: 'GER40',
    },
    description: 'The 40 major German blue chip companies trading in Frankfurt.',
  },
  {
    symbol: 'UK100',
    name: 'FTSE 100 Index',
    aliases: ['FTSE', 'UK100_GBP', '^FTSE'],
    category: 'indices',
    exchange: 'LSE',
    price: '8,324.50',
    change: '-0.15%',
    isPositive: false,
    spreadPips: '1.0',
    tradingHours: 'London Market (08:00 - 16:30 GMT)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: '^FTSE (Yahoo Finance)',
      Oanda: 'UK100_GBP',
      ZeroMQ: 'UK100',
    },
    description: '100 largest capitalization companies listed on the London Stock Exchange.',
  },
  {
    symbol: 'JP225',
    name: 'Nikkei 225 Index',
    aliases: ['NIKKEI', 'JP225_USD', '^N225'],
    category: 'indices',
    exchange: 'JPX',
    price: '38,650.00',
    change: '+1.12%',
    isPositive: true,
    spreadPips: '3.0',
    tradingHours: 'Tokyo Market (09:00 - 15:00 JST)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: '^N225 (Yahoo Finance)',
      Oanda: 'JP225_USD',
      ZeroMQ: 'JP225',
    },
    description: 'Price-weighted index for the Tokyo Stock Exchange.',
  },
  {
    symbol: 'US2000',
    name: 'Russell 2000 Index',
    aliases: ['RUT', 'RUSSELL', '^RUT'],
    category: 'indices',
    exchange: 'CBOE',
    price: '2,215.40',
    change: '+0.42%',
    isPositive: true,
    spreadPips: '0.8',
    tradingHours: 'US Market (09:30 - 16:00 ET)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: '^RUT (Yahoo Finance)',
      Oanda: 'US2000_USD',
    },
    description: 'Small-cap benchmark tracking 2,000 smaller US public enterprises.',
  },

  // Commodities
  {
    symbol: 'XAUUSD',
    name: 'Gold / US Dollar',
    aliases: ['GOLD', 'XAU_USD', 'GC=F'],
    category: 'commodities',
    exchange: 'COMEX / Spot',
    price: '2,654.80',
    change: '+0.74%',
    isPositive: true,
    spreadPips: '2.0',
    tradingHours: '24/5 (Mon-Fri)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'GC=F (Yahoo Finance)',
      Oanda: 'XAU_USD',
      ZeroMQ: 'GOLD',
    },
    description: 'Physical Gold spot commodity priced in US Dollars per troy ounce.',
  },
  {
    symbol: 'XAGUSD',
    name: 'Silver / US Dollar',
    aliases: ['SILVER', 'XAG_USD', 'SI=F'],
    category: 'commodities',
    exchange: 'COMEX / Spot',
    price: '31.85',
    change: '+1.15%',
    isPositive: true,
    spreadPips: '1.8',
    tradingHours: '24/5 (Mon-Fri)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'SI=F (Yahoo Finance)',
      Oanda: 'XAG_USD',
      ZeroMQ: 'SILVER',
    },
    description: 'Physical Silver spot commodity priced in US Dollars per troy ounce.',
  },
  {
    symbol: 'USOIL',
    name: 'WTI Crude Oil',
    aliases: ['WTI', 'CRUDE', 'OIL', 'CL=F', 'WTICO_USD'],
    category: 'commodities',
    exchange: 'NYMEX',
    price: '71.50',
    change: '-1.40%',
    isPositive: false,
    spreadPips: '2.5',
    tradingHours: '24/5 (Mon-Fri)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'CL=F (Yahoo Finance)',
      Oanda: 'WTICO_USD',
      ZeroMQ: 'USOIL',
    },
    description: 'West Texas Intermediate light sweet crude oil futures.',
  },
  {
    symbol: 'UKOIL',
    name: 'Brent Crude Oil',
    aliases: ['BRENT', 'BCO_USD', 'BZ=F'],
    category: 'commodities',
    exchange: 'ICE',
    price: '75.20',
    change: '-1.10%',
    isPositive: false,
    spreadPips: '2.5',
    tradingHours: '24/5 (Mon-Fri)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'BZ=F (Yahoo Finance)',
      Oanda: 'BCO_USD',
      ZeroMQ: 'UKOIL',
    },
    description: 'North Sea Brent blend crude oil global pricing standard.',
  },
  {
    symbol: 'NATGAS',
    name: 'Natural Gas',
    aliases: ['NG', 'NATGAS_USD', 'NG=F'],
    category: 'commodities',
    exchange: 'NYMEX',
    price: '2.85',
    change: '+2.10%',
    isPositive: true,
    spreadPips: '3.0',
    tradingHours: '24/5 (Mon-Fri)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'NG=F (Yahoo Finance)',
      Oanda: 'NATGAS_USD',
    },
    description: 'Henry Hub Louisiana natural gas futures.',
  },

  // Forex
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    aliases: ['EUR_USD', 'EUR/USD'],
    category: 'forex',
    exchange: 'FX Interbank',
    price: '1.08520',
    change: '+0.18%',
    isPositive: true,
    spreadPips: '0.6',
    tradingHours: '24/5 (Sun 17:00 - Fri 17:00 ET)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'EURUSD=X (Yahoo)',
      Oanda: 'EUR_USD',
      ZeroMQ: 'EURUSD',
    },
    description: "World's most actively traded currency pair with highest market liquidity.",
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    aliases: ['GBP_USD', 'GBP/USD', 'CABLE'],
    category: 'forex',
    exchange: 'FX Interbank',
    price: '1.26420',
    change: '-0.12%',
    isPositive: false,
    spreadPips: '0.8',
    tradingHours: '24/5 (Sun 17:00 - Fri 17:00 ET)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'GBPUSD=X (Yahoo)',
      Oanda: 'GBP_USD',
      ZeroMQ: 'GBPUSD',
    },
    description: 'The Cable: historical liquidity benchmark between London and New York.',
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    aliases: ['USD_JPY', 'USD/JPY'],
    category: 'forex',
    exchange: 'FX Interbank',
    price: '154.210',
    change: '+0.45%',
    isPositive: true,
    spreadPips: '0.7',
    tradingHours: '24/5 (Sun 17:00 - Fri 17:00 ET)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'USDJPY=X (Yahoo)',
      Oanda: 'USD_JPY',
      ZeroMQ: 'USDJPY',
    },
    description: 'Primary Asian session liquidity hub and safe haven currency pair.',
  },
  {
    symbol: 'AUDUSD',
    name: 'Australian Dollar / US Dollar',
    aliases: ['AUD_USD', 'AUD/USD', 'AUSSIE'],
    category: 'forex',
    exchange: 'FX Interbank',
    price: '0.65340',
    change: '+0.04%',
    isPositive: true,
    spreadPips: '0.9',
    tradingHours: '24/5 (Sun 17:00 - Fri 17:00 ET)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'AUDUSD=X (Yahoo)',
      Oanda: 'AUD_USD',
      ZeroMQ: 'AUDUSD',
    },
    description: 'Key commodity currency influenced heavily by mining and Asia-Pacific trade.',
  },
  {
    symbol: 'USDCAD',
    name: 'US Dollar / Canadian Dollar',
    aliases: ['USD_CAD', 'USD/CAD', 'LOONIE'],
    category: 'forex',
    exchange: 'FX Interbank',
    price: '1.38120',
    change: '-0.22%',
    isPositive: false,
    spreadPips: '1.1',
    tradingHours: '24/5 (Sun 17:00 - Fri 17:00 ET)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'USDCAD=X (Yahoo)',
      Oanda: 'USD_CAD',
      ZeroMQ: 'USDCAD',
    },
    description: 'Cross-border North American trade proxy strongly correlated with crude oil.',
  },
  {
    symbol: 'USDCHF',
    name: 'US Dollar / Swiss Franc',
    aliases: ['USD_CHF', 'USD/CHF', 'SWISSIE'],
    category: 'forex',
    exchange: 'FX Interbank',
    price: '0.90230',
    change: '+0.10%',
    isPositive: true,
    spreadPips: '1.0',
    tradingHours: '24/5 (Sun 17:00 - Fri 17:00 ET)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'USDCHF=X (Yahoo)',
      Oanda: 'USD_CHF',
      ZeroMQ: 'USDCHF',
    },
    description: 'Classic safe haven and European banking reserve currency pair.',
  },
  {
    symbol: 'NZDUSD',
    name: 'New Zealand Dollar / US Dollar',
    aliases: ['NZD_USD', 'NZD/USD', 'KIWI'],
    category: 'forex',
    exchange: 'FX Interbank',
    price: '0.59840',
    change: '-0.08%',
    isPositive: false,
    spreadPips: '1.2',
    tradingHours: '24/5 (Sun 17:00 - Fri 17:00 ET)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'NZDUSD=X (Yahoo)',
      Oanda: 'NZD_USD',
      ZeroMQ: 'NZDUSD',
    },
    description: 'The Kiwi: dairy export driven Pacific currency pair.',
  },
  {
    symbol: 'EURGBP',
    name: 'Euro / British Pound',
    aliases: ['EUR_GBP', 'EUR/GBP'],
    category: 'forex',
    exchange: 'FX Interbank',
    price: '0.85840',
    change: '+0.25%',
    isPositive: true,
    spreadPips: '0.9',
    tradingHours: '24/5 (Sun 17:00 - Fri 17:00 ET)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'EURGBP=X (Yahoo)',
      Oanda: 'EUR_GBP',
      ZeroMQ: 'EURGBP',
    },
    description: 'Major European cross pair capturing policy divergence between ECB and BOE.',
  },
  {
    symbol: 'EURJPY',
    name: 'Euro / Japanese Yen',
    aliases: ['EUR_JPY', 'EUR/JPY'],
    category: 'forex',
    exchange: 'FX Interbank',
    price: '167.350',
    change: '+0.62%',
    isPositive: true,
    spreadPips: '1.2',
    tradingHours: '24/5 (Sun 17:00 - Fri 17:00 ET)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'EURJPY=X (Yahoo)',
      Oanda: 'EUR_JPY',
      ZeroMQ: 'EURJPY',
    },
    description: 'High-beta carry trade pair with rapid volatility swings.',
  },
  {
    symbol: 'GBPJPY',
    name: 'British Pound / Japanese Yen',
    aliases: ['GBP_JPY', 'GBP/JPY', 'THE BEAST', 'GEPPY'],
    category: 'forex',
    exchange: 'FX Interbank',
    price: '194.920',
    change: '+0.33%',
    isPositive: true,
    spreadPips: '1.4',
    tradingHours: '24/5 (Sun 17:00 - Fri 17:00 ET)',
    supportedProviders: ['KeylessPublic', 'Oanda', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'GBPJPY=X (Yahoo)',
      Oanda: 'GBP_JPY',
      ZeroMQ: 'GBPJPY',
    },
    description: 'Known as The Dragon / The Beast for massive intraday momentum swings.',
  },

  // Crypto
  {
    symbol: 'BTCUSDT',
    name: 'Bitcoin / Tether USD',
    aliases: ['BTC', 'BITCOIN', 'BTC-USD', 'BTCUSD'],
    category: 'crypto',
    exchange: 'Binance / 24/7',
    price: '68,450.00',
    change: '+1.85%',
    isPositive: true,
    spreadPips: '0.1',
    tradingHours: '24/7 Continuous',
    supportedProviders: ['KeylessPublic', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'BTCUSDT (Binance 24/7)',
      ZeroMQ: 'BTCUSD',
    },
    description: 'The premier decentralized digital asset and store-of-value crypto.',
  },
  {
    symbol: 'ETHUSDT',
    name: 'Ethereum / Tether USD',
    aliases: ['ETH', 'ETHEREUM', 'ETH-USD', 'ETHUSD'],
    category: 'crypto',
    exchange: 'Binance / 24/7',
    price: '3,520.50',
    change: '+0.95%',
    isPositive: true,
    spreadPips: '0.2',
    tradingHours: '24/7 Continuous',
    supportedProviders: ['KeylessPublic', 'ZeroMQ', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'ETHUSDT (Binance 24/7)',
      ZeroMQ: 'ETHUSD',
    },
    description: 'Leading smart-contract blockchain powering decentralized finance.',
  },
  {
    symbol: 'SOLUSDT',
    name: 'Solana / Tether USD',
    aliases: ['SOL', 'SOLANA', 'SOL-USD'],
    category: 'crypto',
    exchange: 'Binance / 24/7',
    price: '178.40',
    change: '+4.20%',
    isPositive: true,
    spreadPips: '0.2',
    tradingHours: '24/7 Continuous',
    supportedProviders: ['KeylessPublic', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'SOLUSDT (Binance 24/7)',
    },
    description: 'High-throughput Layer 1 blockchain optimized for sub-second settlement.',
  },
  {
    symbol: 'BNBUSDT',
    name: 'BNB / Tether USD',
    aliases: ['BNB', 'BINANCE COIN'],
    category: 'crypto',
    exchange: 'Binance / 24/7',
    price: '585.10',
    change: '-0.30%',
    isPositive: false,
    spreadPips: '0.3',
    tradingHours: '24/7 Continuous',
    supportedProviders: ['KeylessPublic', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'BNBUSDT (Binance 24/7)',
    },
    description: 'Native gas token of the BNB Chain ecosystem.',
  },
  {
    symbol: 'XRPUSDT',
    name: 'XRP / Tether USD',
    aliases: ['XRP', 'RIPPLE'],
    category: 'crypto',
    exchange: 'Binance / 24/7',
    price: '0.5840',
    change: '+0.80%',
    isPositive: true,
    spreadPips: '0.01',
    tradingHours: '24/7 Continuous',
    supportedProviders: ['KeylessPublic', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'XRPUSDT (Binance 24/7)',
    },
    description: 'Enterprise digital asset designed for global cross-border remittances.',
  },
  {
    symbol: 'ADAUSDT',
    name: 'Cardano / Tether USD',
    aliases: ['ADA', 'CARDANO'],
    category: 'crypto',
    exchange: 'Binance / 24/7',
    price: '0.3540',
    change: '+1.10%',
    isPositive: true,
    spreadPips: '0.01',
    tradingHours: '24/7 Continuous',
    supportedProviders: ['KeylessPublic', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'ADAUSDT (Binance 24/7)',
    },
    description: 'Proof-of-stake blockchain network based on peer-reviewed research.',
  },
  {
    symbol: 'DOGEUSDT',
    name: 'Dogecoin / Tether USD',
    aliases: ['DOGE', 'DOGECOIN'],
    category: 'crypto',
    exchange: 'Binance / 24/7',
    price: '0.1140',
    change: '+2.45%',
    isPositive: true,
    spreadPips: '0.01',
    tradingHours: '24/7 Continuous',
    supportedProviders: ['KeylessPublic', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'DOGEUSDT (Binance 24/7)',
    },
    description: 'Decentralized peer-to-peer digital currency popularized globally.',
  },
  {
    symbol: 'AVAXUSDT',
    name: 'Avalanche / Tether USD',
    aliases: ['AVAX', 'AVALANCHE'],
    category: 'crypto',
    exchange: 'Binance / 24/7',
    price: '28.60',
    change: '+1.75%',
    isPositive: true,
    spreadPips: '0.05',
    tradingHours: '24/7 Continuous',
    supportedProviders: ['KeylessPublic', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'AVAXUSDT (Binance 24/7)',
    },
    description: 'High-speed smart contract platform built for scalable enterprise dApps.',
  },
  {
    symbol: 'LINKUSDT',
    name: 'Chainlink / Tether USD',
    aliases: ['LINK', 'CHAINLINK'],
    category: 'crypto',
    exchange: 'Binance / 24/7',
    price: '11.80',
    change: '+0.60%',
    isPositive: true,
    spreadPips: '0.02',
    tradingHours: '24/7 Continuous',
    supportedProviders: ['KeylessPublic', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'LINKUSDT (Binance 24/7)',
    },
    description: 'Decentralized oracle network connecting smart contracts to real-world data.',
  },

  // Stocks
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    aliases: ['APPLE', 'NASDAQ:AAPL'],
    category: 'stocks',
    exchange: 'NASDAQ',
    price: '232.50',
    change: '+0.65%',
    isPositive: true,
    spreadPips: '0.05',
    tradingHours: 'US Market (09:30 - 16:00 ET)',
    supportedProviders: ['KeylessPublic', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'AAPL (Yahoo Finance)',
    },
    description: 'Consumer electronics, personal computing, and digital services giant.',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    aliases: ['MICROSOFT', 'NASDAQ:MSFT'],
    category: 'stocks',
    exchange: 'NASDAQ',
    price: '428.15',
    change: '+0.42%',
    isPositive: true,
    spreadPips: '0.08',
    tradingHours: 'US Market (09:30 - 16:00 ET)',
    supportedProviders: ['KeylessPublic', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'MSFT (Yahoo Finance)',
    },
    description: 'Global enterprise software, Azure cloud computing, and AI pioneer.',
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    aliases: ['NVIDIA', 'NASDAQ:NVDA'],
    category: 'stocks',
    exchange: 'NASDAQ',
    price: '126.40',
    change: '+2.15%',
    isPositive: true,
    spreadPips: '0.04',
    tradingHours: 'US Market (09:30 - 16:00 ET)',
    supportedProviders: ['KeylessPublic', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'NVDA (Yahoo Finance)',
    },
    description: 'Leading accelerator and GPU hardware architecture powering generative AI.',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    aliases: ['TESLA', 'NASDAQ:TSLA'],
    category: 'stocks',
    exchange: 'NASDAQ',
    price: '254.20',
    change: '-1.20%',
    isPositive: false,
    spreadPips: '0.10',
    tradingHours: 'US Market (09:30 - 16:00 ET)',
    supportedProviders: ['KeylessPublic', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'TSLA (Yahoo Finance)',
    },
    description: 'Electric vehicles, stationary battery energy storage, and robotics.',
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    aliases: ['AMAZON', 'NASDAQ:AMZN'],
    category: 'stocks',
    exchange: 'NASDAQ',
    price: '185.60',
    change: '+0.85%',
    isPositive: true,
    spreadPips: '0.06',
    tradingHours: 'US Market (09:30 - 16:00 ET)',
    supportedProviders: ['KeylessPublic', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'AMZN (Yahoo Finance)',
    },
    description: 'Global e-commerce marketplace and AWS cloud computing infrastructure.',
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc. (Google)',
    aliases: ['GOOGLE', 'ALPHABET', 'NASDAQ:GOOGL'],
    category: 'stocks',
    exchange: 'NASDAQ',
    price: '165.80',
    change: '+0.32%',
    isPositive: true,
    spreadPips: '0.05',
    tradingHours: 'US Market (09:30 - 16:00 ET)',
    supportedProviders: ['KeylessPublic', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'GOOGL (Yahoo Finance)',
    },
    description: 'Online search, Android ecosystem, YouTube, and Gemini AI technologies.',
  },
  {
    symbol: 'META',
    name: 'Meta Platforms, Inc.',
    aliases: ['FACEBOOK', 'NASDAQ:META'],
    category: 'stocks',
    exchange: 'NASDAQ',
    price: '585.30',
    change: '+1.45%',
    isPositive: true,
    spreadPips: '0.12',
    tradingHours: 'US Market (09:30 - 16:00 ET)',
    supportedProviders: ['KeylessPublic', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'META (Yahoo Finance)',
    },
    description: 'Social networking platforms including Instagram, WhatsApp, and Llama AI.',
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    aliases: ['NASDAQ:AMD'],
    category: 'stocks',
    exchange: 'NASDAQ',
    price: '158.40',
    change: '+1.80%',
    isPositive: true,
    spreadPips: '0.08',
    tradingHours: 'US Market (09:30 - 16:00 ET)',
    supportedProviders: ['KeylessPublic', 'Synthetic'],
    providerSymbols: {
      KeylessPublic: 'AMD (Yahoo Finance)',
    },
    description: 'Semiconductor microprocessors, Radeon GPUs, and EPYC server CPUs.',
  },
];

const PROVIDER_NAMES: Record<string, string> = {
  KeylessPublic: 'Keyless Public (Yahoo + Binance)',
  Oanda: 'OANDA v20 Broker',
  ZeroMQ: 'MetaTrader 5 NetMQ',
  Synthetic: 'Offline Simulation Sandbox',
};

interface SymbolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  activeProvider?: string;
}

export const SymbolSearchModal: React.FC<SymbolSearchModalProps> = ({
  isOpen,
  onClose,
  selectedSymbol,
  onSelectSymbol,
  activeProvider = 'KeylessPublic',
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<MarketCategory>('all');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>('all');
  const [onlyActiveProvider, setOnlyActiveProvider] = useState<boolean>(true);
  const [symbols, setSymbols] = useState<SymbolCatalogItem[]>(FALLBACK_SYMBOLS);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch catalog from backend API when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    tradingApi
      .getSymbols()
      .then((res) => {
        if (isMounted && res && res.symbols && res.symbols.length > 0) {
          setSymbols(res.symbols);
        }
      })
      .catch((err) => {
        console.warn('Using fallback symbol catalog:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filtered symbols based on category, provider, search query
  const filteredSymbols = useMemo(() => {
    const q = search.trim().toLowerCase();

    return symbols.filter((item) => {
      // 1. Category Filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }

      // 2. Provider Filter
      if (onlyActiveProvider) {
        if (!item.supportedProviders.includes(activeProvider)) {
          return false;
        }
      } else if (selectedProviderFilter !== 'all') {
        if (!item.supportedProviders.includes(selectedProviderFilter)) {
          return false;
        }
      }

      // 3. Search Query (Matches symbol, name, aliases, exchange, category)
      if (q) {
        const matchesSymbol = item.symbol.toLowerCase().includes(q);
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesAliases = item.aliases?.some((a) => a.toLowerCase().includes(q));
        const matchesExchange = item.exchange.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);

        if (!matchesSymbol && !matchesName && !matchesAliases && !matchesExchange && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [symbols, search, activeCategory, onlyActiveProvider, selectedProviderFilter, activeProvider]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredSymbols.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredSymbols.length > 0 && selectedIndex < filteredSymbols.length) {
          const chosen = filteredSymbols[selectedIndex];
          onSelectSymbol(chosen.symbol);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredSymbols, selectedIndex, onClose, onSelectSymbol]);

  // Keep selected index visible
  useEffect(() => {
    if (listRef.current) {
      const activeElem = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeElem) {
        activeElem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const categories: { id: MarketCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all', label: 'All Markets', icon: Layers },
    { id: 'indices', label: 'Indices (S&P, NDX)', icon: TrendingUp },
    { id: 'forex', label: 'Forex Pairs', icon: Globe },
    { id: 'crypto', label: 'Crypto (24/7)', icon: Coins },
    { id: 'commodities', label: 'Commodities (Gold, Oil)', icon: Flame },
    { id: 'stocks', label: 'Stocks & Equities', icon: BarChart3 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Top Header: Search Bar + Close */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search symbol, pair or market (e.g. S&P 500, EURUSD, Gold, BTC, Apple)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedIndex(0);
              }}
              className="text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="h-5 w-px bg-slate-800 hidden sm:block" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Press Esc to close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Source Bar: Feed Info & Filtering */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans">
              <Database className="w-3.5 h-3.5 text-violet-400" />
              Active Feed:
            </span>
            <span className="px-2 py-0.5 rounded bg-violet-950/70 border border-violet-500/40 text-violet-300 font-bold">
              {PROVIDER_NAMES[activeProvider] || activeProvider}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer font-sans select-none">
              <input
                type="checkbox"
                checked={onlyActiveProvider}
                onChange={(e) => {
                  setOnlyActiveProvider(e.target.checked);
                  setSelectedIndex(0);
                }}
                className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 w-3.5 h-3.5"
              />
              <span>Supported by active feed only</span>
            </label>

            {!onlyActiveProvider && (
              <div className="flex items-center gap-1 text-[11px]">
                <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                <select
                  value={selectedProviderFilter}
                  onChange={(e) => {
                    setSelectedProviderFilter(e.target.value);
                    setSelectedIndex(0);
                  }}
                  className="bg-slate-800 border border-slate-700 text-slate-300 rounded px-1.5 py-0.5 font-sans"
                >
                  <option value="all">All Providers</option>
                  <option value="KeylessPublic">Keyless Public</option>
                  <option value="Oanda">OANDA v20</option>
                  <option value="ZeroMQ">MetaTrader 5</option>
                  <option value="Synthetic">Offline Sandbox</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 flex gap-1.5 overflow-x-auto text-xs font-sans scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Symbol Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-slate-800/60 font-sans">
          {filteredSymbols.length === 0 ? (
            <div className="py-20 text-center text-slate-500 space-y-2">
              <p className="text-base text-slate-400 font-medium">No instruments found matching "{search}"</p>
              <p className="text-xs">
                Try searching by ticker (e.g. <span className="text-blue-400 font-mono">SPX</span>,{' '}
                <span className="text-blue-400 font-mono">EURUSD</span>,{' '}
                <span className="text-blue-400 font-mono">BTC</span>,{' '}
                <span className="text-blue-400 font-mono">GOLD</span>,{' '}
                <span className="text-blue-400 font-mono">AAPL</span>) or disable "active feed only".
              </p>
            </div>
          ) : (
            filteredSymbols.map((item, index) => {
              const isSelected = selectedSymbol === item.symbol;
              const isHighlighted = selectedIndex === index;
              const isSupportedByActive = item.supportedProviders.includes(activeProvider);
              const providerMapping = item.providerSymbols?.[activeProvider] || item.providerSymbols?.['KeylessPublic'];

              return (
                <div
                  key={item.symbol}
                  onClick={() => {
                    onSelectSymbol(item.symbol);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-all ${
                    isHighlighted
                      ? 'bg-blue-600/20 border-l-4 border-blue-500 pl-3'
                      : isSelected
                      ? 'bg-blue-600/10'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  {/* Left: Category Icon, Symbol, Name, Aliases, Description */}
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold text-xs uppercase flex-shrink-0 ${
                        item.category === 'indices'
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                          : item.category === 'forex'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : item.category === 'crypto'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : item.category === 'commodities'
                          ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      <span className="text-[11px] font-mono leading-none">{item.symbol.slice(0, 3)}</span>
                      <span className="text-[9px] opacity-70 font-mono leading-none mt-0.5">
                        {item.category.slice(0, 3)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm sm:text-base text-slate-100 font-mono tracking-wide">
                          {item.symbol}
                        </span>

                        {/* Aliases Pill */}
                        {item.aliases && item.aliases.length > 0 && (
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                            {item.aliases.slice(0, 2).join(' · ')}
                          </span>
                        )}

                        {/* Provider Feed Tag */}
                        {isSupportedByActive ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-mono flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            {providerMapping || activeProvider}
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 font-mono">
                            Requires {item.supportedProviders.join(' / ')}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-500 font-mono hidden md:inline flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {item.tradingHours}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 truncate mt-0.5 flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-slate-600 hidden sm:inline">•</span>
                        <span className="text-slate-500 text-[11px] hidden sm:inline">{item.description}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price & Trend, Selection Checkmark */}
                  <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
                    <div className="text-right font-mono">
                      <div className="text-xs sm:text-sm font-bold text-slate-100">{item.price}</div>
                      <div
                        className={`text-[11px] font-semibold flex items-center justify-end gap-1 ${
                          item.isPositive ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {item.isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{item.change}</span>
                      </div>
                    </div>

                    <div className="w-6 flex items-center justify-center">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : isHighlighted ? (
                        <span className="text-[10px] text-blue-400 font-mono hidden sm:inline">Enter ↵</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 font-mono">
          <div className="flex items-center gap-3">
            <span>
              <strong className="text-slate-300 font-bold">{filteredSymbols.length}</strong> instruments available
            </span>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">
              Active feed: <strong className="text-slate-200">{PROVIDER_NAMES[activeProvider] || activeProvider}</strong>
            </span>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>↑↓ navigate</span>
            <span>•</span>
            <span>Enter select</span>
            <span>•</span>
            <span>Esc close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
