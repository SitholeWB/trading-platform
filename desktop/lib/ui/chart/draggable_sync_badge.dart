import 'package:flutter/material.dart';
import '../../services/localization_service.dart';

class DraggableSyncBadge extends StatefulWidget {
  final int secondsUntilSync;
  final bool isSyncing;
  final VoidCallback onManualSync;

  const DraggableSyncBadge({
    super.key,
    required this.secondsUntilSync,
    required this.isSyncing,
    required this.onManualSync,
  });

  @override
  State<DraggableSyncBadge> createState() => _DraggableSyncBadgeState();
}

class _DraggableSyncBadgeState extends State<DraggableSyncBadge> {
  Offset _offset = const Offset(16, 48);

  @override
  Widget build(BuildContext context) {
    final isUrgent = widget.secondsUntilSync <= 5;
    final accent =
        isUrgent ? const Color(0xFFF59E0B) : const Color(0xFF10B981);

    return Positioned(
      right: _offset.dx,
      top: _offset.dy,
      child: GestureDetector(
        onPanUpdate: (details) {
          setState(() {
            _offset = Offset(
              (_offset.dx - details.delta.dx).clamp(8.0, 900.0),
              (_offset.dy + details.delta.dy).clamp(8.0, 600.0),
            );
          });
        },
        child: Material(
          color: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A).withValues(alpha: 0.92),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: accent.withValues(alpha: 0.5)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.35),
                  blurRadius: 10,
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.drag_indicator,
                    size: 13, color: Color(0xFF64748B)),
                const SizedBox(width: 4),
                Container(
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: accent,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  widget.isSyncing
                      ? AppL10n.tr('chart.refreshing', 'Refreshing...')
                      : '${AppL10n.tr('chart.refreshIn', 'Refresh in')} ${widget.secondsUntilSync}s',
                  style: const TextStyle(
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: Color(0xFFE2E8F0),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: 6),
                InkWell(
                  onTap: widget.isSyncing ? null : widget.onManualSync,
                  borderRadius: BorderRadius.circular(6),
                  child: Padding(
                    padding: const EdgeInsets.all(2),
                    child: Icon(
                      Icons.refresh,
                      size: 13,
                      color: widget.isSyncing
                          ? const Color(0xFF64748B)
                          : const Color(0xFF38BDF8),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
