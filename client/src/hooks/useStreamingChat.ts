import { useState, useCallback, useRef } from "react";

export type StreamingMessage = {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

export function useStreamingChat() {
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      conversationId: number,
      content: string,
      onToken: (token: string) => void,
      onDone: (fullContent: string) => void,
      onError: (msg: string) => void
    ) => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      setStreamingContent("");

      try {
        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ conversationId, content }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith("event: token")) continue;
            if (trimmed.startsWith("event: done")) continue;
            if (trimmed.startsWith("event: error")) continue;

            if (trimmed.startsWith("data: ")) {
              try {
                const json = JSON.parse(trimmed.slice(6));

                if (json.text !== undefined) {
                  accumulated += json.text;
                  setStreamingContent(accumulated);
                  onToken(json.text);
                } else if (json.content !== undefined) {
                  onDone(json.content);
                  setStreamingContent("");
                } else if (json.message !== undefined) {
                  onError(json.message);
                  setStreamingContent("");
                }
              } catch {
                // skip malformed
              }
            }
          }
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          onError("Connection error. Please try again.");
          setStreamingContent("");
        }
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setStreamingContent("");
  }, []);

  return { sendMessage, isStreaming, streamingContent, cancel };
}
