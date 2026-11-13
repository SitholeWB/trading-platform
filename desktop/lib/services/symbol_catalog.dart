import '../models/trading_models.dart';

class SymbolCatalog {
  static const List<SymbolSpec> allSymbols = [
    // Indices
    SymbolSpec(symbol: 'US500', name: 'S&P 500', category: AssetCategory.indices, yahooTicker: '^GSPC', tradingViewTicker: 'SP:SPX', defaultBaseline: 5780.00),
    SymbolSpec(symbol: 'NAS100', name: 'Nasdaq 100', category: AssetCategory.indices, yahooTicker: '^IXIC', tradingViewTicker: 'NASDAQ:NDX', defaultBaseline: 20150.00),
    SymbolSpec(symbol: 'US30', name: 'Dow Jones 30', category: AssetCategory.indices, yahooTicker: '^DJI', tradingViewTicker: 'DJ:DJI', defaultBaseline: 42350.00),
    SymbolSpec(symbol: 'GER40', name: 'DAX 40', category: AssetCategory.indices, yahooTicker: '^GDAXI', tradingViewTicker: 'XETR:DAX', defaultBaseline: 19450.00),
    SymbolSpec(symbol: 'UK100', name: 'FTSE 100', category: AssetCategory.indices, yahooTicker: '^FTSE', tradingViewTicker: 'FTSE:UKX', defaultBaseline: 8320.00),
    SymbolSpec(symbol: 'JP225', name: 'Nikkei 225', category: AssetCategory.indices, yahooTicker: '^N225', tradingViewTicker: 'TVC:NI225', defaultBaseline: 38650.00),

    // Commodities
    SymbolSpec(symbol: 'XAUUSD', name: 'Gold Spot', category: AssetCategory.commodities, yahooTicker: 'GC=F', tradingViewTicker: 'OANDA:XAUUSD', defaultBaseline: 2655.00),
    SymbolSpec(symbol: 'XAGUSD', name: 'Silver Spot', category: AssetCategory.commodities, yahooTicker: 'SI=F', tradingViewTicker: 'OANDA:XAGUSD', defaultBaseline: 31.85),
    SymbolSpec(symbol: 'USOIL', name: 'WTI Crude Oil', category: AssetCategory.commodities, yahooTicker: 'CL=F', tradingViewTicker: 'TVC:USOIL', defaultBaseline: 71.50),
    SymbolSpec(symbol: 'UKOIL', name: 'Brent Crude Oil', category: AssetCategory.commodities, yahooTicker: 'BZ=F', tradingViewTicker: 'TVC:UKOIL', defaultBaseline: 75.20),
    SymbolSpec(symbol: 'NATGAS', name: 'Natural Gas', category: AssetCategory.commodities, yahooTicker: 'NG=F', tradingViewTicker: 'NYMEX:NG1!', defaultBaseline: 2.85),
    SymbolSpec(symbol: 'COPPER', name: 'Copper Futures', category: AssetCategory.commodities, yahooTicker: 'HG=F', tradingViewTicker: 'COMEX:HG1!', defaultBaseline: 4.45),

    // Forex
    SymbolSpec(symbol: 'EURUSD', name: 'EUR / USD', category: AssetCategory.forex, yahooTicker: 'EURUSD=X', tradingViewTicker: 'FX:EURUSD', defaultBaseline: 1.08520),
    SymbolSpec(symbol: 'GBPUSD', name: 'GBP / USD', category: AssetCategory.forex, yahooTicker: 'GBPUSD=X', tradingViewTicker: 'FX:GBPUSD', defaultBaseline: 1.26420),
    SymbolSpec(symbol: 'USDJPY', name: 'USD / JPY', category: AssetCategory.forex, yahooTicker: 'USDJPY=X', tradingViewTicker: 'FX:USDJPY', defaultBaseline: 154.210),
    SymbolSpec(symbol: 'AUDUSD', name: 'AUD / USD', category: AssetCategory.forex, yahooTicker: 'AUDUSD=X', tradingViewTicker: 'FX:AUDUSD', defaultBaseline: 0.65340),
    SymbolSpec(symbol: 'USDCAD', name: 'USD / CAD', category: AssetCategory.forex, yahooTicker: 'USDCAD=X', tradingViewTicker: 'FX:USDCAD', defaultBaseline: 1.38120),
    SymbolSpec(symbol: 'USDCHF', name: 'USD / CHF', category: AssetCategory.forex, yahooTicker: 'USDCHF=X', tradingViewTicker: 'FX:USDCHF', defaultBaseline: 0.87650),
    SymbolSpec(symbol: 'NZDUSD', name: 'NZD / USD', category: AssetCategory.forex, yahooTicker: 'NZDUSD=X', tradingViewTicker: 'FX:NZDUSD', defaultBaseline: 0.59820),
    SymbolSpec(symbol: 'EURJPY', name: 'EUR / JPY', category: AssetCategory.forex, yahooTicker: 'EURJPY=X', tradingViewTicker: 'FX:EURJPY', defaultBaseline: 167.340),
    SymbolSpec(symbol: 'GBPJPY', name: 'GBP / JPY', category: AssetCategory.forex, yahooTicker: 'GBPJPY=X', tradingViewTicker: 'FX:GBPJPY', defaultBaseline: 194.950),
    SymbolSpec(symbol: 'EURGBP', name: 'EUR / GBP', category: AssetCategory.forex, yahooTicker: 'EURGBP=X', tradingViewTicker: 'FX:EURGBP', defaultBaseline: 0.85840),
    SymbolSpec(symbol: 'USDZAR', name: 'USD / ZAR', category: AssetCategory.forex, yahooTicker: 'USDZAR=X', tradingViewTicker: 'FX:USDZAR', defaultBaseline: 17.6540),

    // Crypto
    SymbolSpec(symbol: 'BTCUSDT', name: 'Bitcoin', category: AssetCategory.crypto, yahooTicker: 'BTC-USD', tradingViewTicker: 'BINANCE:BTCUSDT', defaultBaseline: 68450.00),
    SymbolSpec(symbol: 'ETHUSDT', name: 'Ethereum', category: AssetCategory.crypto, yahooTicker: 'ETH-USD', tradingViewTicker: 'BINANCE:ETHUSDT', defaultBaseline: 3520.50),
    SymbolSpec(symbol: 'SOLUSDT', name: 'Solana', category: AssetCategory.crypto, yahooTicker: 'SOL-USD', tradingViewTicker: 'BINANCE:SOLUSDT', defaultBaseline: 178.40),
    SymbolSpec(symbol: 'BNBUSDT', name: 'BNB', category: AssetCategory.crypto, yahooTicker: 'BNB-USD', tradingViewTicker: 'BINANCE:BNBUSDT', defaultBaseline: 598.20),
    SymbolSpec(symbol: 'XRPUSDT', name: 'XRP', category: AssetCategory.crypto, yahooTicker: 'XRP-USD', tradingViewTicker: 'BINANCE:XRPUSDT', defaultBaseline: 0.54210),
    SymbolSpec(symbol: 'ADAUSDT', name: 'Cardano', category: AssetCategory.crypto, yahooTicker: 'ADA-USD', tradingViewTicker: 'BINANCE:ADAUSDT', defaultBaseline: 0.36450),
    SymbolSpec(symbol: 'DOGEUSDT', name: 'Dogecoin', category: AssetCategory.crypto, yahooTicker: 'DOGE-USD', tradingViewTicker: 'BINANCE:DOGEUSDT', defaultBaseline: 0.16840),
    SymbolSpec(symbol: 'AVAXUSDT', name: 'Avalanche', category: AssetCategory.crypto, yahooTicker: 'AVAX-USD', tradingViewTicker: 'BINANCE:AVAXUSDT', defaultBaseline: 27.85),
    SymbolSpec(symbol: 'LINKUSDT', name: 'Chainlink', category: AssetCategory.crypto, yahooTicker: 'LINK-USD', tradingViewTicker: 'BINANCE:LINKUSDT', defaultBaseline: 11.94),
    SymbolSpec(symbol: 'PEPEUSDT', name: 'Pepe Token', category: AssetCategory.crypto, yahooTicker: 'PEPE24478-USD', tradingViewTicker: 'BINANCE:PEPEUSDT', defaultBaseline: 0.00001085),
    SymbolSpec(symbol: 'SHIBUSDT', name: 'Shiba Inu', category: AssetCategory.crypto, yahooTicker: 'SHIB-USD', tradingViewTicker: 'BINANCE:SHIBUSDT', defaultBaseline: 0.00001842),

    // Stocks
    SymbolSpec(symbol: 'AAPL', name: 'Apple Inc.', category: AssetCategory.stocks, yahooTicker: 'AAPL', tradingViewTicker: 'NASDAQ:AAPL', defaultBaseline: 232.50),
    SymbolSpec(symbol: 'MSFT', name: 'Microsoft', category: AssetCategory.stocks, yahooTicker: 'MSFT', tradingViewTicker: 'NASDAQ:MSFT', defaultBaseline: 428.10),
    SymbolSpec(symbol: 'NVDA', name: 'NVIDIA Corp.', category: AssetCategory.stocks, yahooTicker: 'NVDA', tradingViewTicker: 'NASDAQ:NVDA', defaultBaseline: 126.40),
    SymbolSpec(symbol: 'TSLA', name: 'Tesla Inc.', category: AssetCategory.stocks, yahooTicker: 'TSLA', tradingViewTicker: 'NASDAQ:TSLA', defaultBaseline: 254.20),
    SymbolSpec(symbol: 'AMZN', name: 'Amazon.com', category: AssetCategory.stocks, yahooTicker: 'AMZN', tradingViewTicker: 'NASDAQ:AMZN', defaultBaseline: 192.30),
    SymbolSpec(symbol: 'GOOGL', name: 'Alphabet Inc.', category: AssetCategory.stocks, yahooTicker: 'GOOGL', tradingViewTicker: 'NASDAQ:GOOGL', defaultBaseline: 176.80),
    SymbolSpec(symbol: 'META', name: 'Meta Platforms', category: AssetCategory.stocks, yahooTicker: 'META', tradingViewTicker: 'NASDAQ:META', defaultBaseline: 582.40),
    SymbolSpec(symbol: 'AMD', name: 'AMD Inc.', category: AssetCategory.stocks, yahooTicker: 'AMD', tradingViewTicker: 'NASDAQ:AMD', defaultBaseline: 148.90),
    SymbolSpec(symbol: 'NFLX', name: 'Netflix Inc.', category: AssetCategory.stocks, yahooTicker: 'NFLX', tradingViewTicker: 'NASDAQ:NFLX', defaultBaseline: 758.20),
    SymbolSpec(symbol: 'JPM', name: 'JPMorgan Chase', category: AssetCategory.stocks, yahooTicker: 'JPM', tradingViewTicker: 'NYSE:JPM', defaultBaseline: 224.60),
    SymbolSpec(symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: AssetCategory.stocks, yahooTicker: 'SPY', tradingViewTicker: 'AMEX:SPY', defaultBaseline: 578.40),
    SymbolSpec(symbol: 'QQQ', name: 'Invesco QQQ ETF', category: AssetCategory.stocks, yahooTicker: 'QQQ', tradingViewTicker: 'NASDAQ:QQQ', defaultBaseline: 496.20),
  ];

  static SymbolSpec find(String symbol) {
    final upper = symbol.trim().toUpperCase();
    return allSymbols.firstWhere(
      (s) => s.symbol.toUpperCase() == upper,
      orElse: () => SymbolSpec(
        symbol: upper,
        name: upper,
        category: upper.endsWith('USDT')
            ? AssetCategory.crypto
            : upper.length == 6
                ? AssetCategory.forex
                : AssetCategory.stocks,
        yahooTicker: upper,
        tradingViewTicker: upper,
        defaultBaseline: 100.0,
      ),
    );
  }
}
