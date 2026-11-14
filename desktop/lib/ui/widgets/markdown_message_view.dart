import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Renders GitHub-style Markdown (headings, bold, italic, inline code,
/// fenced code blocks with copy button, blockquotes, lists, tables, and rules)
/// with selectable text and theme-aware styling.
class MarkdownMessageView extends StatelessWidget {
  final String data;
  final double baseFontSize;

  const MarkdownMessageView({
    super.key,
    required this.data,
    this.baseFontSize = 12.5,
  });

  @override
  Widget build(BuildContext context) {
    final blocks = _parseBlocks(data);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (int i = 0; i < blocks.length; i++) ...[
          _buildBlock(context, blocks[i]),
          if (i < blocks.length - 1) const SizedBox(height: 6),
        ],
      ],
    );
  }

  Widget _buildBlock(BuildContext context, _MdBlock block) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? const Color(0xFFE2E8F0) : const Color(0xFF0F172A);
    final mutedColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569);

    switch (block.type) {
      case _MdBlockType.heading:
        final size = switch (block.level) {
          1 => baseFontSize + 5,
          2 => baseFontSize + 3.5,
          3 => baseFontSize + 2,
          4 => baseFontSize + 1,
          5 => baseFontSize + 0.5,
          _ => baseFontSize,
        };
        return Padding(
          padding: const EdgeInsets.only(top: 4, bottom: 2),
          child: SelectableText.rich(
            TextSpan(
              children: _parseInline(
                block.text,
                TextStyle(
                  fontSize: size,
                  fontWeight: FontWeight.bold,
                  color: block.level >= 5
                      ? (isDark
                          ? const Color(0xFF38BDF8)
                          : const Color(0xFF0284C7))
                      : textColor,
                  height: 1.35,
                ),
                isDark,
              ),
            ),
          ),
        );

      case _MdBlockType.codeBlock:
        return Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0B1120) : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isDark
                  ? const Color(0xFF1E293B)
                  : const Color(0xFFCBD5E1),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF111827)
                      : const Color(0xFFE2E8F0),
                  borderRadius:
                      const BorderRadius.vertical(top: Radius.circular(7)),
                ),
                child: Row(
                  children: [
                    Text(
                      block.lang.isEmpty ? 'code' : block.lang,
                      style: TextStyle(
                        fontSize: 10,
                        fontFamily: 'monospace',
                        color: mutedColor,
                      ),
                    ),
                    const Spacer(),
                    InkWell(
                      onTap: () {
                        Clipboard.setData(ClipboardData(text: block.text));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Code copied to clipboard'),
                            duration: Duration(seconds: 1),
                          ),
                        );
                      },
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.copy, size: 12, color: mutedColor),
                          const SizedBox(width: 4),
                          Text('Copy',
                              style:
                                  TextStyle(fontSize: 10, color: mutedColor)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.all(10),
                child: SelectableText(
                  block.text,
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: baseFontSize - 0.8,
                    color: textColor,
                    height: 1.45,
                  ),
                ),
              ),
            ],
          ),
        );

      case _MdBlockType.blockquote:
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(10, 6, 8, 6),
          decoration: BoxDecoration(
            color: const Color(0xFF06B6D4).withValues(alpha: 0.08),
            border: const Border(
              left: BorderSide(color: Color(0xFF06B6D4), width: 3),
            ),
            borderRadius:
                const BorderRadius.horizontal(right: Radius.circular(6)),
          ),
          child: SelectableText.rich(
            TextSpan(
              children: _parseInline(
                block.text,
                TextStyle(
                  fontSize: baseFontSize,
                  color: mutedColor,
                  fontStyle: FontStyle.italic,
                  height: 1.42,
                ),
                isDark,
              ),
            ),
          ),
        );

      case _MdBlockType.bulletItem:
        return Padding(
          padding: EdgeInsets.only(left: (block.level * 12).toDouble()),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 2, right: 7),
                child: Text(
                  block.marker.isEmpty ? '•' : block.marker,
                  style: TextStyle(
                    fontSize: baseFontSize,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF38BDF8),
                  ),
                ),
              ),
              Expanded(
                child: SelectableText.rich(
                  TextSpan(
                    children: _parseInline(
                      block.text,
                      TextStyle(
                        fontSize: baseFontSize,
                        color: textColor,
                        height: 1.45,
                      ),
                      isDark,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );

      case _MdBlockType.divider:
        return Divider(
          height: 10,
          color: Theme.of(context).dividerColor,
        );

      case _MdBlockType.table:
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Table(
            defaultColumnWidth: const IntrinsicColumnWidth(),
            border: TableBorder.all(
              color: Theme.of(context).dividerColor,
              borderRadius: BorderRadius.circular(6),
            ),
            children: [
              for (int r = 0; r < block.rows.length; r++)
                TableRow(
                  decoration: r == 0
                      ? BoxDecoration(
                          color: isDark
                              ? const Color(0xFF1E293B)
                              : const Color(0xFFE2E8F0),
                        )
                      : null,
                  children: [
                    for (final cell in block.rows[r])
                      Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 6),
                        child: SelectableText.rich(
                          TextSpan(
                            children: _parseInline(
                              cell,
                              TextStyle(
                                fontSize: baseFontSize - 0.5,
                                fontWeight: r == 0
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                                color: textColor,
                              ),
                              isDark,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
            ],
          ),
        );

      case _MdBlockType.paragraph:
        return SelectableText.rich(
          TextSpan(
            children: _parseInline(
              block.text,
              TextStyle(
                fontSize: baseFontSize,
                color: textColor,
                height: 1.48,
              ),
              isDark,
            ),
          ),
        );
    }
  }

  List<_MdBlock> _parseBlocks(String raw) {
    final lines = raw.replaceAll('\r\n', '\n').split('\n');
    final blocks = <_MdBlock>[];
    int i = 0;

    while (i < lines.length) {
      final line = lines[i];
      final trimmed = line.trim();

      if (trimmed.isEmpty) {
        i++;
        continue;
      }

      // Fenced code block
      if (trimmed.startsWith('```')) {
        final lang = trimmed.substring(3).trim();
        final codeLines = <String>[];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.add(lines[i]);
          i++;
        }
        if (i < lines.length) i++;
        blocks.add(_MdBlock(
          type: _MdBlockType.codeBlock,
          text: codeLines.join('\n'),
          lang: lang,
        ));
        continue;
      }

      // Horizontal rule
      if (RegExp(r'^(-{3,}|\*{3,}|_{3,})$').hasMatch(trimmed)) {
        blocks.add(const _MdBlock(type: _MdBlockType.divider));
        i++;
        continue;
      }

      // Heading (H1 - H6)
      final hMatch = RegExp(r'^(#{1,6})\s+(.+)$').firstMatch(trimmed);
      if (hMatch != null) {
        blocks.add(_MdBlock(
          type: _MdBlockType.heading,
          level: hMatch.group(1)!.length,
          text: hMatch.group(2)!.trim(),
        ));
        i++;
        continue;
      }

      // Table (| col | col |)
      if (trimmed.startsWith('|') &&
          i + 1 < lines.length &&
          RegExp(r'^\|?[\s:|-]+\|').hasMatch(lines[i + 1].trim())) {
        final rows = <List<String>>[];
        List<String> splitRow(String row) {
          var inner = row.trim();
          if (inner.startsWith('|')) inner = inner.substring(1);
          if (inner.endsWith('|')) inner = inner.substring(0, inner.length - 1);
          return inner.split('|').map((c) => c.trim()).toList();
        }

        rows.add(splitRow(trimmed));
        i += 2; // skip header + separator
        while (i < lines.length) {
          final r = lines[i].trim();
          if (r.startsWith('|')) {
            rows.add(splitRow(r));
            i++;
          } else {
            break;
          }
        }
        blocks.add(_MdBlock(type: _MdBlockType.table, rows: rows));
        continue;
      }

      // Blockquote
      if (trimmed.startsWith('>')) {
        final qLines = <String>[];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          qLines.add(lines[i].trim().replaceFirst(RegExp(r'^>\s?'), ''));
          i++;
        }
        blocks.add(_MdBlock(
          type: _MdBlockType.blockquote,
          text: qLines.join('\n'),
        ));
        continue;
      }

      // Bullet, task, or numbered list item
      final bulletMatch =
          RegExp(r'^(\s*)([-*+•]|\d+\.)\s+(\[[ xX]\]\s+)?(.+)$')
              .firstMatch(line);
      if (bulletMatch != null) {
        final indent = (bulletMatch.group(1)!.length / 2).floor().clamp(0, 3);
        final rawMarker = bulletMatch.group(2)!;
        final task = bulletMatch.group(3);
        final marker = task != null
            ? (task.toLowerCase().contains('x') ? '☑' : '☐')
            : ((rawMarker == '-' || rawMarker == '*' || rawMarker == '+')
                ? '•'
                : rawMarker);
        blocks.add(_MdBlock(
          type: _MdBlockType.bulletItem,
          level: indent,
          marker: marker,
          text: bulletMatch.group(4)!.trim(),
        ));
        i++;
        continue;
      }

      // Paragraph: group consecutive plain lines
      final pLines = <String>[];
      while (i < lines.length) {
        final cur = lines[i];
        final curT = cur.trim();
        if (curT.isEmpty ||
            curT.startsWith('```') ||
            RegExp(r'^#{1,6}\s+').hasMatch(curT) ||
            curT.startsWith('>') ||
            RegExp(r'^(\s*)([-*+•]|\d+\.)\s+').hasMatch(cur) ||
            RegExp(r'^(-{3,}|\*{3,}|_{3,})$').hasMatch(curT) ||
            curT.startsWith('|')) {
          break;
        }
        pLines.add(curT);
        i++;
      }
      if (pLines.isNotEmpty) {
        blocks.add(_MdBlock(
          type: _MdBlockType.paragraph,
          text: pLines.join('\n'),
        ));
      } else {
        // Fallback single line
        blocks.add(_MdBlock(type: _MdBlockType.paragraph, text: trimmed));
        i++;
      }
    }

    return blocks;
  }

  List<InlineSpan> _parseInline(
    String text,
    TextStyle baseStyle,
    bool isDark,
  ) {
    final spans = <InlineSpan>[];
    final pattern = RegExp(
      r'(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*\n]+\*|_[^_\n]+_|\[[^\]]+\]\([^)]+\))',
    );
    int lastEnd = 0;

    for (final match in pattern.allMatches(text)) {
      if (match.start > lastEnd) {
        spans.add(TextSpan(
          text: text.substring(lastEnd, match.start),
          style: baseStyle,
        ));
      }
      final token = match.group(0)!;
      if (token.startsWith('`') && token.endsWith('`')) {
        spans.add(WidgetSpan(
          alignment: PlaceholderAlignment.middle,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
            margin: const EdgeInsets.symmetric(horizontal: 1),
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xFF0F172A)
                  : const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(
                color: isDark
                    ? const Color(0xFF334155)
                    : const Color(0xFFCBD5E1),
              ),
            ),
            child: Text(
              token.substring(1, token.length - 1),
              style: baseStyle.copyWith(
                fontFamily: 'monospace',
                fontSize: (baseStyle.fontSize ?? 12.5) - 0.8,
                color: isDark
                    ? const Color(0xFF38BDF8)
                    : const Color(0xFF0369A1),
              ),
            ),
          ),
        ));
      } else if (token.startsWith('***') && token.endsWith('***')) {
        spans.addAll(_parseInline(
          token.substring(3, token.length - 3),
          baseStyle.copyWith(
              fontWeight: FontWeight.bold, fontStyle: FontStyle.italic),
          isDark,
        ));
      } else if ((token.startsWith('**') && token.endsWith('**')) ||
          (token.startsWith('__') && token.endsWith('__'))) {
        spans.addAll(_parseInline(
          token.substring(2, token.length - 2),
          baseStyle.copyWith(fontWeight: FontWeight.bold),
          isDark,
        ));
      } else if (token.startsWith('~~') && token.endsWith('~~')) {
        spans.addAll(_parseInline(
          token.substring(2, token.length - 2),
          baseStyle.copyWith(decoration: TextDecoration.lineThrough),
          isDark,
        ));
      } else if ((token.startsWith('*') && token.endsWith('*')) ||
          (token.startsWith('_') && token.endsWith('_'))) {
        spans.addAll(_parseInline(
          token.substring(1, token.length - 1),
          baseStyle.copyWith(fontStyle: FontStyle.italic),
          isDark,
        ));
      } else if (token.startsWith('[')) {
        final linkMatch = RegExp(r'^\[([^\]]+)\]\(([^)]+)\)$').firstMatch(token);
        if (linkMatch != null) {
          spans.add(TextSpan(
            text: linkMatch.group(1),
            style: baseStyle.copyWith(
              color: const Color(0xFF38BDF8),
              decoration: TextDecoration.underline,
            ),
          ));
        } else {
          spans.add(TextSpan(text: token, style: baseStyle));
        }
      }
      lastEnd = match.end;
    }

    if (lastEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastEnd), style: baseStyle));
    }
    return spans;
  }
}

enum _MdBlockType {
  heading,
  codeBlock,
  blockquote,
  bulletItem,
  divider,
  table,
  paragraph,
}

class _MdBlock {
  final _MdBlockType type;
  final String text;
  final String lang;
  final int level;
  final String marker;
  final List<List<String>> rows;

  const _MdBlock({
    required this.type,
    this.text = '',
    this.lang = '',
    this.level = 0,
    this.marker = '',
    this.rows = const [],
  });
}
