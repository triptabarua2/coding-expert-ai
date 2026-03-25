import { CodeBlock } from "./CodeBlock";

interface MessageDisplayProps {
  content: string;
  role: "user" | "assistant";
}

export function MessageDisplay({ content, role }: MessageDisplayProps) {
  // Parse code blocks from content
  const parts: Array<{ type: "text" | "code"; content: string; language?: string }> = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex, match.index),
      });
    }

    // Add code block
    parts.push({
      type: "code",
      language: match[1] || "code",
      content: match[2].trim(),
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      content: content.slice(lastIndex),
    });
  }

  // If no code blocks found, treat entire content as text
  if (parts.length === 0) {
    parts.push({
      type: "text",
      content,
    });
  }

  return (
    <div className={`flex gap-3 ${role === "user" ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
          role === "user"
            ? "bg-blue-600 text-white"
            : "bg-emerald-600 text-white"
        }`}
      >
        {role === "user" ? "👤" : "⌨"}
      </div>

      {/* Message content */}
      <div
        className={`flex-1 max-w-2xl ${
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
            </p>
          ) : (
            <CodeBlock
              key={idx}
              code={part.content}
              language={part.language}
            />
          )
        )}
      </div>
    </div>
  );
}
