import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/ai_copilot_service.dart';

class AiCopilotDrawer extends StatefulWidget {
  final AiCopilotService copilot;
  final String symbol;
  final Timeframe timeframe;
  final List<Candle> candles;
  final VoidCallback onClose;

  const AiCopilotDrawer({
    super.key,
    required this.copilot,
    required this.symbol,
    required this.timeframe,
    required this.candles,
    required this.onClose,
  });

  @override
  State<AiCopilotDrawer> createState() => _AiCopilotDrawerState();
}

class _AiCopilotDrawerState extends State<AiCopilotDrawer> {
  final _ctrl = TextEditingController();
  final List<ChatMessage> _messages = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _messages.add(ChatMessage(
      role: 'assistant',
      content:
          'Ready to analyze ${widget.symbol} (${widget.timeframe.code}). Ask for trend diagnostics, SL/TP ATR envelopes, or strategy critiques.',
      timestamp: DateTime.now(),
    ));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _send([String? preset]) async {
    final text = (preset ?? _ctrl.text).trim();
    if (text.isEmpty || _loading) return;
    if (preset == null) _ctrl.clear();

    setState(() {
      _messages.add(ChatMessage(
        role: 'user',
        content: text,
        timestamp: DateTime.now(),
      ));
      _loading = true;
    });

    final reply = await widget.copilot.ask(
      prompt: text,
      symbol: widget.symbol,
      timeframe: widget.timeframe,
      candles: widget.candles,
    );

    if (!mounted) return;
    setState(() {
      _messages.add(ChatMessage(
        role: 'assistant',
        content: reply,
        timestamp: DateTime.now(),
      ));
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 340,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          left: BorderSide(color: Theme.of(context).dividerColor),
        ),
      ),
      child: Column(
        children: [
          Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: Theme.of(context).dividerColor),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.auto_awesome,
                    size: 18, color: Color(0xFF06B6D4)),
                const SizedBox(width: 8),
                const Text(
                  'AI Quant Copilot',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close, size: 18),
                  onPressed: widget.onClose,
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                ActionChip(
                  label: Text('Analyze ${widget.symbol}',
                      style: const TextStyle(fontSize: 11)),
                  onPressed: () => _send('Analyze ${widget.symbol} structure'),
                ),
                ActionChip(
                  label: const Text('Suggest SL/TP',
                      style: TextStyle(fontSize: 11)),
                  onPressed: () => _send('Suggest ATR Stop Loss and Take Profit'),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(10),
              itemCount: _messages.length,
              itemBuilder: (ctx, i) {
                final m = _messages[i];
                final isUser = m.role == 'user';
                return Align(
                  alignment:
                      isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(10),
                    constraints: const BoxConstraints(maxWidth: 290),
                    decoration: BoxDecoration(
                      color: isUser
                          ? const Color(0xFF2563EB).withValues(alpha: 0.22)
                          : const Color(0xFF1E293B).withValues(alpha: 0.55),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: SelectableText(
                      m.content,
                      style: const TextStyle(fontSize: 12, height: 1.4),
                    ),
                  ),
                );
              },
            ),
          ),
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(6),
              child: LinearProgressIndicator(minHeight: 2),
            ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    onSubmitted: (_) => _send(),
                    decoration: const InputDecoration(
                      hintText: 'Ask AI Copilot...',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                IconButton.filled(
                  onPressed: _loading ? null : () => _send(),
                  icon: const Icon(Icons.send, size: 16),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
