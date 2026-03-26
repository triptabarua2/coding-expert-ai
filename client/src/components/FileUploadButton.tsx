import { useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Paperclip, X, FileCode } from "lucide-react";

const SUPPORTED_EXTENSIONS = [
  ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".cpp", ".c", ".cs",
  ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".html", ".css", ".json",
  ".yaml", ".yml", ".sh", ".bash", ".sql", ".md",
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
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  const map: Record<string, string> = {
    ".js": "javascript", ".jsx": "javascript", ".ts": "typescript",
    ".tsx": "typescript", ".py": "python", ".java": "java",
    ".cpp": "cpp", ".c": "c", ".cs": "csharp", ".go": "go",
    ".rs": "rust", ".rb": "ruby", ".php": "php", ".swift": "swift",
    ".kt": "kotlin", ".html": "html", ".css": "css", ".json": "json",
    ".yaml": "yaml", ".yml": "yaml", ".sh": "bash", ".bash": "bash",
    ".sql": "sql", ".md": "markdown",
  };
  return map[ext] || "code";
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
