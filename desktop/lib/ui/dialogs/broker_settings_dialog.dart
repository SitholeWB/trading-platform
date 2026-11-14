import 'package:flutter/material.dart';
import '../../services/ai_copilot_service.dart';
import '../../services/localization_service.dart';
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
  late final TextEditingController _aiModel;
  late final TextEditingController _aiKey;
  late final TextEditingController _aiEndpoint;
  bool _testingAi = false;
  bool _fetchingModels = false;
  List<String> _fetchedModels = [];
  String? _aiTestStatus;
  bool _aiTestOk = false;

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
    _aiModel = TextEditingController(text: widget.storage.aiModel);
    _aiKey = TextEditingController(text: widget.storage.aiApiKey);
    _aiEndpoint = TextEditingController(text: widget.storage.aiEndpoint);
  }

  @override
  void dispose() {
    _oandaKey.dispose();
    _oandaAccount.dispose();
    _twelveKey.dispose();
    _aiModel.dispose();
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
                    Text(
                      AppL10n.tr('settings.title', 'Platform Settings'),
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold),
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
                Text(AppL10n.tr('settings.marketProvider', 'Market Data & Execution Provider'),
                    style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                SegmentedButton<String>(
                  segments: [
                    ButtonSegment(
                        value: 'KeylessPublic',
                        label: Text(AppL10n.tr(
                            'settings.keylessLive', 'Keyless Live'))),
                    const ButtonSegment(value: 'Oanda', label: Text('OANDA')),
                    const ButtonSegment(
                        value: 'TwelveData', label: Text('TwelveData')),
                    ButtonSegment(
                        value: 'Demo',
                        label: Text(AppL10n.tr('settings.demoSim', 'Demo Sim'))),
                  ],
                  selected: {_provider},
                  onSelectionChanged: (s) => setState(() => _provider = s.first),
                ),
                if (_provider == 'Oanda') ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: _oandaAccount,
                    decoration: InputDecoration(
                      labelText: AppL10n.tr(
                          'settings.oandaAccountId', 'OANDA Account ID'),
                      border: const OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _oandaKey,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText:
                          AppL10n.tr('settings.oandaToken', 'OANDA API Token'),
                      border: const OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(AppL10n.tr('settings.oandaPractice',
                        'Use OANDA Practice (fxPractice)')),
                    value: _oandaPractice,
                    onChanged: (v) => setState(() => _oandaPractice = v),
                  ),
                ],
                if (_provider == 'TwelveData') ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: _twelveKey,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: AppL10n.tr(
                          'settings.twelveDataKey', 'TwelveData API Key'),
                      border: const OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Text(AppL10n.tr('settings.aiEngine', 'AI Quant Copilot Engine'),
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                DropdownButtonFormField<String>(
                  initialValue: AiCopilotService.providers
                          .any((p) => p.id == _aiProvider)
                      ? _aiProvider
                      : 'BuiltIn',
                  decoration: InputDecoration(
                    labelText:
                        AppL10n.tr('settings.aiProvider', 'AI Provider'),
                    border: const OutlineInputBorder(),
                    isDense: true,
                  ),
                  items: AiCopilotService.providers
                      .map((p) => DropdownMenuItem(
                            value: p.id,
                            child: Text(p.label,
                                style: const TextStyle(fontSize: 13)),
                          ))
                      .toList(),
                  onChanged: (v) {
                    if (v == null) return;
                    final spec = AiCopilotService.specFor(v);
                    setState(() {
                      _aiProvider = v;
                      _fetchedModels = [];
                      _aiTestStatus = null;
                      if (_aiModel.text.trim().isEmpty) {
                        _aiModel.text = spec.defaultModel;
                      }
                      if (spec.defaultEndpoint.isNotEmpty) {
                        _aiEndpoint.text = spec.defaultEndpoint;
                      }
                    });
                  },
                ),
                if (_aiProvider != 'BuiltIn') ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _aiModel,
                          decoration: InputDecoration(
                            labelText: 'Model Name (any model ID)',
                            hintText:
                                'e.g. ${AiCopilotService.specFor(_aiProvider).defaultModel}',
                            border: const OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton.icon(
                        onPressed: _fetchingModels
                            ? null
                            : () async {
                                setState(() {
                                  _fetchingModels = true;
                                  _aiTestStatus = null;
                                });
                                try {
                                  final list = await AiCopilotService(
                                          widget.storage)
                                      .fetchAvailableModels(
                                    provider: _aiProvider,
                                    apiKey: _aiKey.text,
                                    endpoint: _aiEndpoint.text,
                                  );
                                  if (!mounted) return;
                                  setState(() {
                                    _fetchingModels = false;
                                    _fetchedModels = list;
                                    _aiTestOk = true;
                                    _aiTestStatus =
                                        'Loaded ${list.length} live models from ${AiCopilotService.specFor(_aiProvider).label}.';
                                  });
                                } catch (e) {
                                  if (!mounted) return;
                                  setState(() {
                                    _fetchingModels = false;
                                    _aiTestOk = false;
                                    _aiTestStatus = e.toString();
                                  });
                                }
                              },
                        icon: _fetchingModels
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.refresh, size: 16),
                        label: const Text('Fetch Models'),
                      ),
                    ],
                  ),
                  if (_fetchedModels.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue:
                          _fetchedModels.contains(_aiModel.text.trim())
                              ? _aiModel.text.trim()
                              : null,
                      hint: const Text('Pick from fetched models...'),
                      decoration: const InputDecoration(
                        labelText: 'Available Models',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      items: _fetchedModels
                          .map((m) => DropdownMenuItem(
                                value: m,
                                child: Text(m,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 12.5)),
                              ))
                          .toList(),
                      onChanged: (v) {
                        if (v != null) setState(() => _aiModel.text = v);
                      },
                    ),
                  ],
                ],
                if (AiCopilotService.specFor(_aiProvider).requiresKey ||
                    _aiProvider == 'Custom') ...[
                  const SizedBox(height: 10),
                  TextField(
                    controller: _aiKey,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText:
                          '${AiCopilotService.specFor(_aiProvider).label} API Key${_aiProvider == 'Custom' ? ' (optional)' : ''}',
                      border: const OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                ],
                if (AiCopilotService.specFor(_aiProvider)
                    .supportsCustomEndpoint) ...[
                  const SizedBox(height: 10),
                  TextField(
                    controller: _aiEndpoint,
                    decoration: InputDecoration(
                      labelText: _aiProvider == 'Ollama'
                          ? 'Ollama Endpoint'
                          : 'OpenAI-Compatible Base URL',
                      hintText: AiCopilotService.specFor(_aiProvider)
                          .defaultEndpoint,
                      border: const OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                ],
                const SizedBox(height: 10),
                Row(
                  children: [
                    OutlinedButton.icon(
                      onPressed: _testingAi
                          ? null
                          : () async {
                              setState(() {
                                _testingAi = true;
                                _aiTestStatus = 'Testing...';
                                _aiTestOk = false;
                              });
                              try {
                                final msg = await AiCopilotService(
                                        widget.storage)
                                    .testProvider(
                                  provider: _aiProvider,
                                  model: _aiModel.text,
                                  apiKey: _aiKey.text,
                                  endpoint: _aiEndpoint.text,
                                );
                                if (!mounted) return;
                                setState(() {
                                  _testingAi = false;
                                  _aiTestOk = true;
                                  _aiTestStatus = msg;
                                });
                              } catch (e) {
                                if (!mounted) return;
                                setState(() {
                                  _testingAi = false;
                                  _aiTestOk = false;
                                  _aiTestStatus = e.toString();
                                });
                              }
                            },
                      icon: _testingAi
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.network_check, size: 16),
                      label: Text(
                          AppL10n.tr('settings.testAi', 'Test AI Connection')),
                    ),
                    if (_aiTestStatus != null) ...[
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _aiTestStatus!,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 11.5,
                            color: _aiTestOk
                                ? const Color(0xFF10B981)
                                : const Color(0xFFEF4444),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 16),
                Text(AppL10n.tr('settings.appearance', 'Appearance & Desktop Alerts'),
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                SegmentedButton<ThemeMode>(
                  segments: [
                    ButtonSegment(
                        value: ThemeMode.dark,
                        label: Text(
                            AppL10n.tr('settings.yaruDark', 'Yaru Dark'))),
                    ButtonSegment(
                        value: ThemeMode.light,
                        label: Text(
                            AppL10n.tr('settings.yaruLight', 'Yaru Light'))),
                    ButtonSegment(
                        value: ThemeMode.system,
                        label: Text(
                            AppL10n.tr('settings.systemTheme', 'System'))),
                  ],
                  selected: {_themeMode},
                  onSelectionChanged: (s) =>
                      setState(() => _themeMode = s.first),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(AppL10n.tr('settings.nativeNotifs', 'Native Linux Desktop Notifications')),
                  value: _desktopNotifs,
                  onChanged: (v) => setState(() => _desktopNotifs = v),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text(AppL10n.tr('common.cancel', 'Cancel')),
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
                        widget.storage.aiModel = _aiModel.text.trim();
                        widget.storage.aiApiKey = _aiKey.text.trim();
                        widget.storage.aiEndpoint = _aiEndpoint.text.trim();
                        widget.storage.themeMode = _themeMode;
                        widget.storage.desktopNotificationsEnabled =
                            _desktopNotifs;
                        await widget.storage.save();
                        widget.onSaved();
                        if (context.mounted) Navigator.pop(context);
                      },
                      child: Text(AppL10n.tr('common.save', 'Save Settings')),
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
