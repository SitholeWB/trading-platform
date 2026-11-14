import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/trading_models.dart';
import '../../services/ai_copilot_service.dart';
import '../widgets/markdown_message_view.dart';

class AiCopilotDrawer extends StatefulWidget {
  final AiCopilotService copilot;
  final String symbol;
  final Timeframe timeframe;
  final List<Candle> candles;
  final VoidCallback onClose;
  final VoidCallback? onOpenSettings;
  final bool isExpanded;
  final VoidCallback? onToggleExpand;
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
    this.isExpanded = false,
    this.onToggleExpand,
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
  double _width = 440;

  @override
  void initState() {
    super.initState();
    _messages.add(ChatMessage(
      role: 'assistant',
      providerUsed:
          AiCopilotService.specFor(widget.copilot.storage.aiProvider).label,
      content:
          'Ready to assist on **${widget.symbol}** (`${widget.timeframe.code}`). Ask for chart diagnostics, position sizing, portfolio risk checks, or 1-click trade & strategy setups.',
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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Row(
      mainAxisSize: widget.isExpanded ? MainAxisSize.max : MainAxisSize.min,
      children: [
        if (!widget.isExpanded)
          MouseRegion(
            cursor: SystemMouseCursors.resizeLeftRight,
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onHorizontalDragUpdate: (details) {
                setState(() {
                  _width = (_width - details.delta.dx).clamp(360.0, 960.0);
                });
              },
              child: Container(
                width: 6,
                height: double.infinity,
                color: Colors.transparent,
                child: Center(
                  child: Container(
                    width: 2,
                    height: 44,
                    decoration: BoxDecoration(
                      color: Theme.of(context).dividerColor,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ),
            ),
          ),
        Expanded(
          flex: widget.isExpanded ? 1 : 0,
          child: Container(
            width: widget.isExpanded ? null : _width,
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
                      if (widget.onToggleExpand != null)
                        IconButton(
                          tooltip: widget.isExpanded
                              ? 'Restore Side Panel'
                              : 'Expand Full Workspace',
                          icon: Icon(
                            widget.isExpanded
                                ? Icons.close_fullscreen
                                : Icons.open_in_full,
                            size: 17,
                          ),
                          onPressed: widget.onToggleExpand,
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
                        tooltip: 'Close Copilot',
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: widget.onClose,
                      ),
                    ],
                  ),
                ),
                SizedBox(
                  height: 40,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    children: [
                      ActionChip(
                        visualDensity: VisualDensity.compact,
                        label: Text('Analyze ${widget.symbol}',
                            style: const TextStyle(fontSize: 11)),
                        onPressed: () => _send(
                            'Analyze ${widget.symbol} (${widget.timeframe.code}) structure, trend, and key levels.'),
                      ),
                      const SizedBox(width: 6),
                      ActionChip(
                        visualDensity: VisualDensity.compact,
                        label: const Text('Trade Setup & Lots',
                            style: TextStyle(fontSize: 11)),
                        onPressed: () => _send(
                            'Suggest a complete ${widget.symbol} trade setup with ATR SL/TP and exact lot sizing for my risk profile.'),
                      ),
                      const SizedBox(width: 6),
                      ActionChip(
                        visualDensity: VisualDensity.compact,
                        label: const Text('Risk & Positions',
                            style: TextStyle(fontSize: 11)),
                        onPressed: () => _send(
                            'Review my open positions, floating PnL, and daily drawdown risk.'),
                      ),
                      const SizedBox(width: 6),
                      ActionChip(
                        visualDensity: VisualDensity.compact,
                        label: const Text('Draft Bot Strategy',
                            style: TextStyle(fontSize: 11)),
                        onPressed: () => _send(
                            'Design an automated rule-based bot strategy for ${widget.symbol} on ${widget.timeframe.code}.'),
                      ),
                      const SizedBox(width: 6),
                      ActionChip(
                        visualDensity: VisualDensity.compact,
                        label: const Text('Review Journal',
                            style: TextStyle(fontSize: 11)),
                        onPressed: () => _send(
                            'Review my recent journal notes and annotated trades to spot recurring mistakes or strengths.'),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                Expanded(
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final maxUserW = constraints.maxWidth * 0.78;
                      return ListView.builder(
                        controller: _scrollCtrl,
                        padding: const EdgeInsets.all(12),
                        itemCount: _messages.length,
                        itemBuilder: (ctx, i) {
                          final m = _messages[i];
                          final isUser = m.role == 'user';
                          final assistantBg = isDark
                              ? const Color(0xFF1E293B).withValues(alpha: 0.65)
                              : const Color(0xFFF8FAFC);
                          final userBg = isDark
                              ? const Color(0xFF2563EB).withValues(alpha: 0.24)
                              : const Color(0xFFDBEAFE);

                          return Align(
                            alignment: isUser
                                ? Alignment.centerRight
                                : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.all(12),
                              width: isUser ? null : double.infinity,
                              constraints: isUser
                                  ? BoxConstraints(maxWidth: maxUserW)
                                  : null,
                              decoration: BoxDecoration(
                                color: isUser ? userBg : assistantBg,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isUser
                                      ? const Color(0xFF3B82F6)
                                          .withValues(alpha: 0.35)
                                      : Theme.of(context).dividerColor,
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (!isUser &&
                                      (m.providerUsed ?? '').isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(bottom: 6),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.auto_awesome,
                                              size: 12,
                                              color: Color(0xFF22D3EE)),
                                          const SizedBox(width: 5),
                                          Text(
                                            m.providerUsed!,
                                            style: const TextStyle(
                                              fontSize: 10.5,
                                              fontWeight: FontWeight.w600,
                                              color: Color(0xFF22D3EE),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  if (isUser)
                                    SelectableText(
                                      m.content,
                                      style: const TextStyle(
                                          fontSize: 12.5, height: 1.42),
                                    )
                                  else
                                    MarkdownMessageView(
                                      data: m.content,
                                      baseFontSize: 12.5,
                                    ),
                                  if (m.actions.isNotEmpty &&
                                      widget.onExecuteAction != null) ...[
                                    const SizedBox(height: 10),
                                    Wrap(
                                      spacing: 6,
                                      runSpacing: 6,
                                      children: m.actions.map((act) {
                                        return FilledButton.tonalIcon(
                                          style: FilledButton.styleFrom(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 10, vertical: 6),
                                            minimumSize: Size.zero,
                                            tapTargetSize: MaterialTapTargetSize
                                                .shrinkWrap,
                                          ),
                                          onPressed: () =>
                                              widget.onExecuteAction!(act),
                                          icon: Icon(_iconForAction(act.type),
                                              size: 14),
                                          label: Text(
                                            act.label,
                                            style:
                                                const TextStyle(fontSize: 11),
                                          ),
                                        );
                                      }).toList(),
                                    ),
                                  ],
                                  if (!isUser && i > 0) ...[
                                    const SizedBox(height: 8),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.end,
                                      children: [
                                        TextButton.icon(
                                          style: TextButton.styleFrom(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 8, vertical: 2),
                                            minimumSize: Size.zero,
                                            tapTargetSize: MaterialTapTargetSize
                                                .shrinkWrap,
                                          ),
                                          onPressed: () {
                                            Clipboard.setData(
                                                ClipboardData(text: m.content));
                                            ScaffoldMessenger.of(context)
                                                .showSnackBar(
                                              const SnackBar(
                                                content: Text(
                                                    'Copied response to clipboard'),
                                                duration: Duration(seconds: 1),
                                              ),
                                            );
                                          },
                                          icon: const Icon(Icons.copy, size: 13),
                                          label: const Text('Copy',
                                              style: TextStyle(fontSize: 10.5)),
                                        ),
                                        if (widget.onSaveToJournal != null) ...[
                                          const SizedBox(width: 6),
                                          TextButton.icon(
                                            style: TextButton.styleFrom(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 8,
                                                      vertical: 2),
                                              minimumSize: Size.zero,
                                              tapTargetSize:
                                                  MaterialTapTargetSize
                                                      .shrinkWrap,
                                            ),
                                            onPressed: () =>
                                                widget.onSaveToJournal!(
                                              '${widget.symbol} ${widget.timeframe.code} · Copilot Note',
                                              m.content,
                                            ),
                                            icon: const Icon(
                                                Icons.bookmark_add_outlined,
                                                size: 13),
                                            label: const Text('Save to Journal',
                                                style:
                                                    TextStyle(fontSize: 10.5)),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
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
                          maxLines: 4,
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
          ),
        ),
      ],
    );
  }
}
