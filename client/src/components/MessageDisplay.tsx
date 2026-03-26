import { useState } from "react";
import { CodeBlock } from "./CodeBlock";
import { Copy, Check } from "lucide-react";

interface MessageDisplayProps {
  content: string;
  role: "user" | "assistant";
  streaming?: boolean;
}

export function MessageDisplay({ content, role, streaming = false }: MessageDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse code blocks from content
  const parts: Array<{ type: "text" | "code"; content: string; language?: string }> = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "code", language: match[1] || "code", content: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: "text", content });
  }

  return (
    <div className={`flex gap-3 ${role === "user" ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
          role === "user" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
        }`}
      >
        {role === "user" ? "👤" : "⌨"}
      </div>

      {/* Message content */}
      <div
        className={`flex-1 max-w-2xl group relative ${
          role === "user"
            ? "bg-blue-600/20 border border-blue-500/30 text-slate-100"
            : "bg-slate-800/50 border border-slate-700/50 text-slate-100"
        } rounded-lg p-4`}
      >
        {parts.map((part, idx) =>
          part.type === "text" ? (
            <p
              key={idx}
              className="text-sm leading-relaxed whitespace-pre-wrap break-words mb-2 last:mb-0"
            >
              {part.content}
              {streaming && idx === parts.length - 1 && (
                <span className="inline-block w-0.5 h-4 bg-emerald-400 ml-0.5 animate-pulse align-middle" />
              )}
            </p>
          ) : (
            <CodeBlock key={idx} code={part.content} language={part.language} />
          )
        )}

        {/* Copy full message button — only for assistant, not while streaming */}
        {role === "assistant" && !streaming && (
          <button
            onClick={handleCopyMessage}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-slate-700/80 text-slate-400 hover:text-slate-200 transition-all"
            title="Copy message"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}
