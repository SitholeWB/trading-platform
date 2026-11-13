import 'package:flutter/material.dart';
import '../../services/storage_service.dart';

class BrokerSettingsDialog extends StatefulWidget {
  final StorageService storage;
  final VoidCallback onSaved;

  const BrokerSettingsDialog({
    super.key,
    required this.storage,
    required this.onSaved,
  });

  @override
  State<BrokerSettingsDialog> createState() => _BrokerSettingsDialogState();
}

class _BrokerSettingsDialogState extends State<BrokerSettingsDialog> {
  late String _provider;
  late String _aiProvider;
  late bool _oandaPractice;
  late ThemeMode _themeMode;
  late bool _desktopNotifs;
  late final TextEditingController _oandaKey;
  late final TextEditingController _oandaAccount;
  late final TextEditingController _twelveKey;
  late final TextEditingController _aiKey;
  late final TextEditingController _aiEndpoint;

  @override
  void initState() {
    super.initState();
    _provider = widget.storage.activeProvider;
    _aiProvider = widget.storage.aiProvider;
    _oandaPractice = widget.storage.oandaIsPractice;
    _themeMode = widget.storage.themeMode;
    _desktopNotifs = widget.storage.desktopNotificationsEnabled;
    _oandaKey = TextEditingController(text: widget.storage.oandaApiKey);
    _oandaAccount = TextEditingController(text: widget.storage.oandaAccountId);
    _twelveKey = TextEditingController(text: widget.storage.twelveDataApiKey);
    _aiKey = TextEditingController(text: widget.storage.aiApiKey);
    _aiEndpoint = TextEditingController(text: widget.storage.aiEndpoint);
  }

  @override
  void dispose() {
    _oandaKey.dispose();
    _oandaAccount.dispose();
    _twelveKey.dispose();
    _aiKey.dispose();
    _aiEndpoint.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: SizedBox(
        width: 540,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.settings, size: 20),
                    const SizedBox(width: 8),
                    const Text(
                      'Platform, Broker & AI Settings',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const Divider(),
                const SizedBox(height: 8),
                const Text('Market Data & Execution Provider',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'KeylessPublic', label: Text('Keyless Live')),
                    ButtonSegment(value: 'Oanda', label: Text('OANDA')),
                    ButtonSegment(value: 'TwelveData', label: Text('TwelveData')),
                    ButtonSegment(value: 'Demo', label: Text('Demo Sim')),
                  ],
                  selected: {_provider},
                  onSelectionChanged: (s) => setState(() => _provider = s.first),
                ),
                if (_provider == 'Oanda') ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: _oandaAccount,
                    decoration: const InputDecoration(
                      labelText: 'OANDA Account ID',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _oandaKey,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'OANDA API Token',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Use OANDA Practice (fxPractice)'),
                    value: _oandaPractice,
                    onChanged: (v) => setState(() => _oandaPractice = v),
                  ),
                ],
                if (_provider == 'TwelveData') ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: _twelveKey,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'TwelveData API Key',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                const Text('AI Quant Copilot Engine',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'BuiltIn', label: Text('Built-in Quant')),
                    ButtonSegment(value: 'OpenAI', label: Text('OpenAI')),
                    ButtonSegment(value: 'Ollama', label: Text('Local Ollama')),
                  ],
                  selected: {_aiProvider},
                  onSelectionChanged: (s) =>
                      setState(() => _aiProvider = s.first),
                ),
                if (_aiProvider == 'OpenAI') ...[
                  const SizedBox(height: 10),
                  TextField(
                    controller: _aiKey,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'OpenAI API Key',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                ],
                if (_aiProvider == 'Ollama') ...[
                  const SizedBox(height: 10),
                  TextField(
                    controller: _aiEndpoint,
                    decoration: const InputDecoration(
                      labelText: 'Ollama Endpoint',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                const Text('Appearance & Desktop Alerts',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                SegmentedButton<ThemeMode>(
                  segments: const [
                    ButtonSegment(value: ThemeMode.dark, label: Text('Yaru Dark')),
                    ButtonSegment(value: ThemeMode.light, label: Text('Yaru Light')),
                    ButtonSegment(value: ThemeMode.system, label: Text('System')),
                  ],
                  selected: {_themeMode},
                  onSelectionChanged: (s) =>
                      setState(() => _themeMode = s.first),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Native Linux Desktop Notifications'),
                  value: _desktopNotifs,
                  onChanged: (v) => setState(() => _desktopNotifs = v),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: () async {
                        widget.storage.activeProvider = _provider;
                        widget.storage.oandaAccountId =
                            _oandaAccount.text.trim();
                        widget.storage.oandaApiKey = _oandaKey.text.trim();
                        widget.storage.oandaIsPractice = _oandaPractice;
                        widget.storage.twelveDataApiKey = _twelveKey.text.trim();
                        widget.storage.aiProvider = _aiProvider;
                        widget.storage.aiApiKey = _aiKey.text.trim();
                        widget.storage.aiEndpoint = _aiEndpoint.text.trim();
                        widget.storage.themeMode = _themeMode;
                        widget.storage.desktopNotificationsEnabled =
                            _desktopNotifs;
                        await widget.storage.save();
                        widget.onSaved();
                        if (context.mounted) Navigator.pop(context);
                      },
                      child: const Text('Save Settings'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
