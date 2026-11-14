import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/localization_service.dart';

class AboutPlatformDialog extends StatefulWidget {
  final String activeProvider;
  const AboutPlatformDialog({super.key, required this.activeProvider});

  @override
  State<AboutPlatformDialog> createState() => _AboutPlatformDialogState();
}

class _AboutPlatformDialogState extends State<AboutPlatformDialog> {
  bool _copied = false;

  @override
  Widget build(BuildContext context) {
    const version = '3.0.2';
    return Dialog(
      child: SizedBox(
        width: 460,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.asset('assets/icon.png', width: 42, height: 42),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        AppL10n.tr('common.appTitle', 'Trading Platform'),
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const Text(
                        'v$version · Native Flutter Desktop (Yaru)',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Runtime: Native AOT Linux Binary (${Platform.operatingSystem} ${Platform.version.split(' ').first})\n'
                'Market Data Provider: ${widget.activeProvider}\n'
                'Charting: Native GPU CustomPainter + TradingView Live Bridge\n'
                'Precision: Dynamic up to 10 decimal places',
                style: const TextStyle(fontSize: 12.5, height: 1.5),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton.icon(
                    icon: Icon(_copied ? Icons.check : Icons.copy, size: 16),
                    label: Text(_copied
                        ? AppL10n.tr('about.copied', 'Copied!')
                        : AppL10n.tr('about.copyDiag', 'Copy Diagnostics')),
                    onPressed: () async {
                      await Clipboard.setData(ClipboardData(
                        text:
                            'Trading Platform v$version | Flutter Native Desktop | Provider: ${widget.activeProvider} | OS: ${Platform.operatingSystem}',
                      ));
                      setState(() => _copied = true);
                    },
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text(AppL10n.tr('common.close', 'Close')),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
