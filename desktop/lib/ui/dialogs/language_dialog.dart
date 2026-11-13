import 'package:flutter/material.dart';

class LanguageOption {
  const LanguageOption({
    required this.code,
    required this.nativeName,
    required this.englishName,
    required this.flag,
  });

  final String code;
  final String nativeName;
  final String englishName;
  final String flag;
}

const List<LanguageOption> kSupportedLanguages = [
  LanguageOption(code: 'en', nativeName: 'English', englishName: 'English', flag: '🇺🇸'),
  LanguageOption(code: 'es', nativeName: 'Español', englishName: 'Spanish', flag: '🇪🇸'),
  LanguageOption(code: 'fr', nativeName: 'Français', englishName: 'French', flag: '🇫🇷'),
  LanguageOption(code: 'de', nativeName: 'Deutsch', englishName: 'German', flag: '🇩🇪'),
  LanguageOption(code: 'pt', nativeName: 'Português', englishName: 'Portuguese', flag: '🇵🇹'),
  LanguageOption(code: 'ja', nativeName: '日本語', englishName: 'Japanese', flag: '🇯🇵'),
  LanguageOption(code: 'zh', nativeName: '中文', englishName: 'Chinese', flag: '🇨🇳'),
];

class LanguageSelectorDialog extends StatelessWidget {
  const LanguageSelectorDialog({
    super.key,
    required this.currentLanguage,
    required this.onSelect,
  });

  final String currentLanguage;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420, maxHeight: 500),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  const Icon(Icons.translate, size: 20, color: Color(0xFF3B82F6)),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Select Platform Language',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                        Text('Interface & TradingView locale preference',
                            style: TextStyle(fontSize: 11, color: Colors.white60)),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close, size: 18),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: kSupportedLanguages.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 6),
                  itemBuilder: (context, index) {
                    final lang = kSupportedLanguages[index];
                    final selected = lang.code == currentLanguage;
                    return InkWell(
                      borderRadius: BorderRadius.circular(10),
                      onTap: () {
                        onSelect(lang.code);
                        Navigator.of(context).pop();
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          color: selected
                              ? const Color(0xFF3B82F6).withValues(alpha: 0.18)
                              : Colors.white.withValues(alpha: 0.03),
                          border: Border.all(
                            color: selected ? const Color(0xFF3B82F6) : Colors.white12,
                          ),
                        ),
                        child: Row(
                          children: [
                            Text(lang.flag, style: const TextStyle(fontSize: 20)),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(lang.nativeName,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600, fontSize: 13)),
                                  Text(lang.englishName,
                                      style: const TextStyle(
                                          fontSize: 11, color: Colors.white60)),
                                ],
                              ),
                            ),
                            if (selected)
                              const Icon(Icons.check_circle,
                                  size: 18, color: Color(0xFF3B82F6)),
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
    );
  }
}
