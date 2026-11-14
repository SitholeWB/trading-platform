import '../models/trading_models.dart';
import 'symbol_catalog.dart';

class MarketSessionStatus {
  final bool isOpen;
  final bool isWeekendClosed;
  final String statusLabel;
  final Duration? timeUntilChange;

  const MarketSessionStatus({
    required this.isOpen,
    required this.isWeekendClosed,
    required this.statusLabel,
    this.timeUntilChange,
  });

  String get countdownText {
    final d = timeUntilChange;
    if (d == null) return '24/7';
    final days = d.inDays;
    final hours = d.inHours.remainder(24);
    final mins = d.inMinutes.remainder(60);
    if (days > 0) return '${days}d ${hours}h';
    if (hours > 0) return '${hours}h ${mins}m';
    return '${mins.clamp(1, 59)}m';
  }

  String get compactBadgeText =>
      isOpen ? 'Open · ${countdownText}' : '$statusLabel · Opens in $countdownText';
}

class MarketHoursService {
  /// Returns the current trading session status for [symbol].
  /// Uses conservative UTC session bounds (with DST buffer) so background
  /// polling pauses cleanly on weekends and off-hours without missing opens.
  static MarketSessionStatus getStatus(String symbol, {DateTime? nowUtc}) {
    final now = (nowUtc ?? DateTime.now()).toUtc();
    final spec = SymbolCatalog.find(symbol);
    final upper = spec.symbol.toUpperCase();

    if (spec.category == AssetCategory.crypto) {
      return const MarketSessionStatus(
        isOpen: true,
        isWeekendClosed: false,
        statusLabel: '24/7 Open',
      );
    }

    // Forex & Spot Metals: Sun 21:00 UTC -> Fri 22:00 UTC
    if (spec.category == AssetCategory.forex ||
        upper == 'XAUUSD' ||
        upper == 'XAGUSD') {
      return _weeklyContinuousSchedule(
        now,
        openWeekday: DateTime.sunday,
        openMinuteOfDay: 21 * 60,
        closeWeekday: DateTime.friday,
        closeMinuteOfDay: 22 * 60,
      );
    }

    // Nikkei 225: Sun 23:30 UTC -> Fri 20:00 UTC
    if (upper == 'JP225') {
      return _weeklyContinuousSchedule(
        now,
        openWeekday: DateTime.sunday,
        openMinuteOfDay: 23 * 60 + 30,
        closeWeekday: DateTime.friday,
        closeMinuteOfDay: 20 * 60,
      );
    }

    // Commodity Futures & US Indices: Sun 22:00 UTC -> Fri 22:00 UTC
    if (spec.category == AssetCategory.commodities ||
        upper == 'US500' ||
        upper == 'NAS100' ||
        upper == 'US30') {
      return _weeklyContinuousSchedule(
        now,
        openWeekday: DateTime.sunday,
        openMinuteOfDay: 22 * 60,
        closeWeekday: DateTime.friday,
        closeMinuteOfDay: 22 * 60,
      );
    }

    // European/UK Indices (GER40, UK100): Mon-Fri 07:00 - 21:00 UTC
    if (spec.category == AssetCategory.indices) {
      return _weekdaySessionSchedule(
        now,
        openMinuteOfDay: 7 * 60,
        closeMinuteOfDay: 21 * 60,
      );
    }

    // US Stocks & ETFs: Mon-Fri 13:30 - 21:00 UTC (covers EDT & EST)
    return _weekdaySessionSchedule(
      now,
      openMinuteOfDay: 13 * 60 + 30,
      closeMinuteOfDay: 21 * 60,
    );
  }

  static int _weekMinute(DateTime utc) {
    // Monday = 1 .. Sunday = 7 -> 0-based Mon=0 .. Sun=6
    final dayIdx = utc.weekday - 1;
    return dayIdx * 1440 + utc.hour * 60 + utc.minute;
  }

  static MarketSessionStatus _weeklyContinuousSchedule(
    DateTime now, {
    required int openWeekday,
    required int openMinuteOfDay,
    required int closeWeekday,
    required int closeMinuteOfDay,
  }) {
    final nowMin = _weekMinute(now);
    final openMin = (openWeekday - 1) * 1440 + openMinuteOfDay;
    final closeMin = (closeWeekday - 1) * 1440 + closeMinuteOfDay;

    // Closed window is [closeMin, openMin) on Fri->Sun
    final isClosed = nowMin >= closeMin && nowMin < openMin;
    if (isClosed) {
      final minsToOpen = openMin - nowMin;
      return MarketSessionStatus(
        isOpen: false,
        isWeekendClosed: true,
        statusLabel: 'Closed (Weekend)',
        timeUntilChange: Duration(minutes: minsToOpen),
      );
    }
    final minsToClose =
        nowMin < closeMin ? closeMin - nowMin : (7 * 1440 - nowMin) + closeMin;
    return MarketSessionStatus(
      isOpen: true,
      isWeekendClosed: false,
      statusLabel: 'Open',
      timeUntilChange: Duration(minutes: minsToClose),
    );
  }

  static MarketSessionStatus _weekdaySessionSchedule(
    DateTime now, {
    required int openMinuteOfDay,
    required int closeMinuteOfDay,
  }) {
    final minuteOfDay = now.hour * 60 + now.minute;
    final isWeekend =
        now.weekday == DateTime.saturday || now.weekday == DateTime.sunday;

    if (isWeekend) {
      final daysUntilMon = now.weekday == DateTime.saturday ? 2 : 1;
      final nextOpen = DateTime.utc(
        now.year,
        now.month,
        now.day + daysUntilMon,
        openMinuteOfDay ~/ 60,
        openMinuteOfDay % 60,
      );
      return MarketSessionStatus(
        isOpen: false,
        isWeekendClosed: true,
        statusLabel: 'Closed (Weekend)',
        timeUntilChange: nextOpen.difference(now),
      );
    }

    if (minuteOfDay < openMinuteOfDay) {
      return MarketSessionStatus(
        isOpen: false,
        isWeekendClosed: false,
        statusLabel: 'Closed (Pre-Market)',
        timeUntilChange: Duration(minutes: openMinuteOfDay - minuteOfDay),
      );
    }

    if (minuteOfDay >= closeMinuteOfDay) {
      final daysToAdd = now.weekday == DateTime.friday ? 3 : 1;
      final nextOpen = DateTime.utc(
        now.year,
        now.month,
        now.day + daysToAdd,
        openMinuteOfDay ~/ 60,
        openMinuteOfDay % 60,
      );
      return MarketSessionStatus(
        isOpen: false,
        isWeekendClosed: now.weekday == DateTime.friday,
        statusLabel: now.weekday == DateTime.friday
            ? 'Closed (Weekend)'
            : 'Closed (After-Hours)',
        timeUntilChange: nextOpen.difference(now),
      );
    }

    return MarketSessionStatus(
      isOpen: true,
      isWeekendClosed: false,
      statusLabel: 'Open',
      timeUntilChange: Duration(minutes: closeMinuteOfDay - minuteOfDay),
    );
  }
}
