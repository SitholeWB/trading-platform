import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/trading_models.dart';
import '../../services/ai_copilot_service.dart';
import '../../services/localization_service.dart';
import '../widgets/markdown_message_view.dart';

class AiCopilotDrawer extends StatefulWidget {
  final AiCopilotService copilot;
  final String symbol;
  final Timeframe timeframe;
  final List<Candle> candles;
  final List<CopilotSession> sessions;
  final String activeSessionId;
  final ValueChanged<String> onSelectSession;
  final VoidCallback onNewSession;
  final ValueChanged<String> onDeleteSession;
  final void Function(
    String sessionId,
    List<ChatMessage> messages, {
    String? newTitle,
  }) onUpdateSession;
  final VoidCallback onClose;
  final VoidCallback? onOpenSettings;
  final bool isExpanded;
  final VoidCallback? onToggleExpand;
  final Future<void> Function(CopilotAction action)? onExecuteAction;
  final Future<void> Function(String title, String content)? onSaveToJournal;
  final String? pendingHelpPrompt;
  final String? pendingHelpContext;
  final int pendingHelpSeq;
  final String languageCode;

  const AiCopilotDrawer({
    super.key,
    required this.copilot,
    required this.symbol,
    required this.timeframe,
    required this.candles,
    required this.sessions,
    required this.activeSessionId,
    required this.onSelectSession,
    required this.onNewSession,
    required this.onDeleteSession,
    required this.onUpdateSession,
    required this.onClose,
    this.onOpenSettings,
    this.isExpanded = false,
    this.onToggleExpand,
    this.onExecuteAction,
    this.onSaveToJournal,
    this.pendingHelpPrompt,
    this.pendingHelpContext,
    this.pendingHelpSeq = 0,
    this.languageCode = 'en',
  });

  @override
  State<AiCopilotDrawer> createState() => _AiCopilotDrawerState();
}

class _AiCopilotDrawerState extends State<AiCopilotDrawer> {
  static const String _guideSessionId = 'copilot_section_guide';

  final _ctrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  bool _loading = false;
  double _width = 440;
  int _lastHelpSeq = 0;
  int? _pendingDeleteMsgIndex;
  bool _pendingDeleteSession = false;

