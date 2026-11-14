import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';
import '../../services/symbol_catalog.dart';
import '../widgets/markdown_message_view.dart';

class JournalPage extends StatefulWidget {
  final List<JournalEntry> entries;
  final List<Position> positions;
  final String activeSymbol;
  final Timeframe activeTimeframe;
  final double currentPrice;
  final ValueChanged<JournalEntry> onSaveEntry;
  final ValueChanged<String> onDeleteEntry;
  final void Function(String symbol, Timeframe tf) onOpenChart;
  final void Function(int ticket, String note, String setupTag, int? rating)?
      onUpdatePositionNote;

  const JournalPage({
    super.key,
    required this.entries,
    required this.positions,
    required this.activeSymbol,
    required this.activeTimeframe,
    required this.currentPrice,
    required this.onSaveEntry,
    required this.onDeleteEntry,
    required this.onOpenChart,
    this.onUpdatePositionNote,
  });

  static const List<String> tags = [
    'General',
    'Pre-Market',
    'Trade Review',
    'Breakout',
    'Mean Reversion',
    'Trend Continuation',
    'AI Copilot',
    'Mistake / Lesson',
  ];

  static const List<String> moods = [
    'Disciplined',
    'Focused',
    'Neutral',
    'Uncertain',
    'FOMO',
  ];

