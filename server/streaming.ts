/**
 * SSE streaming endpoint for chat messages.
 * POST /api/chat/stream
 * Streams LLM tokens as Server-Sent Events, saves the full response to DB when done.
 */
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { getSystemPrompt } from "../shared/systemPrompts";
import { isCodingRelated, getRefusalMessage } from "./topicClassifier";

export function registerStreamingRoutes(app: Express) {
  app.post("/api/chat/stream", async (req: Request, res: Response) => {
    // Authenticate
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { conversationId, content, model } = req.body as {
      conversationId: number;
      content: string;
      model?: string;
    };

    if (!conversationId || !content?.trim()) {
      res.status(400).json({ error: "conversationId and content are required" });
      return;
    }

    // Verify conversation ownership
    const conv = await db.getConversationById(conversationId, user.id);
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    // Save user message
    await db.addMessage(conversationId, "user", content.trim());

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const sendEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Topic guard
    if (!(await isCodingRelated(content))) {
      const refusal = await getRefusalMessage(content);
      await db.addMessage(conversationId, "assistant", refusal);
      sendEvent("token", { text: refusal });
      sendEvent("done", { content: refusal });
      res.end();
      return;
    }

    try {
      // Limit history to last 20 messages for context
      const history = await db.getConversationMessages(conversationId, 20);
      const systemPrompt = getSystemPrompt(conv.language);

      const llmMessages = [
        { role: "system" as const, content: systemPrompt },
        ...history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${ENV.openrouterApiKey}`,
          "HTTP-Referer": "https://github.com/triptabarua2/coding-expert-ai",
          "X-Title": "Coding Expert AI",
        },
        body: JSON.stringify({
          model: model || conv.model || "anthropic/claude-sonnet-4-5",
          messages: llmMessages,
          max_tokens: 32768,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`LLM error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              fullContent += delta;
              sendEvent("token", { text: delta });
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }

      if (!fullContent) {
        fullContent =
          conv.language === "bn"
            ? "কোনো উত্তর পাওয়া যায়নি।"
            : "No response received.";
      }

      await db.addMessage(conversationId, "assistant", fullContent);
      sendEvent("done", { content: fullContent });
    } catch (err) {
      console.error("[Stream] Error:", err);
      const errMsg =
        conv.language === "bn"
          ? "❌ সংযোগে সমস্যা। আবার চেষ্টা করুন।"
          : "❌ Connection error. Please try again.";
      await db.addMessage(conversationId, "assistant", errMsg);
      sendEvent("error", { message: errMsg });
    }

    res.end();
  });
}
