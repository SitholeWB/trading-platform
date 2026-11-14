import 'dart:async';
import '../../services/localization_service.dart';

import 'package:flutter/material.dart';

class TimezoneOption {
  const TimezoneOption({
    required this.iana,
    required this.city,
    required this.region,
    required this.offsetLabel,
    required this.offsetMinutes,
  });

  final String iana;
  final String city;
  final String region;
  final String offsetLabel;
  final int offsetMinutes;
}

const List<TimezoneOption> kFinancialTimezones = [
  TimezoneOption(iana: 'Etc/UTC', city: 'UTC (Coordinated Universal)', region: 'Global', offsetLabel: 'UTC+0', offsetMinutes: 0),
  TimezoneOption(iana: 'America/New_York', city: 'New York (NYSE / NASDAQ)', region: 'Americas', offsetLabel: 'UTC-5/-4', offsetMinutes: -300),
  TimezoneOption(iana: 'America/Chicago', city: 'Chicago (CME / CBOT)', region: 'Americas', offsetLabel: 'UTC-6/-5', offsetMinutes: -360),
  TimezoneOption(iana: 'Europe/London', city: 'London (LSE / FX Hub)', region: 'Europe', offsetLabel: 'UTC+0/+1', offsetMinutes: 0),
  TimezoneOption(iana: 'Europe/Frankfurt', city: 'Frankfurt (Xetra / ECB)', region: 'Europe', offsetLabel: 'UTC+1/+2', offsetMinutes: 60),
  TimezoneOption(iana: 'Europe/Zurich', city: 'Zurich (SIX)', region: 'Europe', offsetLabel: 'UTC+1/+2', offsetMinutes: 60),
  TimezoneOption(iana: 'Africa/Johannesburg', city: 'Johannesburg (JSE)', region: 'Africa', offsetLabel: 'UTC+2', offsetMinutes: 120),
  TimezoneOption(iana: 'Asia/Dubai', city: 'Dubai (DGCX)', region: 'Middle East', offsetLabel: 'UTC+4', offsetMinutes: 240),
  TimezoneOption(iana: 'Asia/Tokyo', city: 'Tokyo (TSE)', region: 'Asia-Pacific', offsetLabel: 'UTC+9', offsetMinutes: 540),
  TimezoneOption(iana: 'Asia/Hong_Kong', city: 'Hong Kong (HKEX)', region: 'Asia-Pacific', offsetLabel: 'UTC+8', offsetMinutes: 480),
  TimezoneOption(iana: 'Asia/Singapore', city: 'Singapore (SGX)', region: 'Asia-Pacific', offsetLabel: 'UTC+8', offsetMinutes: 480),
  TimezoneOption(iana: 'Asia/Shanghai', city: 'Shanghai (SSE)', region: 'Asia-Pacific', offsetLabel: 'UTC+8', offsetMinutes: 480),
  TimezoneOption(iana: 'Australia/Sydney', city: 'Sydney (ASX)', region: 'Asia-Pacific', offsetLabel: 'UTC+10/+11', offsetMinutes: 600),
  TimezoneOption(iana: 'Pacific/Auckland', city: 'Auckland (NZX)', region: 'Asia-Pacific', offsetLabel: 'UTC+12/+13', offsetMinutes: 720),
];

class TimezoneSelectorDialog extends StatefulWidget {
  const TimezoneSelectorDialog({
    super.key,
    required this.currentTimezone,
    required this.onSelect,
  });

  final String currentTimezone;
  final ValueChanged<String> onSelect;

  @override
  State<TimezoneSelectorDialog> createState() => _TimezoneSelectorDialogState();
}

class _TimezoneSelectorDialogState extends State<TimezoneSelectorDialog> {
  final _searchCtrl = TextEditingController();
  String _query = '';
  bool _use24Hour = true;
  late Timer _clockTimer;
  DateTime _nowUtc = DateTime.now().toUtc();

