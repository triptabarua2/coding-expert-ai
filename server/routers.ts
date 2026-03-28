import { COOKIE_NAME } from "@shared/const";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { callDataApi } from "./_core/dataApi";

export const appRouter = router({
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
      .input(z.object({
        language: z.string().optional(),
        model: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const language = input.language || "en";
        const model = input.model || "anthropic/claude-sonnet-4-5";
        return await db.createConversation(ctx.user.id, language, model);
      }),

    // Get all conversations for current user
    listConversations: protectedProcedure.query(async ({ ctx }) => {
      return db.getConversations(ctx.user.id);
    }),

    // Get messages for a conversation
    getMessages: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const conv = await db.getConversationById(input.conversationId, ctx.user.id);
        if (!conv) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        return db.getConversationMessages(input.conversationId);
      }),

    // Send a message and get AI response (Legacy/Non-streaming)
    // Note: Frontend primarily uses /api/chat/stream for better UX
    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const { conversationId, content } = input;

        const conv = await db.getConversationById(conversationId, ctx.user.id);
        if (!conv) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });

        await db.addMessage(conversationId, "user", content);

        // Topic guard
        const { isCodingRelated, getRefusalMessage } = await import("./topicClassifier");
        if (!(await isCodingRelated(content))) {
          const refusalMsg = await getRefusalMessage(content);
          await db.addMessage(conversationId, "assistant", refusalMsg);
          return { content: refusalMsg };
        }

        try {
          const { invokeLLM } = await import("./_core/llm");
          const { getSystemPrompt } = await import("../shared/systemPrompts");

          // Limit history to last 20 messages for context
          const history = await db.getConversationMessages(conversationId, 20);
          const systemPrompt = getSystemPrompt(conv.language);

          const llmMessages = history.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));

          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              ...llmMessages,
            ],
            model: conv.model || "anthropic/claude-sonnet-4-5",
          });

          const assistantContent =
            (typeof response.choices?.[0]?.message?.content === "string"
              ? response.choices[0].message.content
              : "") ||
            (conv.language === "bn"
              ? "কোনো উত্তর পাওয়া যায়নি।"
              : "No response received.");

          await db.addMessage(conversationId, "assistant", assistantContent);
          return { content: assistantContent };
        } catch (error) {
          console.error("[sendMessage] Error:", error);
          const errorMessage = conv.language === "bn"
            ? "❌ সংযোগে সমস্যা। আবার চেষ্টা করুন।"
            : "❌ Connection error. Please try again.";
          await db.addMessage(conversationId, "assistant", errorMessage);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get AI response" });
        }
      }),

    // Delete a conversation
    deleteConversation: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conv = await db.getConversationById(input.conversationId, ctx.user.id);
        if (!conv) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        await db.deleteConversation(input.conversationId);
        return { success: true };
      }),

    // Update conversation model
    updateModel: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        model: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conv = await db.getConversationById(input.conversationId, ctx.user.id);
        if (!conv) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        await db.updateConversationModel(input.conversationId, input.model);
        return { success: true };
      }),

    // Update conversation title
    updateTitle: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        title: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const conv = await db.getConversationById(input.conversationId, ctx.user.id);
        if (!conv) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        await db.updateConversationTitle(input.conversationId, input.title);
        return { success: true };
      }),

    // Upload and analyze a code file
    uploadFile: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        fileName: z.string(),
        fileContent: z.string(), // Base64 or raw text
        fileSize: z.number(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conv = await db.getConversationById(input.conversationId, ctx.user.id);
        if (!conv) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });

        const fileKey = `uploads/${ctx.user.id}/${Date.now()}-${input.fileName}`;

        try {
          // Call Data API to upload to S3
          const uploadResult = await callDataApi("S3/upload", {
            body: {
              key: fileKey,
              content: input.fileContent,
              contentType: input.mimeType,
            }
          }) as { url: string };

          const fileUrl = uploadResult.url;

          // Save file metadata to DB
          const fileRecord = await db.addUploadedFile(
            input.conversationId,
            input.fileName,
            fileKey,
            fileUrl,
            input.fileSize,
            input.mimeType
          );

          return { fileId: fileRecord.id, fileKey, fileUrl };
        } catch (error) {
          console.error("[uploadFile] S3 Upload Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to upload file to storage" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
