import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/ai_copilot_service.dart';

class AiCopilotDrawer extends StatefulWidget {
  final AiCopilotService copilot;
  final String symbol;
  final Timeframe timeframe;
  final List<Candle> candles;
  final VoidCallback onClose;
  final VoidCallback? onOpenSettings;
  final Future<void> Function(CopilotAction action)? onExecuteAction;
  final Future<void> Function(String title, String content)? onSaveToJournal;

  const AiCopilotDrawer({
    super.key,
    required this.copilot,
    required this.symbol,
    required this.timeframe,
    required this.candles,
    required this.onClose,
    this.onOpenSettings,
    this.onExecuteAction,
    this.onSaveToJournal,
  });

  @override
  State<AiCopilotDrawer> createState() => _AiCopilotDrawerState();
}

class _AiCopilotDrawerState extends State<AiCopilotDrawer> {
  final _ctrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _messages.add(ChatMessage(
      role: 'assistant',
      providerUsed: AiCopilotService.specFor(widget.copilot.storage.aiProvider).label,
      content:
          'Ready to assist on ${widget.symbol} (${widget.timeframe.code}). Ask for chart diagnostics, position sizing, portfolio risk checks, or 1-click trade/strategy setups.',
      timestamp: DateTime.now(),
    ));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _send([String? preset]) async {
    final text = (preset ?? _ctrl.text).trim();
    if (text.isEmpty || _loading) return;
    if (preset == null) _ctrl.clear();

    final historySnapshot = List<ChatMessage>.from(_messages);
    setState(() {
      _messages.add(ChatMessage(
        role: 'user',
        content: text,
        timestamp: DateTime.now(),
      ));
      _loading = true;
    });
    _scrollToBottom();

    final reply = await widget.copilot.ask(
      prompt: text,
      symbol: widget.symbol,
      timeframe: widget.timeframe,
      candles: widget.candles,
      history: historySnapshot,
    );

    if (!mounted) return;
    setState(() {
      _messages.add(ChatMessage(
        role: 'assistant',
        content: reply.content,
        providerUsed: reply.providerUsed,
        actions: reply.actions,
        timestamp: DateTime.now(),
      ));
      _loading = false;
    });
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOut,
        );
      }
    });
  }

  IconData _iconForAction(String type) => switch (type) {
        'order' => Icons.bolt,
        'strategy' => Icons.auto_fix_high,
        'alert' => Icons.notifications_active_outlined,
        'close_position' => Icons.close_fullscreen,
        'journal' => Icons.bookmark_add_outlined,
        _ => Icons.play_arrow,
      };

  @override
  Widget build(BuildContext context) {
    final activeSpec =
        AiCopilotService.specFor(widget.copilot.storage.aiProvider);
    final activeModel = widget.copilot.storage.aiModel.trim().isNotEmpty
        ? widget.copilot.storage.aiModel.trim()
        : activeSpec.defaultModel;

    return Container(
      width: 390,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          left: BorderSide(color: Theme.of(context).dividerColor),
        ),
      ),
      child: Column(
        children: [
          Container(
            height: 52,
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
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'AI Quant Copilot',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      Text(
                        '${activeSpec.label} · $activeModel',
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 10.5, color: Color(0xFF94A3B8)),
                      ),
                    ],
                  ),
                ),
                if (widget.onOpenSettings != null)
                  IconButton(
                    tooltip: 'Switch AI Provider / Model',
                    icon: const Icon(Icons.tune, size: 17),
                    onPressed: widget.onOpenSettings,
                  ),
                IconButton(
                  tooltip: 'Clear Chat',
                  icon: const Icon(Icons.delete_sweep_outlined, size: 17),
                  onPressed: () {
                    setState(() {
                      _messages.removeRange(1, _messages.length);
                    });
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 18),
                  onPressed: widget.onClose,
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 4),
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                ActionChip(
                  label: Text('Analyze ${widget.symbol}',
                      style: const TextStyle(fontSize: 11)),
                  onPressed: () =>
                      _send('Analyze ${widget.symbol} (${widget.timeframe.code}) structure, trend, and key levels.'),
                ),
                ActionChip(
                  label: const Text('Trade Setup & Lots',
                      style: TextStyle(fontSize: 11)),
                  onPressed: () => _send(
                      'Suggest a complete ${widget.symbol} trade setup with ATR SL/TP and exact lot sizing for my risk profile.'),
                ),
                ActionChip(
                  label: const Text('Risk & Positions',
                      style: TextStyle(fontSize: 11)),
                  onPressed: () => _send(
                      'Review my open positions, floating PnL, and daily drawdown risk.'),
                ),
                ActionChip(
                  label: const Text('Draft Bot Strategy',
                      style: TextStyle(fontSize: 11)),
                  onPressed: () => _send(
                      'Design an automated rule-based bot strategy for ${widget.symbol} on ${widget.timeframe.code}.'),
                ),
                ActionChip(
                  label: const Text('Review Journal',
                      style: TextStyle(fontSize: 11)),
                  onPressed: () => _send(
                      'Review my recent journal notes and annotated trades to spot recurring mistakes or strengths.'),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              controller: _scrollCtrl,
              padding: const EdgeInsets.all(10),
              itemCount: _messages.length,
              itemBuilder: (ctx, i) {
                final m = _messages[i];
                final isUser = m.role == 'user';
                return Align(
                  alignment:
                      isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(11),
                    constraints: const BoxConstraints(maxWidth: 340),
                    decoration: BoxDecoration(
                      color: isUser
                          ? const Color(0xFF2563EB).withValues(alpha: 0.22)
                          : const Color(0xFF1E293B).withValues(alpha: 0.55),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isUser
                            ? const Color(0xFF3B82F6).withValues(alpha: 0.35)
                            : Colors.white.withValues(alpha: 0.06),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (!isUser && (m.providerUsed ?? '').isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Text(
                              m.providerUsed!,
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF22D3EE),
                              ),
                            ),
                          ),
                        SelectableText(
                          m.content,
                          style: const TextStyle(fontSize: 12, height: 1.42),
                        ),
                        if (m.actions.isNotEmpty &&
                            widget.onExecuteAction != null) ...[
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: m.actions.map((act) {
                              return FilledButton.tonalIcon(
                                style: FilledButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 6),
                                  minimumSize: Size.zero,
                                  tapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                                onPressed: () => widget.onExecuteAction!(act),
                                icon: Icon(_iconForAction(act.type), size: 14),
                                label: Text(
                                  act.label,
                                  style: const TextStyle(fontSize: 11),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                        if (!isUser && widget.onSaveToJournal != null && i > 0) ...[
                          const SizedBox(height: 6),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton.icon(
                              style: TextButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 2),
                                minimumSize: Size.zero,
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                              onPressed: () => widget.onSaveToJournal!(
                                '${widget.symbol} ${widget.timeframe.code} · Copilot Note',
                                m.content,
                              ),
                              icon: const Icon(Icons.bookmark_add_outlined,
                                  size: 13),
                              label: const Text('Save to Journal',
                                  style: TextStyle(fontSize: 10.5)),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              child: LinearProgressIndicator(minHeight: 2),
            ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    minLines: 1,
                    maxLines: 3,
                    onSubmitted: (_) => _send(),
                    decoration: const InputDecoration(
                      hintText: 'Ask Copilot anything...',
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
