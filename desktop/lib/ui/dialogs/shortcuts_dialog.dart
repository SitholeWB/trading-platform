import 'package:flutter/material.dart';
import '../../services/localization_service.dart';

class ShortcutsDialog extends StatelessWidget {
  const ShortcutsDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final shortcuts = [
      ('Ctrl + K / /', AppL10n.tr('shortcuts.search', 'Open Symbol Search')),
      ('Ctrl + /', AppL10n.tr('shortcuts.show', 'Show Keyboard Shortcuts')),
      ('1 - 8', AppL10n.tr('shortcuts.switchPages', 'Switch Navigation Pages')),
      (
        'Space',
        AppL10n.tr('shortcuts.toggleChart',
            'Toggle Bot Chart / TradingView Live (on Live Chart)')
      ),
      ('Esc', AppL10n.tr('shortcuts.closeDialog', 'Close Active Dialog or Drawer')),
    ];

    return Dialog(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 440),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Icon(Icons.keyboard, size: 20, color: Color(0xFF3B82F6)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                        AppL10n.tr('shortcuts.title', 'Keyboard Shortcuts'),
                        style: const TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w700)),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close, size: 18),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ...shortcuts.map(
                (item) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: Text(
                          item.$1,
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(item.$2, style: const TextStyle(fontSize: 13)),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
