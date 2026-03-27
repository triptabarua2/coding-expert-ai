import { useState, useRef, useEffect } from "react";
import { ChevronDown, Zap, Brain, Scale, Star } from "lucide-react";
import {
  AI_MODELS,
  DEFAULT_MODEL_ID,
  PROVIDER_COLORS,
  SPEED_LABELS,
  getModelById,
  type ModelId,
} from "../../../shared/models";

interface ModelSelectorProps {
  value: ModelId;
  onChange: (modelId: ModelId) => void;
  disabled?: boolean;
}

const SPEED_ICONS = {
  fast: <Zap size={11} />,
  medium: <Scale size={11} />,
  slow: <Brain size={11} />,
};

// Group models by provider
const GROUPED = AI_MODELS.reduce<Record<string, typeof AI_MODELS>>(
  (acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider]!.push(model);
    return acc;
  },
  {}
);

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = getModelById(value) ?? getModelById(DEFAULT_MODEL_ID)!;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-sm text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-w-[200px]"
      >
        <span
          className={`text-xs px-1.5 py-0.5 rounded border font-medium ${
            PROVIDER_COLORS[selected.provider]
          }`}
        >
          {selected.provider}
        </span>
        <span className="truncate flex-1 text-left">{selected.name}</span>
        {selected.recommended && (
          <Star size={11} className="text-yellow-400 flex-shrink-0" />
        )}
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-800">
            <p className="text-xs text-slate-500 px-2">Select AI Model</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {Object.entries(GROUPED).map(([provider, models]) => (
              <div key={provider}>
                {/* Provider header */}
                <div className="px-3 py-1.5 sticky top-0 bg-slate-900/95 backdrop-blur">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                      PROVIDER_COLORS[provider as keyof typeof PROVIDER_COLORS]
                    }`}
                  >
                    {provider}
                  </span>
                </div>

                {/* Models */}
                {models.map((model) => {
                  const isSelected = model.id === value;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        onChange(model.id);
                        setOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 hover:bg-slate-800 transition-colors flex items-start gap-3 ${
                        isSelected ? "bg-slate-800/80" : ""
                      }`}
                    >
                      {/* Left: name + description */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-sm font-medium ${
                              isSelected ? "text-emerald-400" : "text-slate-200"
                            }`}
                          >
                            {model.name}
                          </span>
                          {model.recommended && (
                            <span className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 px-1.5 py-0.5 rounded font-medium">
                              ★ Best
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-xs bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 px-1.5 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {model.description}
                        </p>
                      </div>

                      {/* Right: speed + context */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                            model.speed === "fast"
                              ? "text-green-400 bg-green-400/10"
                              : model.speed === "medium"
                              ? "text-yellow-400 bg-yellow-400/10"
                              : "text-red-400 bg-red-400/10"
                          }`}
                        >
                          {SPEED_ICONS[model.speed]}
                          {model.speed}
                        </span>
                        <span className="text-xs text-slate-600">{model.contextWindow}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-slate-800">
            <p className="text-xs text-slate-600 text-center">
              ⚡ Fast &nbsp;·&nbsp; ⚖️ Balanced &nbsp;·&nbsp; 🧠 Powerful
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
