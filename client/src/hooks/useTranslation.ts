import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@shared/i18n";
import type { Language } from "@shared/i18n";

export function useTranslation() {
  const { language } = useLanguage();

  const t = (key: keyof typeof translations.en): string => {
    const langTranslations = translations[language as Language];
    return (langTranslations[key as keyof typeof langTranslations] as string) || key;
  };

  return { t, language };
}
