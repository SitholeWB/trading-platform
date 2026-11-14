import 'package:flutter/material.dart';
import '../../services/localization_service.dart';

export '../../services/localization_service.dart'
    show LanguageOption, kSupportedLanguages;

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
    final activeInfo = AppL10n.infoFor(currentLanguage);
    return Dialog(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 440, maxHeight: 540),
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
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          AppL10n.t(currentLanguage, 'header.changeLanguage',
                              'Select Platform Language'),
                          style: const TextStyle(
                              fontSize: 15, fontWeight: FontWeight.w700),
                        ),
                        Text(
                          '${AppL10n.t(currentLanguage, 'common.language', 'Language')} • ${activeInfo.flag} ${activeInfo.nativeName}',
                          style: const TextStyle(
                              fontSize: 11, color: Colors.white60),
                        ),
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
                                  Row(
                                    children: [
                                      Text(lang.nativeName,
                                          style: const TextStyle(
                                              fontWeight: FontWeight.w600, fontSize: 13)),
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 5, vertical: 1),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withValues(alpha: 0.08),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          lang.code.toUpperCase(),
                                          style: const TextStyle(
                                              fontSize: 9.5,
                                              fontFamily: 'monospace',
                                              color: Colors.white70),
                                        ),
                                      ),
                                    ],
                                  ),
                                  Text('${lang.englishName} · ${lang.region}',
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
