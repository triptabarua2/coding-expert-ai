import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "code" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

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
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-slate-100 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}
