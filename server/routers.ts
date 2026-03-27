import { COOKIE_NAME } from "@shared/const";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";



export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
    system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chat: router({
    // Create a new conversation
    createConversation: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null) {
          return val as { language?: string; model?: string };
        }
        return {};
      })
      .mutation(async ({ ctx, input }) => {
        const language = input.language || "en";
        const model = input.model || "claude-sonnet-4-5";
        const result = await db.createConversation(ctx.user.id, language, model);
        return result;
      }),

    // Get all conversations for current user
    listConversations: protectedProcedure.query(async ({ ctx }) => {
      return db.getConversations(ctx.user.id);
    }),

    // Get messages for a conversation
    getMessages: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "conversationId" in val) {
          return val as { conversationId: number };
        }
        throw new Error("Invalid input");
      })
      .query(async ({ ctx, input }) => {
        const conv = await db.getConversationById(input.conversationId, ctx.user.id);
        if (!conv) throw new Error("Conversation not found");
        return db.getConversationMessages(input.conversationId);
      }),

    // Send a message and get AI response
    sendMessage: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "conversationId" in val && "content" in val) {
          return val as { conversationId: number; content: string };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { conversationId, content } = input;

        // Verify conversation belongs to user
        const conv = await db.getConversationById(conversationId, ctx.user.id);
        if (!conv) throw new Error("Conversation not found");

        // Add user message
        await db.addMessage(conversationId, "user", content);

        // Get conversation history for context
        const messages = await db.getConversationMessages(conversationId);

        // LLM-based topic classification (falls back to keywords if LLM unavailable)
        const { isCodingRelated } = await import("./topicClassifier");
        const codingRelated = await isCodingRelated(content);

        if (!codingRelated) {
          // Ask the LLM to refuse in the user's own language
          const { invokeLLM } = await import("./_core/llm");
          let refusalMsg = "I only help with coding questions 🤖";
          try {
            const refusal = await invokeLLM({
              messages: [
                { role: "system", content: "You are a coding assistant. The user sent a non-coding message. Politely tell them in the SAME language they used that you only help with coding questions. Keep it to one short sentence." },
                { role: "user", content: content },
              ],
              model: "claude-haiku-3-5",
              maxTokens: 60,
            });
            const txt = typeof refusal.choices?.[0]?.message?.content === "string"
              ? refusal.choices[0].message.content.trim()
              : "";
            if (txt) refusalMsg = txt;
          } catch { /* fallback to default */ }
          await db.addMessage(conversationId, "assistant", refusalMsg);
          return { content: refusalMsg };
        }

        try {
          // Call LLM with system prompt
          const { invokeLLM } = await import("./_core/llm");
          const { getSystemPrompt } = await import("../shared/systemPrompts");

          const systemPrompt = getSystemPrompt(conv.language);

          // Format messages for LLM
          const llmMessages = messages.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));

          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              ...llmMessages,
            ],
            model: conv.model || "claude-sonnet-4-5",
          });

          const assistantContent =
            (typeof response.choices?.[0]?.message?.content === "string"
              ? response.choices[0].message.content
              : "") ||
            (conv.language === "bn"
              ? "কোনো উত্তর পাওয়া যায়নি।"
              : "No response received.");

          // Save assistant message
          if (typeof assistantContent === "string") {
            await db.addMessage(conversationId, "assistant", assistantContent);
          }

          return { content: assistantContent };
        } catch (error) {
          const errorMessage = conv.language === "bn"
            ? "❌ সংযোগে সমস্যা। আবার চেষ্টা করুন।"
            : "❌ Connection error. Please try again.";
          await db.addMessage(conversationId, "assistant", errorMessage);
          throw error;
        }
      }),

    // Delete a conversation
    deleteConversation: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "conversationId" in val) {
          return val as { conversationId: number };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const conv = await db.getConversationById(input.conversationId, ctx.user.id);
        if (!conv) throw new Error("Conversation not found");
        await db.deleteConversation(input.conversationId);
        return { success: true };
      }),

    // Update conversation model
    updateModel: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "conversationId" in val && "model" in val) {
          return val as { conversationId: number; model: string };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const conv = await db.getConversationById(input.conversationId, ctx.user.id);
        if (!conv) throw new Error("Conversation not found");
        await db.updateConversationModel(input.conversationId, input.model);
        return { success: true };
      }),

    // Update conversation title
    updateTitle: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "conversationId" in val && "title" in val) {
          return val as { conversationId: number; title: string };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const conv = await db.getConversationById(input.conversationId, ctx.user.id);
        if (!conv) throw new Error("Conversation not found");
        await db.updateConversationTitle(input.conversationId, input.title);
        return { success: true };
      }),

    // Upload and analyze a code file
    uploadFile: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "conversationId" in val && "fileName" in val && "fileUrl" in val) {
          return val as { conversationId: number; fileName: string; fileUrl: string; fileSize: number; mimeType: string };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const conv = await db.getConversationById(input.conversationId, ctx.user.id);
        if (!conv) throw new Error("Conversation not found");

        // Generate file key for S3
        const fileKey = `uploads/${ctx.user.id}/${Date.now()}-${input.fileName}`;

        // Save file metadata
        const fileRecord = await db.addUploadedFile(
          input.conversationId,
          input.fileName,
          fileKey,
          input.fileUrl,
          input.fileSize,
          input.mimeType
        );

        return { fileId: fileRecord.id, fileKey };
      }),
  }),
});

export type AppRouter = typeof appRouter;
