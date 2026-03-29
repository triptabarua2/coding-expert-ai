import { useState } from "react";
import { CodeBlock } from "./CodeBlock";
import { Copy, Check, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface MessageDisplayProps {
  content: string;
  role: "user" | "assistant";
  streaming?: boolean;
  messageId?: number;
  conversationId?: number;
  onDeleted?: () => void;
}

export function MessageDisplay({ content, role, streaming = false, messageId, conversationId, onDeleted }: MessageDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteMutation = trpc.chat.deleteMessage.useMutation({
    onSuccess: () => onDeleted?.(),
  });

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    if (messageId && conversationId) {
      deleteMutation.mutate({ messageId, conversationId });
    }
  };

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
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
          role === "user" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
        }`}
      >
        {role === "user" ? "👤" : "⌨"}
      </div>

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

        {!streaming && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
            {role === "assistant" && (
              <button
                onClick={handleCopyMessage}
                className="p-1.5 rounded-md bg-slate-700/80 text-slate-400 hover:text-slate-200"
                title="Copy"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            )}
            <button
              onClick={handleDelete}
              className={`p-1.5 rounded-md bg-slate-700/80 transition-all ${
                confirmDelete ? "text-red-400 hover:text-red-300" : "text-slate-400 hover:text-red-400"
              }`}
              title={confirmDelete ? "নিশ্চিত করুন" : "Delete"}
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
