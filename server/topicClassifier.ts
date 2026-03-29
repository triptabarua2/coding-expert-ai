/**
 * LLM-based topic classifier and guard.
 * Returns true if the message is coding-related, false otherwise.
 * Falls back to a lightweight keyword check if the LLM call fails.
 */
import { invokeLLM } from "./_core/llm";

const FALLBACK_KEYWORDS =
  /\b(code|debug|fix|error|bug|function|class|variable|loop|array|object|string|algorithm|api|database|sql|react|node|express|python|javascript|typescript|java|c\+\+|golang|rust|php|ruby|swift|kotlin|html|css|git|docker|kubernetes|npm|yarn|webpack|vite|test|deploy|server|client|frontend|backend|async|await|promise|hook|component|module|import|export|interface|type|enum|recursion|rest|graphql|websocket|http|jwt|oauth|regex|parse|serialize|encrypt|hash|compile|runtime|syntax|lint|refactor|optimize|review|snippet|script|terminal|shell|bash|cli|sdk|library|framework|package|dependency|build|ci|cd|devops|cloud|aws|azure|gcp|lambda|container|microservice|orm|migration|schema|query|cache|redis|queue|stream|buffer|socket|proxy|cors|middleware|router|controller|service|repository|model|view|template|jsx|tsx|vue|svelte|angular|next|nuxt|remix|tailwind|bootstrap|sass|scss|prisma|drizzle|mongoose|sequelize|axios|fetch|trpc|zustand|redux|mobx|recoil|jotai|context|reducer|state|store|atom|selector|effect|computed|reactive|ref|watch|lifecycle|mount|unmount|render|hydrate|ssr|ssg|spa|pwa|wasm|canvas|webgl|d3|chart|animation|gesture|drag|drop|performance|bundle|chunk|lazy|suspense|fiber|reconcile|virtual|dom|shadow|slot|polyfill|transpile|minify|tree|shake|source|map|hot|reload|hmr|devtools|profiler|debugger|breakpoint|stack|trace|heap|leak|garbage|collect|prototype|closure|scope|hoisting|coercion|immutable|mutable|spread|destructure|rest|parameter|argument|return|yield|generator|iterator|symbol|proxy|reflect|map|set|weakmap|weakset|promise|resolve|reject|race|all|settled|any|abort|signal|readable|writable|transform|emitter|observer|subject|observable|rxjs|lodash|moment|dayjs|uuid|nanoid|zod|yup|joi|validator|sanitize|xss|csrf|injection|cors|helmet|rate|limit|throttle|debounce|memoize|curry|compose|pipe|partial|apply|bind|call|new|this|super|extends|implements|abstract|static|private|public|protected|readonly|override|decorator|annotation|attribute|directive|filter|guard|resolver|interceptor|handler|listener|watcher)\b/i;

const CLASSIFIER_SYSTEM_PROMPT = `You are a topic classifier. Your only job is to decide if a user message is related to programming, software development, coding, or computer science.

Reply with exactly one word: "yes" if it is coding-related, "no" if it is not.

Examples:
- "How do I reverse a string in Python?" → yes
- "Fix this JavaScript error" → yes
- "What is a REST API?" → yes
- "What is the weather today?" → no
- "Tell me a joke" → no
- "Who is the president?" → no`;

export async function isCodingRelated(content: string): Promise<boolean> {
  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: CLASSIFIER_SYSTEM_PROMPT },
        { role: "user", content: content.slice(0, 500) },
      ],
      model: "anthropic/claude-haiku-4-5", // fast + cheap for classification
      maxTokens: 5,
    });

    const answer = (
      typeof result.choices?.[0]?.message?.content === "string"
        ? result.choices[0].message.content
        : ""
    )
      .trim()
      .toLowerCase();

    return answer.startsWith("yes");
  } catch (err) {
    // LLM unavailable — fall back to keyword check
    console.warn("[TopicClassifier] LLM call failed, using keyword fallback:", err);
    return FALLBACK_KEYWORDS.test(content);
  }
}

/**
 * Helper to get a polite refusal message in the user's language.
 */
export async function getRefusalMessage(content: string): Promise<string> {
  let refusalMsg = "I only help with coding questions 🤖";
  try {
    const refusal = await invokeLLM({
      messages: [
        { role: "system", content: "You are a coding assistant. The user sent a non-coding message. Politely tell them in the SAME language they used that you only help with coding questions. Keep it to one short sentence." },
        { role: "user", content: content },
      ],
      model: "google/gemini-2.0-flash-exp:free",
      maxTokens: 60,
    });
    const txt = typeof refusal.choices?.[0]?.message?.content === "string"
      ? refusal.choices[0].message.content.trim()
      : "";
    if (txt) refusalMsg = txt;
  } catch { /* fallback */ }
  return refusalMsg;
}