  static Future<JournalEntry?> showEntryEditorDialog(
    BuildContext context, {
    JournalEntry? existing,
    required String defaultSymbol,
    required Timeframe defaultTimeframe,
    double? defaultPrice,
  }) async {
    final titleCtrl = TextEditingController(text: existing?.title ?? '');
    final contentCtrl = TextEditingController(text: existing?.content ?? '');
    String sym = existing?.symbol.isNotEmpty == true
        ? existing!.symbol
        : defaultSymbol;
    Timeframe tf = existing?.timeframe ?? defaultTimeframe;
    String tag = tags.contains(existing?.tag) ? existing!.tag : 'General';
    String mood = moods.contains(existing?.mood) ? existing!.mood : 'Disciplined';

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.edit_note, color: Color(0xFF38BDF8)),
              const SizedBox(width: 8),
              Text(existing == null ? 'New Journal Note' : 'Edit Journal Note'),
            ],
          ),
          content: SizedBox(
            width: 520,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: titleCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Title',
                      hintText: 'e.g. London session breakout plan',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: SymbolCatalog.allSymbols
                                  .any((s) => s.symbol == sym)
                              ? sym
                              : 'EURUSD',
                          decoration: const InputDecoration(
                            labelText: 'Symbol',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          items: SymbolCatalog.allSymbols
                              .map((s) => DropdownMenuItem(
                                    value: s.symbol,
                                    child: Text(s.symbol,
                                        style: const TextStyle(fontSize: 12.5)),
                                  ))
                              .toList(),
                          onChanged: (v) {
                            if (v != null) setDialogState(() => sym = v);
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 110,
                        child: DropdownButtonFormField<Timeframe>(
                          initialValue: tf,
                          decoration: const InputDecoration(
                            labelText: 'Timeframe',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          items: Timeframe.values
                              .map((t) => DropdownMenuItem(
                                    value: t,
                                    child: Text(t.code,
                                        style: const TextStyle(fontSize: 12.5)),
                                  ))
                              .toList(),
                          onChanged: (v) {
                            if (v != null) setDialogState(() => tf = v);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: tag,
                          decoration: const InputDecoration(
                            labelText: 'Category / Tag',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          items: tags
                              .map((t) => DropdownMenuItem(
                                    value: t,
                                    child: Text(t,
                                        style: const TextStyle(fontSize: 12.5)),
                                  ))
                              .toList(),
                          onChanged: (v) {
                            if (v != null) setDialogState(() => tag = v);
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: mood,
                          decoration: const InputDecoration(
                            labelText: 'Mindset / Discipline',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          items: moods
                              .map((m) => DropdownMenuItem(
                                    value: m,
                                    child: Text(m,
                                        style: const TextStyle(fontSize: 12.5)),
                                  ))
                              .toList(),
                          onChanged: (v) {
                            if (v != null) setDialogState(() => mood = v);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: contentCtrl,
                    minLines: 5,
                    maxLines: 10,
                    decoration: const InputDecoration(
                      labelText: 'Notes, Thesis & Observations',
                      alignLabelWithHint: true,
                      hintText:
                          'Record entry rationale, key levels, invalidation, or post-trade lessons...',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton.icon(
              onPressed: () => Navigator.of(ctx).pop(true),
              icon: const Icon(Icons.save, size: 16),
              label: const Text('Save Note'),
            ),
          ],
        ),
      ),
    );

    if (ok != true) return null;
    final now = DateTime.now().toUtc();
    final title = titleCtrl.text.trim().isEmpty
        ? '$sym ${tf.code} · $tag'
        : titleCtrl.text.trim();
    if (existing != null) {
      return existing.copyWith(
        title: title,
        content: contentCtrl.text.trim(),
        symbol: sym,
        timeframe: tf,
        tag: tag,
        mood: mood,
        updatedAt: now,
      );
    }
    return JournalEntry(
      id: 'note_${now.millisecondsSinceEpoch}',
      title: title,
      content: contentCtrl.text.trim(),
      symbol: sym,
      timeframe: tf,
      tag: tag,
      mood: mood,
      priceAtNote: defaultPrice,
      createdAt: now,
      updatedAt: now,
    );
  }

  @override
  State<JournalPage> createState() => _JournalPageState();
}

class _JournalPageState extends State<JournalPage> {
  String _search = '';
  String _filterTag = 'All';
  int _tabIndex = 0; // 0 = Journal Notes, 1 = Trade Reviews & Tag Stats

  // Split-pane selection & inline full-space editor state
  String? _selectedEntryId;
  bool _isEditing = false;
  JournalEntry? _editingOriginal;
  int _editorMode = 1; // 0 = Write, 1 = Split, 2 = Preview
  late final TextEditingController _titleCtrl;
  late final TextEditingController _contentCtrl;
  String _editSymbol = 'EURUSD';
  Timeframe _editTimeframe = Timeframe.m15;
  String _editTag = 'General';
  String _editMood = 'Disciplined';

  @override
  void initState() {
    super.initState();
    _titleCtrl = TextEditingController();
    _contentCtrl = TextEditingController();
    _editSymbol = widget.activeSymbol;
    _editTimeframe = widget.activeTimeframe;
    if (widget.entries.isNotEmpty) {
      final sorted = List<JournalEntry>.from(widget.entries)
        ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
      _selectedEntryId = sorted.first.id;
    }
  }

  @override
  void didUpdateWidget(covariant JournalPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!_isEditing &&
        (_selectedEntryId == null ||
            !widget.entries.any((e) => e.id == _selectedEntryId))) {
      if (widget.entries.isNotEmpty) {
        final sorted = List<JournalEntry>.from(widget.entries)
          ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
        _selectedEntryId = sorted.first.id;
      } else {
        _selectedEntryId = null;
      }
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _contentCtrl.dispose();
    super.dispose();
  }

  void _startInlineEditor([JournalEntry? existing]) {
    setState(() {
      _tabIndex = 0;
      _isEditing = true;
      _editingOriginal = existing;
      _titleCtrl.text = existing?.title ?? '';
      _contentCtrl.text = existing?.content ?? '';
      _editSymbol = existing?.symbol.isNotEmpty == true
          ? existing!.symbol
          : widget.activeSymbol;
      _editTimeframe = existing?.timeframe ?? widget.activeTimeframe;
      _editTag = JournalPage.tags.contains(existing?.tag)
          ? existing!.tag
          : 'General';
      _editMood = JournalPage.moods.contains(existing?.mood)
          ? existing!.mood
          : 'Disciplined';
      if (existing != null) {
        _selectedEntryId = existing.id;
      }
    });
  }

  void _cancelInlineEditor() {
    setState(() {
      _isEditing = false;
      _editingOriginal = null;
    });
  }

  void _saveInlineEditor() {
    final now = DateTime.now().toUtc();
    final title = _titleCtrl.text.trim().isEmpty
        ? '$_editSymbol ${_editTimeframe.code} Note'
        : _titleCtrl.text.trim();
    final content = _contentCtrl.text.trim();
    final existing = _editingOriginal;

    final entry = existing != null
        ? existing.copyWith(
            title: title,
            content: content,
            symbol: _editSymbol,
            timeframe: _editTimeframe,
            tag: _editTag,
            mood: _editMood,
            updatedAt: now,
          )
        : JournalEntry(
            id: 'note_${now.millisecondsSinceEpoch}',
            title: title,
            content: content,
            symbol: _editSymbol,
            timeframe: _editTimeframe,
            tag: _editTag,
            mood: _editMood,
            priceAtNote: widget.currentPrice > 0 ? widget.currentPrice : null,
            createdAt: now,
            updatedAt: now,
          );

    widget.onSaveEntry(entry);
    setState(() {
      _isEditing = false;
      _editingOriginal = null;
      _selectedEntryId = entry.id;
    });
  }

  void _insertMarkdownSnippet(String snippet) {
    final text = _contentCtrl.text;
    final sel = _contentCtrl.selection;
    final start = sel.isValid ? sel.start : text.length;
    final end = sel.isValid ? sel.end : text.length;
    final updated = text.replaceRange(start, end, snippet);
    _contentCtrl.value = TextEditingValue(
      text: updated,
      selection: TextSelection.collapsed(offset: start + snippet.length),
    );
    setState(() {});
  }

  Future<void> _editPositionNote(Position p) async {
    if (widget.onUpdatePositionNote == null) return;
    final noteCtrl = TextEditingController(text: p.note);
    String setupTag =
        p.setupTag.isNotEmpty ? p.setupTag : 'Trend Continuation';
    int? rating = p.rating ?? 4;

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text('Trade Note · ${p.symbol} (#${p.ticket})'),
          content: SizedBox(
            width: 420,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: JournalPage.tags.contains(setupTag)
                      ? setupTag
                      : 'General',
                  decoration: const InputDecoration(
                    labelText: 'Setup Tag',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  items: JournalPage.tags
                      .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) setDialogState(() => setupTag = v);
                  },
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Text('Execution Rating:',
                        style: TextStyle(fontSize: 12.5)),
                    const SizedBox(width: 8),
                    for (int star = 1; star <= 5; star++)
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(minWidth: 28),
                        icon: Icon(
                          (rating ?? 0) >= star
                              ? Icons.star
                              : Icons.star_border,
                          color: const Color(0xFFF59E0B),
                          size: 20,
                        ),
                        onPressed: () => setDialogState(() => rating = star),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: noteCtrl,
                  minLines: 4,
                  maxLines: 7,
                  decoration: const InputDecoration(
                    labelText: 'Trade Review / Lesson Learned',
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );

    if (ok == true) {
      widget.onUpdatePositionNote!(
        p.ticket,
        noteCtrl.text.trim(),
        setupTag,
        rating,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredEntries = widget.entries.where((e) {
      if (_filterTag != 'All' && e.tag != _filterTag) return false;
      if (_search.isNotEmpty) {
        final q = _search.toLowerCase();
        return e.title.toLowerCase().contains(q) ||
            e.content.toLowerCase().contains(q) ||
            e.symbol.toLowerCase().contains(q) ||
            e.tag.toLowerCase().contains(q);
      }
      return true;
    }).toList()
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));

    return Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              SegmentedButton<int>(
                segments: const [
                  ButtonSegment(
                    value: 0,
                    icon: Icon(Icons.notes, size: 16),
                    label: Text('Journal Notes'),
                  ),
                  ButtonSegment(
                    value: 1,
                    icon: Icon(Icons.rate_review_outlined, size: 16),
                    label: Text('Trade Reviews & Tag Stats'),
                  ),
                ],
                selected: {_tabIndex},
                onSelectionChanged: (s) => setState(() => _tabIndex = s.first),
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: () => _startInlineEditor(),
                icon: const Icon(Icons.add, size: 16),
                label: const Text('New Note'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: _tabIndex == 0
                ? _buildNotesList(context, filteredEntries)
                : _buildTradeReviewsBody(context),
          ),
        ],
      ),
    );
  }

  Widget _buildNotesList(BuildContext context, List<JournalEntry> list) {
    JournalEntry? selected;
    if (!_isEditing && list.isNotEmpty) {
      selected = list.firstWhere(
        (e) => e.id == _selectedEntryId,
        orElse: () => list.first,
      );
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Left Side Menu: Search, Tag Filter, Selectable Note List
        SizedBox(
          width: 310,
          child: Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    onChanged: (v) => setState(() => _search = v.trim()),
                    decoration: const InputDecoration(
                      hintText: 'Search notes...',
                      prefixIcon: Icon(Icons.search, size: 16),
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: _filterTag,
                    isDense: true,
                    decoration: const InputDecoration(
                      labelText: 'Filter by Tag',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: ['All', ...JournalPage.tags]
                        .map((t) => DropdownMenuItem(
                              value: t,
                              child: Text(t, style: const TextStyle(fontSize: 12)),
                            ))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => _filterTag = v);
                    },
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${list.length} Note${list.length == 1 ? '' : 's'}',
                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                  const SizedBox(height: 6),
                  Expanded(
                    child: list.isEmpty
                        ? Center(
                            child: Text(
                              widget.entries.isEmpty
                                  ? 'No notes yet.\nClick "New Note" to start.'
                                  : 'No matching notes.',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                  fontSize: 12, color: Colors.grey),
                            ),
                          )
                        : ListView.separated(
                            itemCount: list.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 6),
                            itemBuilder: (ctx, i) {
                              final e = list[i];
                              final isSel =
                                  !_isEditing && selected?.id == e.id;
                              final stamp = e.updatedAt
                                  .toLocal()
                                  .toIso8601String()
                                  .substring(5, 16)
                                  .replaceFirst('T', ' ');
                              return InkWell(
                                borderRadius: BorderRadius.circular(8),
                                onTap: () => setState(() {
                                  _isEditing = false;
                                  _editingOriginal = null;
                                  _selectedEntryId = e.id;
                                }),
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(8),
                                    color: isSel
                                        ? const Color(0xFF38BDF8)
                                            .withValues(alpha: 0.12)
                                        : Colors.transparent,
                                    border: Border.all(
                                      color: isSel
                                          ? const Color(0xFF38BDF8)
                                          : Colors.white12,
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        e.title,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 12.5,
                                          color: isSel
                                              ? const Color(0xFF38BDF8)
                                              : null,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          if (e.symbol.isNotEmpty) ...[
                                            Text(
                                              '${e.symbol} ${e.timeframe.code}',
                                              style: const TextStyle(
                                                fontSize: 10.5,
                                                fontFamily: 'monospace',
                                                color: Color(0xFF94A3B8),
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                          ],
                                          Expanded(
                                            child: Text(
                                              e.tag,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                  fontSize: 10.5,
                                                  color: Colors.grey),
                                            ),
                                          ),
                                          Text(
                                            stamp,
                                            style: const TextStyle(
                                                fontSize: 10,
                                                color: Colors.grey),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Right Workspace: Full-Space Inline Editor OR Selected Note Reader
        Expanded(
          child: _isEditing
              ? _buildInlineEditor(context)
              : selected == null
                  ? Card(
                      margin: EdgeInsets.zero,
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.edit_note,
                                size: 46, color: Color(0xFF38BDF8)),
                            const SizedBox(height: 10),
                            const Text(
                              'Trading Journal Workspace',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Select a note on the left to read it in Markdown, or create a new full-page note.',
                              style:
                                  TextStyle(color: Colors.grey, fontSize: 12.5),
                            ),
                            const SizedBox(height: 14),
                            FilledButton.icon(
                              onPressed: () => _startInlineEditor(),
                              icon: const Icon(Icons.add, size: 16),
                              label: const Text('Write First Note'),
                            ),
                          ],
                        ),
                      ),
                    )
                  : _buildNoteReader(context, selected),
        ),
      ],
    );
  }

  Widget _buildNoteReader(BuildContext context, JournalEntry e) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    e.title,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ),
                OutlinedButton.icon(
                  onPressed: () => _startInlineEditor(e),
                  icon: const Icon(Icons.edit_outlined, size: 16),
                  label: const Text('Edit'),
                ),
                const SizedBox(width: 8),
                IconButton(
                  tooltip: 'Delete Note',
                  icon: const Icon(Icons.delete_outline,
                      size: 19, color: Colors.redAccent),
                  onPressed: () => widget.onDeleteEntry(e.id),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                if (e.symbol.isNotEmpty)
                  ActionChip(
                    visualDensity: VisualDensity.compact,
                    label: Text(
                      '${e.symbol} ${e.timeframe.code}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    onPressed: () => widget.onOpenChart(e.symbol, e.timeframe),
                  ),
                Chip(
                  visualDensity: VisualDensity.compact,
                  label: Text(e.tag, style: const TextStyle(fontSize: 11)),
                ),
                Chip(
                  visualDensity: VisualDensity.compact,
                  label: Text(e.mood,
                      style: const TextStyle(
                          fontSize: 11, color: Color(0xFF94A3B8))),
                ),
                if (e.priceAtNote != null && e.symbol.isNotEmpty)
                  Text(
                    '@ ${IndicatorEngine.formatPrice(e.priceAtNote!, e.symbol)}',
                    style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 11.5,
                        color: Colors.grey),
                  ),
                Text(
                  'Updated ${e.updatedAt.toLocal().toIso8601String().substring(0, 16).replaceFirst('T', ' ')}',
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ],
            ),
            const Divider(height: 22),
            Expanded(
              child: e.content.trim().isEmpty
                  ? const Center(
                      child: Text(
                        'This note has no body yet. Click Edit to add markdown notes.',
                        style: TextStyle(color: Colors.grey),
                      ),
                    )
                  : SingleChildScrollView(
                      child: MarkdownMessageView(
                        data: e.content,
                        baseFontSize: 13,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInlineEditor(BuildContext context) {
    final safeSym = SymbolCatalog.allSymbols.any((s) => s.symbol == _editSymbol)
        ? _editSymbol
        : 'EURUSD';

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Icon(Icons.edit_note, color: Color(0xFF38BDF8), size: 20),
                const SizedBox(width: 8),
                Text(
                  _editingOriginal == null
                      ? 'New Journal Note'
                      : 'Editing: ${_editingOriginal!.title}',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 15),
                ),
                const Spacer(),
                SegmentedButton<int>(
                  segments: const [
                    ButtonSegment(value: 0, label: Text('Write')),
                    ButtonSegment(value: 1, label: Text('Split')),
                    ButtonSegment(value: 2, label: Text('Preview')),
                  ],
                  selected: {_editorMode},
                  onSelectionChanged: (s) =>
                      setState(() => _editorMode = s.first),
                ),
                const SizedBox(width: 10),
                TextButton(
                  onPressed: _cancelInlineEditor,
                  child: const Text('Cancel'),
                ),
                const SizedBox(width: 6),
                FilledButton.icon(
                  onPressed: _saveInlineEditor,
                  icon: const Icon(Icons.save_outlined, size: 16),
                  label: const Text('Save Note'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  flex: 3,
                  child: TextField(
                    controller: _titleCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Title',
                      hintText: 'e.g. London Session EURUSD Breakout Plan',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 120,
                  child: DropdownButtonFormField<String>(
                    initialValue: safeSym,
                    decoration: const InputDecoration(
                      labelText: 'Symbol',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: SymbolCatalog.allSymbols
                        .map((s) => DropdownMenuItem(
                              value: s.symbol,
                              child: Text(s.symbol,
                                  style: const TextStyle(fontSize: 12)),
                            ))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => _editSymbol = v);
                    },
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 88,
                  child: DropdownButtonFormField<Timeframe>(
                    initialValue: _editTimeframe,
                    decoration: const InputDecoration(
                      labelText: 'TF',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: Timeframe.values
                        .map((t) => DropdownMenuItem(
                              value: t,
                              child: Text(t.code,
                                  style: const TextStyle(fontSize: 12)),
                            ))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => _editTimeframe = v);
                    },
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 145,
                  child: DropdownButtonFormField<String>(
                    initialValue: _editTag,
                    decoration: const InputDecoration(
                      labelText: 'Tag',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: JournalPage.tags
                        .map((t) => DropdownMenuItem(
                              value: t,
                              child:
                                  Text(t, style: const TextStyle(fontSize: 12)),
                            ))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => _editTag = v);
                    },
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 125,
                  child: DropdownButtonFormField<String>(
                    initialValue: _editMood,
                    decoration: const InputDecoration(
                      labelText: 'Mood',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: JournalPage.moods
                        .map((m) => DropdownMenuItem(
                              value: m,
                              child:
                                  Text(m, style: const TextStyle(fontSize: 12)),
                            ))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => _editMood = v);
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: [
                ActionChip(
                  visualDensity: VisualDensity.compact,
                  label: const Text('## Heading', style: TextStyle(fontSize: 11)),
                  onPressed: () => _insertMarkdownSnippet('\n## '),
                ),
                ActionChip(
                  visualDensity: VisualDensity.compact,
                  label: const Text('**Bold**', style: TextStyle(fontSize: 11)),
                  onPressed: () => _insertMarkdownSnippet('**bold**'),
                ),
                ActionChip(
                  visualDensity: VisualDensity.compact,
                  label: const Text('- Bullet', style: TextStyle(fontSize: 11)),
                  onPressed: () => _insertMarkdownSnippet('\n- '),
                ),
                ActionChip(
                  visualDensity: VisualDensity.compact,
                  label: const Text('> Callout', style: TextStyle(fontSize: 11)),
                  onPressed: () => _insertMarkdownSnippet('\n> '),
                ),
                ActionChip(
                  visualDensity: VisualDensity.compact,
                  label: const Text('Pre-Market Template',
                      style: TextStyle(fontSize: 11)),
                  onPressed: () => _insertMarkdownSnippet(
                    '## Pre-Market Plan\n- **Bias:** \n- **Key Levels:** \n- **Invalidation:** \n- **Risk Plan:** 1.0%\n',
                  ),
                ),
                ActionChip(
                  visualDensity: VisualDensity.compact,
                  label: const Text('Trade Review Template',
                      style: TextStyle(fontSize: 11)),
                  onPressed: () => _insertMarkdownSnippet(
                    '## Trade Review\n- **Setup:** \n- **What Worked:** \n- **Lesson Learned:** \n',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Expanded(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_editorMode == 0 || _editorMode == 1)
                    Expanded(
                      child: TextField(
                        controller: _contentCtrl,
                        expands: true,
                        maxLines: null,
                        minLines: null,
                        textAlignVertical: TextAlignVertical.top,
                        onChanged: (_) => setState(() {}),
                        style: const TextStyle(
                            fontFamily: 'monospace', fontSize: 13),
                        decoration: const InputDecoration(
                          hintText:
                              'Write your analysis, trade plan, or lesson learned in Markdown...',
                          border: OutlineInputBorder(),
                          alignLabelWithHint: true,
                        ),
                      ),
                    ),
                  if (_editorMode == 1) const SizedBox(width: 12),
                  if (_editorMode == 1 || _editorMode == 2)
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.white12),
                          borderRadius: BorderRadius.circular(6),
                          color: Colors.black12,
                        ),
                        child: _contentCtrl.text.trim().isEmpty
                            ? const Text(
                                'Live Markdown preview will appear here...',
                                style: TextStyle(
                                    color: Colors.grey, fontSize: 12.5),
                              )
                            : SingleChildScrollView(
                                child: MarkdownMessageView(
                                  data: _contentCtrl.text,
                                  baseFontSize: 13,
                                ),
                              ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTradeReviewsBody(BuildContext context) {
    final tagged = widget.positions
        .where((p) => p.setupTag.isNotEmpty)
        .toList();
    final byTag = <String, List<Position>>{};
    for (final p in tagged) {
      byTag.putIfAbsent(p.setupTag, () => []).add(p);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (byTag.isNotEmpty) ...[
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Setup Tag Performance',
                    style:
                        TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: byTag.entries.map((e) {
                      final closed =
                          e.value.where((p) => !p.isOpen).toList();
                      final wins =
                          closed.where((p) => p.realizedPnl >= 0).length;
                      final wr = closed.isEmpty
                          ? 0.0
                          : (wins / closed.length) * 100;
                      final net = e.value.fold<double>(
                        0.0,
                        (s, p) =>
                            s + (p.isOpen ? p.unrealizedPnl : p.realizedPnl),
                      );
                      final c = net >= 0
                          ? const Color(0xFF10B981)
                          : const Color(0xFFEF4444);
                      return Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                              color: Theme.of(context).dividerColor),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(e.key,
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12)),
                            const SizedBox(height: 2),
                            Text(
                              '${e.value.length} trades · Win ${wr.toStringAsFixed(0)}% · ${net >= 0 ? "+" : "-"}\$${net.abs().toStringAsFixed(2)}',
                              style: TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 11.5,
                                  color: c),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
        ],
        Expanded(
          child: Card(
            margin: EdgeInsets.zero,
            child: widget.positions.isEmpty
                ? const Center(
                    child: Text(
                      'No demo trades recorded yet. Annotate any open or closed trade here.',
                      style: TextStyle(color: Colors.grey),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(10),
                    itemCount: widget.positions.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (ctx, i) {
                      final p = widget.positions[i];
                      final pnl = p.isOpen ? p.unrealizedPnl : p.realizedPnl;
                      final c = pnl >= 0
                          ? const Color(0xFF10B981)
                          : const Color(0xFFEF4444);
                      return ListTile(
                        dense: true,
                        title: Row(
                          children: [
                            Text(
                              '${p.orderType.toUpperCase()} ${p.symbol} · ${p.lots.toStringAsFixed(2)} lots (${p.status})',
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'monospace',
                                  fontSize: 12.5),
                            ),
                            if (p.setupTag.isNotEmpty) ...[
                              const SizedBox(width: 8),
                              Chip(
                                visualDensity: VisualDensity.compact,
                                label: Text(p.setupTag,
                                    style: const TextStyle(fontSize: 10)),
                              ),
                            ],
                            if (p.rating != null) ...[
                              const SizedBox(width: 6),
                              Text('★' * p.rating!,
                                  style: const TextStyle(
                                      color: Color(0xFFF59E0B), fontSize: 11)),
                            ],
                          ],
                        ),
                        subtitle: Text(
                          p.note.isNotEmpty
                              ? p.note
                              : 'No trade note yet — click Edit to add review & setup tag.',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 11.5,
                            color: p.note.isNotEmpty ? null : Colors.grey,
                          ),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '${pnl >= 0 ? "+" : "-"}\$${pnl.abs().toStringAsFixed(2)}',
                              style: TextStyle(
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.bold,
                                  color: c),
                            ),
                            const SizedBox(width: 8),
                            OutlinedButton.icon(
                              onPressed: () => _editPositionNote(p),
                              icon: const Icon(Icons.edit_note, size: 16),
                              label: Text(p.note.isEmpty ? 'Add Note' : 'Edit'),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ),
      ],
    );
  }
}
