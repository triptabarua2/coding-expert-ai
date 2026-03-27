import { useState, useRef, useEffect } from "react";
import { ChevronDown, Globe } from "lucide-react";
import type { Language } from "@shared/i18n";

export type LanguageOption = {
  code: Language;
  label: string;
  native: string;
  flag: string;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "auto", label: "Auto-detect",  native: "Auto",     flag: "🌐" },
  { code: "en",   label: "English",      native: "English",  flag: "🇬🇧" },
  { code: "bn",   label: "Bengali",      native: "বাংলা",    flag: "🇧🇩" },
  { code: "hi",   label: "Hindi",        native: "हिन्दी",   flag: "🇮🇳" },
  { code: "ur",   label: "Urdu",         native: "اردو",     flag: "🇵🇰" },
  { code: "ar",   label: "Arabic",       native: "العربية",  flag: "🇸🇦" },
  { code: "zh",   label: "Chinese",      native: "中文",     flag: "🇨🇳" },
  { code: "ja",   label: "Japanese",     native: "日本語",   flag: "🇯🇵" },
  { code: "ko",   label: "Korean",       native: "한국어",   flag: "🇰🇷" },
  { code: "es",   label: "Spanish",      native: "Español",  flag: "🇪🇸" },
  { code: "fr",   label: "French",       native: "Français", flag: "🇫🇷" },
  { code: "de",   label: "German",       native: "Deutsch",  flag: "🇩🇪" },
  { code: "pt",   label: "Portuguese",   native: "Português",flag: "🇧🇷" },
  { code: "ru",   label: "Russian",      native: "Русский",  flag: "🇷🇺" },
  { code: "tr",   label: "Turkish",      native: "Türkçe",   flag: "🇹🇷" },
];

interface LanguageSelectorProps {
  value: Language;
  onChange: (lang: Language) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = LANGUAGE_OPTIONS.find((l) => l.code === value) ?? LANGUAGE_OPTIONS[0]!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-sm text-slate-300 transition-colors"
        title="Response language"
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="hidden sm:inline text-xs font-medium">
          {selected.code === "auto" ? "Auto" : selected.native}
        </span>
        <ChevronDown
          size={12}
          className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-1 right-0 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-800">
            <p className="text-xs text-slate-500 px-1 flex items-center gap-1">
              <Globe size={11} /> AI response language
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {LANGUAGE_OPTIONS.map((lang) => {
              const isSelected = lang.code === value;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => { onChange(lang.code); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-800 transition-colors ${
                    isSelected ? "bg-slate-800/80 text-emerald-400" : "text-slate-300"
                  }`}
                >
                  <span className="text-base w-6 text-center">{lang.flag}</span>
                  <span className="flex-1 text-left">{lang.label}</span>
                  <span className="text-xs text-slate-500">{lang.native}</span>
                  {isSelected && <span className="text-emerald-400 text-xs">✓</span>}
                </button>
              );
            })}
          </div>
          <div className="p-2 border-t border-slate-800">
            <p className="text-xs text-slate-600 text-center">
              🌐 Auto = replies in your language
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
