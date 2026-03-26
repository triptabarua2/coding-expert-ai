import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import hljs from "highlight.js";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "code" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!codeRef.current) return;
    codeRef.current.removeAttribute("data-highlighted");
    if (language && language !== "code" && hljs.getLanguage(language)) {
      const result = hljs.highlight(code, { language });
      codeRef.current.innerHTML = result.value;
    } else {
      const result = hljs.highlightAuto(code);
      codeRef.current.innerHTML = result.value;
    }
  }, [code, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg border border-slate-700 bg-slate-950 overflow-hidden">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-2 border-b border-slate-700">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
          {language}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className={`text-xs font-mono transition-all ${
            copied
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {copied ? "✓ " + t("copied") : t("copy")}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code ref={codeRef} className={`hljs language-${language}`} />
      </pre>
    </div>
  );
}
