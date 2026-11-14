import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../services/localization_service.dart';
import '../../services/storage_service.dart';

class FeedbackDialog extends StatefulWidget {
  final StorageService storage;
  final String activeProvider;

  const FeedbackDialog({
    super.key,
    required this.storage,
    required this.activeProvider,
  });

  static String decodeWebhookUrl() {
    const payload = String.fromEnvironment('DISCORD_PAYLOAD');
    const salt = String.fromEnvironment('DISCORD_SALT');
    if (payload.isEmpty || salt.isEmpty) return '';
    final buf = StringBuffer();
    for (int i = 0; i < payload.length; i += 2) {
      final code = int.parse(payload.substring(i, i + 2), radix: 16) ^
          salt.codeUnitAt((i ~/ 2) % salt.length);
      buf.writeCharCode(code);
    }
    final result = buf.toString();
    return result.startsWith('https://') ? result : '';
  }

  @override
  State<FeedbackDialog> createState() => _FeedbackDialogState();
}

class _FeedbackDialogState extends State<FeedbackDialog> {
  static const int _rateLimitSeconds = 45;
  final _random = Random();

  late final TextEditingController _nameCtrl;
  late final TextEditingController _contactCtrl;
  late final TextEditingController _msgCtrl;
  late final TextEditingController _captchaCtrl;

  String _category = 'Suggestion';
  late int _num1;
  late int _num2;
  bool _submitting = false;
  bool _success = false;
  String? _error;
  int _cooldown = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.storage.feedbackAuthor);
    _contactCtrl = TextEditingController(text: widget.storage.feedbackContact);
    _msgCtrl = TextEditingController();
    _captchaCtrl = TextEditingController();
    _generateChallenge();
    _checkCooldown();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _nameCtrl.dispose();
    _contactCtrl.dispose();
    _msgCtrl.dispose();
    _captchaCtrl.dispose();
    super.dispose();
  }

  void _generateChallenge() {
    _num1 = _random.nextInt(12) + 1;
    _num2 = _random.nextInt(10) + 1;
    _captchaCtrl.clear();
  }

  void _checkCooldown() {
    final last = widget.storage.feedbackLastSentMs;
    if (last <= 0) return;
    final diff =
        ((DateTime.now().millisecondsSinceEpoch - last) / 1000).floor();
    if (diff < _rateLimitSeconds) {
      _startCooldown(_rateLimitSeconds - diff);
    }
  }

  void _startCooldown(int seconds) {
    _timer?.cancel();
    setState(() => _cooldown = seconds);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_cooldown <= 1) {
        t.cancel();
        setState(() => _cooldown = 0);
      } else {
        setState(() => _cooldown--);
      }
    });
  }

  Future<void> _submit() async {
    final msg = _msgCtrl.text.trim();
    if (msg.length < 5) {
      setState(() => _error = 'Please enter at least 5 characters.');
      return;
    }
    if (int.tryParse(_captchaCtrl.text.trim()) != _num1 + _num2) {
      setState(() {
        _error = 'Incorrect math verification.';
        _generateChallenge();
      });
      return;
    }

    final webhook = FeedbackDialog.decodeWebhookUrl();
    if (webhook.isEmpty) {
      setState(() => _error =
          'Feedback channel is not configured in this development build.');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final resp = await http
          .post(
            Uri.parse(webhook),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'embeds': [
                {
                  'title': 'Trading Platform Desktop v2.0.1 · $_category',
                  'description': msg,
                  'color': _category == 'Bug' ? 15548997 : 3447003,
                  'fields': [
                    {
                      'name': 'Author',
                      'value': _nameCtrl.text.trim().isEmpty
                          ? 'Anonymous'
                          : _nameCtrl.text.trim(),
                      'inline': true,
                    },
                    {
                      'name': 'Contact',
                      'value': _contactCtrl.text.trim().isEmpty
                          ? 'N/A'
                          : _contactCtrl.text.trim(),
                      'inline': true,
                    },
                    {
                      'name': 'Provider',
                      'value': widget.activeProvider,
                      'inline': true,
                    },
                  ],
                },
              ],
            }),
          )
          .timeout(const Duration(seconds: 10));

      if (resp.statusCode >= 200 && resp.statusCode < 300) {
        widget.storage.feedbackAuthor = _nameCtrl.text.trim();
        widget.storage.feedbackContact = _contactCtrl.text.trim();
        widget.storage.feedbackLastSentMs =
            DateTime.now().millisecondsSinceEpoch;
        await widget.storage.save();
        _startCooldown(_rateLimitSeconds);
        setState(() => _success = true);
      } else {
        setState(() => _error = 'Failed to send (${resp.statusCode}).');
      }
    } catch (e) {
      setState(() => _error = 'Network error: $e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: SizedBox(
        width: 480,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.feedback_outlined, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    AppL10n.tr('feedback.title', 'Send Feedback'),
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
              if (_success) ...[
                const SizedBox(height: 12),
                Text(
                  AppL10n.tr('feedback.deliveredDesc',
                      'Thank you! Your feedback was delivered directly to the developer channel.'),
                  style: const TextStyle(color: Color(0xFF10B981)),
                ),
                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerRight,
                  child: FilledButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text(AppL10n.tr('common.close', 'Done')),
                  ),
                ),
              ] else ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  children: [
                    ('Suggestion', AppL10n.tr('feedback.strategy', 'Suggestion')),
                    ('Bug', AppL10n.tr('feedback.bug', 'Bug')),
                    ('Feature', AppL10n.tr('feedback.feature', 'Feature')),
                    ('General', AppL10n.tr('feedback.general', 'General')),
                  ]
                      .map((cat) => ChoiceChip(
                            label: Text(cat.$2),
                            selected: _category == cat.$1,
                            onSelected: (_) =>
                                setState(() => _category = cat.$1),
                          ))
                      .toList(),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _nameCtrl,
                        decoration: InputDecoration(
                          labelText: AppL10n.tr(
                              'feedback.nameLabel', 'Name (Optional)'),
                          border: const OutlineInputBorder(),
                          isDense: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _contactCtrl,
                        decoration: InputDecoration(
                          labelText: AppL10n.tr('feedback.contactLabel',
                              'Email / Handle (Optional)'),
                          border: const OutlineInputBorder(),
                          isDense: true,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _msgCtrl,
                  maxLines: 4,
                  decoration: InputDecoration(
                    labelText: AppL10n.tr('feedback.messageLabel', 'Message'),
                    hintText: AppL10n.tr('feedback.messagePlaceholder',
                        'Share a bug report, feature request, or idea...'),
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Text('${AppL10n.tr('feedback.antiBotTitle', 'Verify')}: $_num1 + $_num2 = '),
                    SizedBox(
                      width: 80,
                      child: TextField(
                        controller: _captchaCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                      ),
                    ),
                  ],
                ),
                if (_error != null) ...[
                  const SizedBox(height: 8),
                  Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                ],
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text(AppL10n.tr('common.cancel', 'Cancel')),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: (_submitting || _cooldown > 0) ? null : _submit,
                      child: Text(_cooldown > 0
                          ? '${_cooldown}s'
                          : _submitting
                              ? AppL10n.tr('feedback.sending', 'Sending...')
                              : AppL10n.tr(
                                  'feedback.sendButton', 'Submit Feedback')),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