  @override
  void initState() {
    super.initState();
    if (widget.pendingHelpSeq > 0 && widget.pendingHelpPrompt != null) {
      _lastHelpSeq = widget.pendingHelpSeq;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _send(
            widget.pendingHelpPrompt,
            widget.pendingHelpContext,
          );
        }
      });
    }
  }

  @override
  void didUpdateWidget(covariant AiCopilotDrawer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activeSessionId != widget.activeSessionId) {
      _pendingDeleteMsgIndex = null;
      _pendingDeleteSession = false;
    }
    if (widget.pendingHelpSeq > _lastHelpSeq &&
        widget.pendingHelpPrompt != null) {
      _lastHelpSeq = widget.pendingHelpSeq;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _send(
            widget.pendingHelpPrompt,
            widget.pendingHelpContext,
          );
        }
      });
    }
  }

  CopilotSession? get _activeSession {
    if (widget.sessions.isEmpty) return null;
    return widget.sessions.firstWhere(
      (s) => s.id == widget.activeSessionId,
      orElse: () => widget.sessions.first,
    );
  }

  List<ChatMessage> get _messages => _activeSession?.messages ?? const [];

  @override
  void dispose() {
    _ctrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _deleteMessageAt(int index) {
    final session = _activeSession;
    if (_loading ||
        session == null ||
        index < 0 ||
        index >= session.messages.length) {
      return;
    }
    final updated = List<ChatMessage>.from(session.messages)..removeAt(index);
    setState(() => _pendingDeleteMsgIndex = null);
    widget.onUpdateSession(session.id, updated);
  }

  Widget _buildInlineDeleteConfirm({
    required VoidCallback onConfirm,
    required VoidCallback onCancel,
    String? prompt,
  }) {
    final lang = widget.languageCode;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          prompt ?? AppL10n.t(lang, 'copilot.confirmDelete', 'Confirm Delete?'),
          style: const TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w600,
            color: Color(0xFFF87171),
          ),
        ),
        const SizedBox(width: 6),
        TextButton(
          style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            foregroundColor: const Color(0xFFEF4444),
          ),
          onPressed: onConfirm,
          child: Text(
            AppL10n.t(lang, 'copilot.yesDelete', 'Yes, delete'),
            style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700),
          ),
        ),
        const SizedBox(width: 2),
        TextButton(
          style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
          onPressed: onCancel,
          child: Text(AppL10n.t(lang, 'common.cancel', 'Cancel'),
              style: const TextStyle(fontSize: 10.5)),
        ),
      ],
    );
  }

  Future<void> _send([String? preset, String? extraContext]) async {
    final session = _activeSession;
    if (session == null) return;
    final text = (preset ?? _ctrl.text).trim();
    if (text.isEmpty || _loading) return;
    if (preset == null) _ctrl.clear();

    final historySnapshot = List<ChatMessage>.from(session.messages);
    final hasUserMsgBefore = historySnapshot.any((m) => m.role == 'user');
    final autoTitle =
        (session.id != _guideSessionId && !hasUserMsgBefore)
            ? (text.length > 42 ? '${text.substring(0, 42)}...' : text)
            : null;

    final withUser = [
      ...session.messages,
      ChatMessage(
        role: 'user',
        content: text,
        timestamp: DateTime.now().toUtc(),
      ),
    ];
    widget.onUpdateSession(session.id, withUser, newTitle: autoTitle);
    setState(() => _loading = true);
    _scrollToBottom();

    final reply = await widget.copilot.ask(
      prompt: text,
      symbol: widget.symbol,
      timeframe: widget.timeframe,
      candles: widget.candles,
      history: historySnapshot,
      extraContext: extraContext,
      languageCode: widget.languageCode,
    );

    if (!mounted) return;
    final currentMessages = _activeSession?.messages ?? withUser;
    final withAssistant = [
      ...currentMessages,
      ChatMessage(
        role: 'assistant',
        content: reply.content,
        providerUsed: reply.providerUsed,
        actions: reply.actions,
        timestamp: DateTime.now().toUtc(),
      ),
    ];
    widget.onUpdateSession(session.id, withAssistant);
    setState(() => _loading = false);
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

  Future<void> _saveEntireSession() async {
    final session = _activeSession;
    if (session == null || widget.onSaveToJournal == null) return;
    final buf = StringBuffer();
    buf.writeln('## AI Copilot Session: ${session.title}');
    buf.writeln(
        '**Context:** `${widget.symbol}` · `${widget.timeframe.code}`\n');
    for (final m in session.messages) {
      if (m.role == 'user') {
        buf.writeln('### Trader\n${m.content}\n');
      } else {
        final who =
            (m.providerUsed ?? '').isNotEmpty ? ' (${m.providerUsed})' : '';
        buf.writeln('### Copilot$who\n${m.content}\n');
      }
    }
    await widget.onSaveToJournal!(
      'Session: ${session.title}',
      buf.toString().trim(),
    );
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
    final session = _activeSession;

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
                  padding: const EdgeInsets.symmetric(horizontal: 10),
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
                            Text(
                              AppL10n.t(widget.languageCode, 'copilot.title',
                                  'AI Quant Copilot'),
                              style: const TextStyle(
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
                      PopupMenuButton<String>(
                        tooltip: 'Copilot Session History',
                        icon: const Icon(Icons.history, size: 18),
                        onSelected: (id) {
                          widget.onSelectSession(id);
                          _scrollToBottom();
                        },
                        itemBuilder: (_) => widget.sessions
                            .map((s) => PopupMenuItem<String>(
                                  value: s.id,
                                  child: Row(
                                    children: [
                                      Icon(
                                        s.id == _guideSessionId
                                            ? Icons.menu_book_outlined
                                            : (s.id == session?.id
                                                ? Icons.radio_button_checked
                                                : Icons.chat_bubble_outline),
                                        size: 14,
                                        color: s.id == _guideSessionId
                                            ? const Color(0xFFF59E0B)
                                            : (s.id == session?.id
                                                ? const Color(0xFF06B6D4)
                                                : null),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          s.title,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontSize: 12),
                                        ),
                                      ),
                                      if (s.id == _guideSessionId) ...[
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 5, vertical: 1),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF59E0B)
                                                .withValues(alpha: 0.18),
                                            borderRadius:
                                                BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            AppL10n.t(widget.languageCode,
                                                'copilot.guideBadge', 'Guide'),
                                            style: const TextStyle(
                                              fontSize: 9.5,
                                              fontWeight: FontWeight.w600,
                                              color: Color(0xFFF59E0B),
                                            ),
                                          ),
                                        ),
                                      ],
                                      const SizedBox(width: 6),
                                      Text(
                                        '${s.messages.length}',
                                        style: const TextStyle(
                                            fontSize: 10.5, color: Colors.grey),
                                      ),
                                    ],
                                  ),
                                ))
                            .toList(),
                      ),
                      IconButton(
                        tooltip: AppL10n.t(widget.languageCode,
                            'copilot.newSession', 'New Copilot Session'),
                        icon: const Icon(Icons.add_comment_outlined, size: 17),
                        onPressed: widget.onNewSession,
                      ),
                      if (widget.onSaveToJournal != null &&
                          _messages.length > 1)
                        IconButton(
                          tooltip: AppL10n.t(
                              widget.languageCode,
                              'copilot.saveSession',
                              'Save Entire Session to Journal'),
                          icon:
                              const Icon(Icons.library_add_outlined, size: 17),
                          onPressed: _saveEntireSession,
                        ),
                      if (widget.onToggleExpand != null)
                        IconButton(
                          tooltip: widget.isExpanded
                              ? AppL10n.t(widget.languageCode,
                                  'copilot.restore', 'Restore Side Panel')
                              : AppL10n.t(widget.languageCode,
                                  'copilot.expand', 'Expand Full Workspace'),
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
                          tooltip: AppL10n.t(widget.languageCode,
                              'copilot.switchAi', 'Switch AI Provider / Model'),
                          icon: const Icon(Icons.tune, size: 17),
                          onPressed: widget.onOpenSettings,
                        ),
                      if (session != null)
                        IconButton(
                          tooltip: AppL10n.t(
                              widget.languageCode,
                              'copilot.deleteSession',
                              'Delete Current Session'),
                          icon: const Icon(Icons.delete_outline, size: 17),
                          onPressed: () => setState(() {
                            _pendingDeleteSession = !_pendingDeleteSession;
                            _pendingDeleteMsgIndex = null;
                          }),
                        ),
                      IconButton(
                        tooltip: AppL10n.t(widget.languageCode,
                            'copilot.close', 'Close Copilot'),
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: widget.onClose,
                      ),
                    ],
                  ),
                ),
                if (session != null)
                  Container(
                    width: double.infinity,
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    color: isDark
                        ? const Color(0xFF0F172A).withValues(alpha: 0.6)
                        : const Color(0xFFF1F5F9),
                    child: Row(
                      children: [
                        Icon(
                          session.id == _guideSessionId
                              ? Icons.menu_book_outlined
                              : Icons.forum_outlined,
                          size: 12,
                          color: session.id == _guideSessionId
                              ? const Color(0xFFF59E0B)
                              : const Color(0xFF38BDF8),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            session.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 11, fontWeight: FontWeight.w500),
                          ),
                        ),
                        if (_pendingDeleteSession)
                          _buildInlineDeleteConfirm(
                            prompt: 'Confirm Delete?',
                            onConfirm: () {
                              setState(() => _pendingDeleteSession = false);
                              widget.onDeleteSession(session.id);
                            },
                            onCancel: () =>
                                setState(() => _pendingDeleteSession = false),
                          ),
                        Text(
                          '${widget.sessions.length} ${AppL10n.t(widget.languageCode, 'copilot.saved', 'saved')}',
                          style: const TextStyle(
                              fontSize: 10.5, color: Colors.grey),
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
                        label: Text(
                            '${AppL10n.t(widget.languageCode, 'copilot.analyze', 'Analyze')} ${widget.symbol}',
                            style: const TextStyle(fontSize: 11)),
                        onPressed: () => _send(
                            'Analyze ${widget.symbol} (${widget.timeframe.code}) structure, trend, and key levels.'),
                      ),
                      const SizedBox(width: 6),
                      ActionChip(
                        visualDensity: VisualDensity.compact,
                        label: Text(
                            AppL10n.t(widget.languageCode,
                                'copilot.tradeSetup', 'Trade Setup & Lots'),
                            style: const TextStyle(fontSize: 11)),
                        onPressed: () => _send(
                            'Suggest a complete ${widget.symbol} trade setup with ATR SL/TP and exact lot sizing for my risk profile.'),
                      ),
                      const SizedBox(width: 6),
                      ActionChip(
                        visualDensity: VisualDensity.compact,
                        label: Text(
                            AppL10n.t(widget.languageCode,
                                'copilot.riskPositions', 'Risk & Positions'),
                            style: const TextStyle(fontSize: 11)),
                        onPressed: () => _send(
                            'Review my open positions, floating PnL, and daily drawdown risk.'),
                      ),
                      const SizedBox(width: 6),
                      ActionChip(
                        visualDensity: VisualDensity.compact,
                        label: Text(
                            AppL10n.t(widget.languageCode,
                                'copilot.draftStrategy', 'Draft Bot Strategy'),
                            style: const TextStyle(fontSize: 11)),
                        onPressed: () => _send(
                            'Design an automated rule-based bot strategy for ${widget.symbol} on ${widget.timeframe.code}.'),
                      ),
                      const SizedBox(width: 6),
                      ActionChip(
                        visualDensity: VisualDensity.compact,
                        label: Text(
                            AppL10n.t(widget.languageCode,
                                'copilot.reviewJournal', 'Review Journal'),
                            style: const TextStyle(fontSize: 11)),
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
                                  if (isUser) ...[
                                    SelectableText(
                                      m.content,
                                      style: const TextStyle(
                                          fontSize: 12.5, height: 1.42),
                                    ),
                                    const SizedBox(height: 4),
                                    Align(
                                      alignment: Alignment.centerRight,
                                      child: _pendingDeleteMsgIndex == i
                                          ? _buildInlineDeleteConfirm(
                                              onConfirm: () =>
                                                  _deleteMessageAt(i),
                                              onCancel: () => setState(() =>
                                                  _pendingDeleteMsgIndex = null),
                                            )
                                          : IconButton(
                                              tooltip: 'Delete message',
                                              padding: EdgeInsets.zero,
                                              constraints: const BoxConstraints(
                                                minWidth: 22,
                                                minHeight: 22,
                                              ),
                                              visualDensity:
                                                  VisualDensity.compact,
                                              onPressed: _loading
                                                  ? null
                                                  : () => setState(() {
                                                        _pendingDeleteMsgIndex =
                                                            i;
                                                        _pendingDeleteSession =
                                                            false;
                                                      }),
                                              icon: Icon(
                                                Icons.delete_outline,
                                                size: 13,
                                                color: Theme.of(context)
                                                    .colorScheme
                                                    .onSurfaceVariant,
                                              ),
                                            ),
                                    ),
                                  ] else
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
                                  if (!isUser) ...[
                                    const SizedBox(height: 8),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.end,
                                      children: [
                                        if (i > 0) ...[
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
                                            onPressed: () {
                                              Clipboard.setData(ClipboardData(
                                                  text: m.content));
                                              ScaffoldMessenger.of(context)
                                                  .showSnackBar(
                                                const SnackBar(
                                                  content: Text(
                                                      'Copied response to clipboard'),
                                                  duration:
                                                      Duration(seconds: 1),
                                                ),
                                              );
                                            },
                                            icon: const Icon(Icons.copy,
                                                size: 13),
                                            label: Text(
                                                AppL10n.t(widget.languageCode,
                                                    'copilot.copy', 'Copy'),
                                                style: const TextStyle(
                                                    fontSize: 10.5)),
                                          ),
                                          if (widget.onSaveToJournal !=
                                              null) ...[
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
                                              label: Text(
                                                  AppL10n.t(
                                                      widget.languageCode,
                                                      'copilot.saveToJournal',
                                                      'Save to Journal'),
                                                  style: const TextStyle(
                                                      fontSize: 10.5)),
                                            ),
                                          ],
                                          const SizedBox(width: 6),
                                        ],
                                        if (_pendingDeleteMsgIndex == i)
                                          _buildInlineDeleteConfirm(
                                            onConfirm: () =>
                                                _deleteMessageAt(i),
                                            onCancel: () => setState(() =>
                                                _pendingDeleteMsgIndex = null),
                                          )
                                        else
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
                                              foregroundColor: Theme.of(context)
                                                  .colorScheme
                                                  .onSurfaceVariant,
                                            ),
                                            onPressed: _loading
                                                ? null
                                                : () => setState(() {
                                                      _pendingDeleteMsgIndex =
                                                          i;
                                                      _pendingDeleteSession =
                                                          false;
                                                    }),
                                            icon: const Icon(
                                                Icons.delete_outline,
                                                size: 13),
                                            label: Text(
                                                AppL10n.t(widget.languageCode,
                                                    'copilot.delete', 'Delete'),
                                                style: const TextStyle(
                                                    fontSize: 10.5)),
                                          ),
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
                          decoration: InputDecoration(
                            hintText: AppL10n.t(widget.languageCode,
                                'copilot.placeholder', 'Ask Copilot anything...'),
                            border: const OutlineInputBorder(),
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
