import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@shared/i18n";

type SupportedUILang = keyof typeof translations;

export function useTranslation() {
  const { language } = useLanguage();

  // UI strings only exist for "en" and "bn"; everything else falls back to English.
  const uiLang: SupportedUILang = (language in translations)
    ? (language as SupportedUILang)
    : "en";

  const t = (key: keyof typeof translations.en): string => {
    return (translations[uiLang] as Record<string, string>)[key] ?? key;
  };

  return { t, language };
}
