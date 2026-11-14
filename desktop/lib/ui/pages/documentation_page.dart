import 'package:flutter/material.dart';
import '../../services/localization_service.dart';
import '../../services/section_docs.dart';
import '../widgets/markdown_message_view.dart';

class DocumentationPage extends StatefulWidget {
  final ValueChanged<SectionDoc>? onAskAiAboutSection;
  final String languageCode;

  const DocumentationPage({
    super.key,
    this.onAskAiAboutSection,
    this.languageCode = 'en',
  });

  @override
  State<DocumentationPage> createState() => _DocumentationPageState();
}

class _DocumentationPageState extends State<DocumentationPage> {
  String _query = '';
  int _selectedCategory = 0;

  static const _categoryKeys = [
    'docs.allTopics',
    'docs.catWorkspace',
    'docs.catRuleStudio',
    'docs.catScannerRisk',
    'docs.catChartsPrecision',
  ];

  @override
  Widget build(BuildContext context) {
    final lang = widget.languageCode;
    final categories =
        _categoryKeys.map((k) => AppL10n.t(lang, k)).toList();
    final docs = SectionDocs.allForLanguage(lang);
    final q = _query.trim().toLowerCase();
    final catName = categories[_selectedCategory];
    final filtered = docs.where((s) {
      if (_selectedCategory != 0 && s.category != catName) {
        return false;
      }
      if (q.isNotEmpty) {
        return s.title.toLowerCase().contains(q) ||
            s.markdown.toLowerCase().contains(q) ||
            s.category.toLowerCase().contains(q);
      }
      return true;
    }).toList();

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(Icons.menu_book_outlined,
                  color: Color(0xFF38BDF8), size: 22),
              const SizedBox(width: 8),
              Text(
                AppL10n.t(lang, 'docs.title', 'Platform Guide & Documentation'),
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              SizedBox(
                width: 300,
                child: TextField(
                  onChanged: (v) => setState(() => _query = v),
                  decoration: InputDecoration(
                    hintText: AppL10n.t(lang, 'docs.searchHint',
                        'Search guides, indicators, shortcuts...'),
                    prefixIcon: const Icon(Icons.search, size: 17),
                    border: const OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: List.generate(categories.length, (i) {
              return ChoiceChip(
                label: Text(categories[i], style: const TextStyle(fontSize: 12)),
                selected: _selectedCategory == i,
                onSelected: (_) => setState(() => _selectedCategory = i),
              );
            }),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Text(
                      AppL10n.t(lang, 'docs.noMatch',
                          'No documentation topics match your search.'),
                      style: const TextStyle(color: Colors.grey),
                    ),
                  )
                : ListView.separated(
                    itemCount: filtered.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (ctx, i) {
                      final s = filtered[i];
                      return Card(
                        margin: EdgeInsets.zero,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(s.icon,
                                      size: 20,
                                      color: const Color(0xFF38BDF8)),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      s.title,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 15,
                                      ),
                                    ),
                                  ),
                                  Chip(
                                    visualDensity: VisualDensity.compact,
                                    label: Text(
                                      s.category,
                                      style: const TextStyle(fontSize: 10.5),
                                    ),
                                  ),
                                  if (widget.onAskAiAboutSection != null) ...[
                                    const SizedBox(width: 8),
                                    OutlinedButton.icon(
                                      onPressed: () =>
                                          widget.onAskAiAboutSection!(s),
                                      icon: const Icon(Icons.auto_awesome,
                                          size: 14, color: Color(0xFFA855F7)),
                                      label: Text(
                                        AppL10n.t(lang, 'docs.askAiExplain',
                                            'Ask AI to Explain This'),
                                        style: const TextStyle(fontSize: 11.5),
                                      ),
                                      style: OutlinedButton.styleFrom(
                                        visualDensity: VisualDensity.compact,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const Divider(height: 18),
                              MarkdownMessageView(
                                data: s.markdown,
                                baseFontSize: 12.5,
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
    );
  }
}
