/**
 * Available AI models for the coding assistant.
 * All models are served through OpenRouter (https://openrouter.ai).
 * Model IDs must use the full provider/model-name format required by OpenRouter.
 */

export type ModelId = string;

export type AIModel = {
  id: ModelId;
  name: string;
  provider: "Anthropic" | "Google" | "OpenAI" | "Meta" | "Mistral" | "DeepSeek";
  description: string;
  strengths: string[];
  speed: "fast" | "medium" | "slow";
  contextWindow: string;
  recommended?: boolean;
};

export const AI_MODELS: AIModel[] = [
  // ── Anthropic Claude ────────────────────────────────────────────────────
  {
    id: "anthropic/claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    description: "Best for coding — deep reasoning, long context, precise output",
    strengths: ["Coding", "Debugging", "Code review", "Architecture"],
    speed: "medium",
    contextWindow: "200K",
    recommended: true,
  },
  {
    id: "anthropic/claude-opus-4-5",
    name: "Claude Opus 4.5",
    provider: "Anthropic",
    description: "Most powerful Claude — complex multi-step coding tasks",
    strengths: ["Complex algorithms", "System design", "Research"],
    speed: "slow",
    contextWindow: "200K",
  },
  {
    id: "anthropic/claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    description: "Fastest Claude — quick code completions and fixes",
    strengths: ["Quick fixes", "Autocomplete", "Simple tasks"],
    speed: "fast",
    contextWindow: "200K",
  },
  // ── Google Gemini ────────────────────────────────────────────────────────
  {
    id: "google/gemini-2.5-pro-preview",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    description: "Google's most capable model — excellent at code and math",
    strengths: ["Coding", "Math", "Long context", "Multimodal"],
    speed: "slow",
    contextWindow: "1M",
  },
  {
    id: "google/gemini-2.5-flash-preview",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    description: "Fast and capable — great balance of speed and quality",
    strengths: ["Coding", "Speed", "Cost-effective"],
    speed: "fast",
    contextWindow: "1M",
  },
 {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash (Free)",
    provider: "Google",
    description: "Free tier — great for everyday coding tasks",
    strengths: ["General coding", "Free", "Fast"],
    speed: "fast",
    contextWindow: "1M",
    recommended: true,
  }, 
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Stable and reliable for everyday coding tasks",
    strengths: ["General coding", "Stability"],
    speed: "fast",
    contextWindow: "1M",
  },
  // ── OpenAI GPT ───────────────────────────────────────────────────────────
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "OpenAI's flagship — strong at code generation and explanation",
    strengths: ["Code generation", "Explanation", "Debugging"],
    speed: "medium",
    contextWindow: "128K",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Lightweight GPT-4o — fast responses for simple tasks",
    strengths: ["Quick answers", "Simple fixes"],
    speed: "fast",
    contextWindow: "128K",
  },
  {
    id: "openai/o3",
    name: "OpenAI o3",
    provider: "OpenAI",
    description: "Advanced reasoning model — best for hard algorithmic problems",
    strengths: ["Algorithms", "Math", "Hard problems"],
    speed: "slow",
    contextWindow: "200K",
  },
  {
    id: "openai/o4-mini",
    name: "OpenAI o4-mini",
    provider: "OpenAI",
    description: "Fast reasoning model — good for coding with chain-of-thought",
    strengths: ["Reasoning", "Coding", "Speed"],
    speed: "medium",
    contextWindow: "200K",
  },
  // ── Meta Llama ───────────────────────────────────────────────────────────
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "Meta",
    description: "Open-source powerhouse — strong coding capabilities",
    strengths: ["Coding", "Open source", "Cost-effective"],
    speed: "medium",
    contextWindow: "128K",
  },
  {
    id: "meta-llama/llama-4-maverick",
    name: "Llama 4 Maverick",
    provider: "Meta",
    description: "Latest Llama — multimodal with strong code understanding",
    strengths: ["Coding", "Multimodal", "Speed"],
    speed: "fast",
    contextWindow: "1M",
  },
  // ── Mistral ──────────────────────────────────────────────────────────────
  {
    id: "mistralai/mistral-large-2411",
    name: "Mistral Large",
    provider: "Mistral",
    description: "European frontier model — excellent at code and reasoning",
    strengths: ["Coding", "Reasoning", "Multilingual"],
    speed: "medium",
    contextWindow: "128K",
  },
  {
    id: "mistralai/codestral-2501",
    name: "Codestral",
    provider: "Mistral",
    description: "Purpose-built for code — trained on 80+ programming languages",
    strengths: ["Code generation", "Completion", "80+ languages"],
    speed: "fast",
    contextWindow: "256K",
  },
  // ── DeepSeek ─────────────────────────────────────────────────────────────
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    description: "Top open-source coding model — rivals GPT-4 on benchmarks",
    strengths: ["Coding", "Math", "Cost-effective"],
    speed: "medium",
    contextWindow: "128K",
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    description: "Reasoning-focused — great for complex debugging and algorithms",
    strengths: ["Reasoning", "Algorithms", "Debugging"],
    speed: "slow",
    contextWindow: "128K",
  },
];

export const DEFAULT_MODEL_ID = "google/gemini-2.0-flash-exp:free";

export const PROVIDER_COLORS: Record<AIModel["provider"], string> = {
  Anthropic: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  Google:    "text-blue-400 bg-blue-400/10 border-blue-400/30",
  OpenAI:    "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  Meta:      "text-purple-400 bg-purple-400/10 border-purple-400/30",
  Mistral:   "text-pink-400 bg-pink-400/10 border-pink-400/30",
  DeepSeek:  "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
};

export const SPEED_LABELS: Record<AIModel["speed"], string> = {
  fast:   "⚡ Fast",
  medium: "⚖️ Balanced",
  slow:   "🧠 Powerful",
};

export function getModelById(id: ModelId): AIModel | undefined {
  return AI_MODELS.find((m) => m.id === id);
}
