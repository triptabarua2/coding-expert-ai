import { useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Paperclip, X, FileCode } from "lucide-react";

const SUPPORTED_EXTENSIONS = [
  // JavaScript / TypeScript
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  // Python
  ".py", ".pyw",
  // JVM
  ".java", ".kt", ".kts", ".scala", ".groovy",
  // C family
  ".c", ".h", ".cpp", ".cc", ".cxx", ".hpp", ".cs",
  // Systems
  ".go", ".rs", ".zig",
  // Scripting
  ".rb", ".php", ".lua", ".pl", ".pm",
  // Mobile
  ".swift", ".dart", ".m", ".mm",
  // Web
  ".html", ".htm", ".css", ".scss", ".sass", ".less", ".vue", ".svelte",
  // Data / Config
  ".json", ".jsonc", ".yaml", ".yml", ".toml", ".xml", ".csv", ".env",
  // Shell
  ".sh", ".bash", ".zsh", ".fish", ".ps1", ".bat", ".cmd",
  // Database
  ".sql", ".prisma",
  // Functional
  ".hs", ".elm", ".ex", ".exs", ".erl", ".clj", ".cljs", ".fs", ".fsx",
  // Other
  ".r", ".R", ".jl", ".nim", ".v", ".tf", ".hcl",
  // Docs / Markup
  ".md", ".mdx", ".rst", ".tex",
  // Build / CI
  ".dockerfile", ".makefile",
];

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export type SelectedFile = {
  file: File;
  content: string;
  language: string;
};

interface FileUploadButtonProps {
  onFileSelect: (selected: SelectedFile | null) => void;
  selectedFile: SelectedFile | null;
  disabled?: boolean;
}

function detectLanguage(filename: string): string {
  const lower = filename.toLowerCase();
  // Special filenames without extensions
  if (lower === "dockerfile") return "dockerfile";
  if (lower === "makefile") return "makefile";

  const ext = lower.slice(lower.lastIndexOf("."));
  const map: Record<string, string> = {
    // JavaScript / TypeScript
    ".js": "javascript", ".jsx": "javascript", ".mjs": "javascript", ".cjs": "javascript",
    ".ts": "typescript", ".tsx": "typescript",
    // Python
    ".py": "python", ".pyw": "python",
    // JVM
    ".java": "java", ".kt": "kotlin", ".kts": "kotlin",
    ".scala": "scala", ".groovy": "groovy",
    // C family
    ".c": "c", ".h": "c", ".cpp": "cpp", ".cc": "cpp", ".cxx": "cpp", ".hpp": "cpp",
    ".cs": "csharp",
    // Systems
    ".go": "go", ".rs": "rust", ".zig": "zig",
    // Scripting
    ".rb": "ruby", ".php": "php", ".lua": "lua", ".pl": "perl", ".pm": "perl",
    // Mobile
    ".swift": "swift", ".dart": "dart", ".m": "objectivec", ".mm": "objectivec",
    // Web
    ".html": "html", ".htm": "html", ".css": "css",
    ".scss": "scss", ".sass": "scss", ".less": "less",
    ".vue": "xml", ".svelte": "xml",
    // Data / Config
    ".json": "json", ".jsonc": "json", ".yaml": "yaml", ".yml": "yaml",
    ".toml": "ini", ".xml": "xml", ".csv": "plaintext", ".env": "bash",
    // Shell
    ".sh": "bash", ".bash": "bash", ".zsh": "bash", ".fish": "bash",
    ".ps1": "powershell", ".bat": "dos", ".cmd": "dos",
    // Database
    ".sql": "sql", ".prisma": "plaintext",
    // Functional
    ".hs": "haskell", ".elm": "elm", ".ex": "elixir", ".exs": "elixir",
    ".erl": "erlang", ".clj": "clojure", ".cljs": "clojure",
    ".fs": "fsharp", ".fsx": "fsharp",
    // Other
    ".r": "r", ".jl": "julia", ".nim": "nim",
    ".tf": "hcl", ".hcl": "hcl",
    // Docs
    ".md": "markdown", ".mdx": "markdown", ".rst": "plaintext", ".tex": "latex",
    // Build
    ".dockerfile": "dockerfile", ".makefile": "makefile",
  };
  return map[ext] || "plaintext";
}

export function FileUploadButton({ onFileSelect, selectedFile, disabled }: FileUploadButtonProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!inputRef.current) return;
    inputRef.current.value = "";

    if (!file) return;
    setError(null);

    if (file.size > MAX_SIZE_BYTES) {
      setError(t("fileTooLarge"));
      return;
    }

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setError("Unsupported file type.");
      return;
    }

    try {
      const content = await file.text();
      onFileSelect({ file, content, language: detectLanguage(file.name) });
    } catch {
      setError("Could not read file.");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Selected file preview */}
      {selectedFile && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-emerald-500/30 text-sm">
          <FileCode size={14} className="text-emerald-400 flex-shrink-0" />
          <span className="text-slate-300 truncate max-w-[160px]">{selectedFile.file.name}</span>
          <span className="text-slate-500 text-xs flex-shrink-0">{formatSize(selectedFile.file.size)}</span>
          <button
            onClick={() => onFileSelect(null)}
            className="ml-auto text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 px-1">{error}</p>
      )}

      {/* Upload trigger */}
      {!selectedFile && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40"
          title={t("uploadCode")}
        >
          <Paperclip size={18} />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED_EXTENSIONS.join(",")}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