  @override
  void initState() {
    super.initState();
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _nowUtc = DateTime.now().toUtc());
    });
  }

  @override
  void dispose() {
    _clockTimer.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  String _formatForOffset(int offsetMinutes) {
    final dt = _nowUtc.add(Duration(minutes: offsetMinutes));
    final h = _use24Hour ? dt.hour : (dt.hour % 12 == 0 ? 12 : dt.hour % 12);
    final m = dt.minute.toString().padLeft(2, '0');
    final s = dt.second.toString().padLeft(2, '0');
    final suffix = _use24Hour ? '' : (dt.hour >= 12 ? ' PM' : ' AM');
    return '${h.toString().padLeft(2, '0')}:$m:$s$suffix';
  }

  bool _isSessionOpen(int startUtcHour, int endUtcHour) {
    final h = _nowUtc.hour;
    if (startUtcHour < endUtcHour) {
      return h >= startUtcHour && h < endUtcHour;
    }
    return h >= startUtcHour || h < endUtcHour;
  }

  @override
  Widget build(BuildContext context) {
    final q = _query.trim().toLowerCase();
    final filtered = kFinancialTimezones.where((tz) {
      if (q.isEmpty) return true;
      return tz.iana.toLowerCase().contains(q) ||
          tz.city.toLowerCase().contains(q) ||
          tz.region.toLowerCase().contains(q) ||
          tz.offsetLabel.toLowerCase().contains(q);
    }).toList();

    return Dialog(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 560, maxHeight: 600),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Icon(Icons.public, size: 20, color: Color(0xFF3B82F6)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                            AppL10n.tr('tz.title',
                                'Platform Timezone & Market Sessions'),
                            style: const TextStyle(
                                fontSize: 15, fontWeight: FontWeight.w700)),
                        Text(
                            AppL10n.tr('tz.subtitle',
                                'Applies to charts, TradingView Live, and audit timestamps'),
                            style: const TextStyle(
                                fontSize: 11, color: Colors.white60)),
                      ],
                    ),
                  ),
                  SegmentedButton<bool>(
                    segments: const [
                      ButtonSegment(value: true, label: Text('24h')),
                      ButtonSegment(value: false, label: Text('12h')),
                    ],
                    selected: {_use24Hour},
                    onSelectionChanged: (v) => setState(() => _use24Hour = v.first),
                  ),
                  const SizedBox(width: 6),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close, size: 18),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: [
                  _sessionChip('Sydney', _isSessionOpen(21, 6)),
                  _sessionChip('Tokyo', _isSessionOpen(0, 9)),
                  _sessionChip('London', _isSessionOpen(8, 17)),
                  _sessionChip('New York', _isSessionOpen(13, 22)),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _searchCtrl,
                autofocus: true,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.search, size: 18),
                  hintText: AppL10n.tr('tz.searchHint',
                      'Search city, region, or IANA timezone (e.g. Johannesburg, New_York)...'),
                  isDense: true,
                ),
                onChanged: (v) => setState(() => _query = v),
              ),
              const SizedBox(height: 10),
              Expanded(
                child: ListView.separated(
                  itemCount: filtered.length,
                  separatorBuilder: (_, _) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final tz = filtered[index];
                    final selected = tz.iana == widget.currentTimezone;
                    return ListTile(
                      dense: true,
                      selected: selected,
                      selectedTileColor: const Color(0xFF3B82F6).withValues(alpha: 0.14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      title: Text(tz.city,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      subtitle: Text('${tz.iana} · ${tz.region} · ${tz.offsetLabel}',
                          style: const TextStyle(fontSize: 11, color: Colors.white60)),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _formatForOffset(tz.offsetMinutes),
                            style: const TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (selected) ...[
                            const SizedBox(width: 8),
                            const Icon(Icons.check_circle, size: 16, color: Color(0xFF10B981)),
                          ],
                        ],
                      ),
                      onTap: () {
                        widget.onSelect(tz.iana);
                        Navigator.of(context).pop();
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sessionChip(String name, bool open) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: (open ? const Color(0xFF10B981) : Colors.white24).withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: (open ? const Color(0xFF10B981) : Colors.white24).withValues(alpha: 0.4),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: open ? const Color(0xFF10B981) : Colors.white38,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            '$name: ${open ? "OPEN" : "CLOSED"}',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: open ? const Color(0xFF34D399) : Colors.white60,
            ),
          ),
        ],
      ),
    );
  }
}
