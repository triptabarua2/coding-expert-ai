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
        if (typeof val === "object" && val !== null && "language" in val) {
          return val as { language?: string };
        }
        return {};
      })
      .mutation(async ({ ctx, input }) => {
        const language = input.language || "en";
        const result = await db.createConversation(ctx.user.id, language);
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

        // Check if message is coding-related (simple filter)
        const isCodingRelated = /^(code|debug|fix|optimize|review|javascript|python|java|c\+\+|function|class|api|database|sql|react|node|express|algorithm|error|bug|syntax|variable|loop|array|object|string|number|boolean|type|interface|enum|async|await|promise|callback|module|import|export|const|let|var|function|return|if|else|for|while|switch|try|catch|finally|throw|new|this|super|extends|implements|abstract|static|private|public|protected|readonly|interface|type|generic|template|lambda|closure|recursion|pointer|reference|memory|heap|stack|thread|process|concurrent|parallel|distributed|microservice|container|docker|kubernetes|git|github|gitlab|npm|yarn|pnpm|webpack|vite|babel|eslint|prettier|jest|vitest|mocha|chai|testing|unit|integration|e2e|ci|cd|devops|cloud|aws|azure|gcp|serverless|lambda|function|rest|graphql|websocket|socket|http|https|tcp|udp|dns|ssl|tls|encryption|hash|jwt|oauth|auth|permission|role|access|control|validation|sanitization|xss|csrf|sql injection|cors|middleware|router|controller|service|repository|model|view|template|component|hook|context|reducer|state|store|redux|mobx|vuex|pinia|zustand|recoil|jotai|atoms|selectors|effects|side|pure|immutable|mutable|spread|destructure|rest|parameter|argument|return|yield|generator|iterator|symbol|proxy|reflect|map|set|weakmap|weakset|promise|async|await|then|catch|finally|resolve|reject|race|all|allsettled|any|timeout|abort|controller|signal|stream|buffer|chunk|pipe|transform|readable|writable|duplex|passthrough|event|emitter|listener|callback|observer|subject|observable|rxjs|lodash|underscore|moment|date|time|timezone|locale|i18n|l10n|translation|localization|internationalization|regex|regexp|pattern|match|replace|split|join|slice|substring|substr|trim|pad|repeat|includes|startswith|endswith|indexof|lastindexof|search|exec|test|parse|stringify|serialize|deserialize|encode|decode|compress|decompress|zip|unzip|tar|gzip|brotli|deflate|inflate|base64|hex|binary|octal|decimal|float|double|integer|bigint|number|string|boolean|symbol|undefined|null|nan|infinity|isnan|isfinite|parseint|parsefloat|tostring|valueof|typeof|instanceof|in|of|delete|void|comma|operator|precedence|associativity|coercion|truthy|falsy|strict|loose|equality|comparison|logical|bitwise|assignment|spread|rest|destructuring|template|literal|string|interpolation|expression|statement|block|scope|closure|hoisting|temporal|dead|zone|binding|declaration|initialization|assignment|reassignment|mutation|side|effect|pure|function|higher|order|currying|partial|application|composition|pipeline|chain|method|property|accessor|getter|setter|descriptor|enumerable|configurable|writable|value|prototype|inheritance|delegation|composition|mixin|trait|interface|abstract|concrete|class|constructor|destructor|lifecycle|hook|mounted|updated|unmounted|created|destroyed|beforecreate|beforemount|beforeupdate|beforedestroy|aftercreate|aftermount|afterupdate|afterdestroy|setup|render|template|jsx|tsx|vue|svelte|angular|react|ember|backbone|knockout|marionette|meteor|polymer|web|component|custom|element|shadow|dom|slot|template|style|scoped|module|css|sass|scss|less|postcss|tailwind|bootstrap|foundation|materialize|bulma|semantic|ui|ant|design|material|fluent|carbon|chakra|mantine|nextui|shadcn|radix|headless|ui|component|library|framework|ecosystem|plugin|extension|addon|middleware|interceptor|decorator|annotation|attribute|directive|filter|pipe|guard|resolver|interceptor|middleware|handler|listener|observer|watcher|computed|reactive|ref|unref|isref|toref|torefs|reactive|readonly|shallowreactive|shallowreadonly|markraw|unmarkraw|isreactive|isreadonly|isproxy|watch|watcheffect|computed|effect|track|trigger|stop|pause|resume|flush|pre|post|sync|immediate|deep|once|leading|trailing|debounce|throttle|once|leading|trailing|wait|maxwait|result|cancel|flush|pending|cancel|leading|trailing|maxwait|wait|debounce|throttle|raf|frame|idle|timeout|interval|immediate|leading|trailing|wait|maxwait|result|cancel|flush|pending|leading|trailing|maxwait|wait|debounce|throttle|raf|frame|idle|timeout|interval|immediate|leading|trailing|wait|maxwait|result|cancel|flush|pending)/i.test(content.toLowerCase());

        if (!isCodingRelated) {
          const assistantMessage = conv.language === "bn"
            ? "আমি শুধু কোডিং এ সাহায্য করি 🤖"
            : "I only help with coding questions 🤖";
          await db.addMessage(conversationId, "assistant", assistantMessage);
          return { content: assistantMessage };
        }

        try {
          // Call LLM with system prompt
          const { invokeLLM } = await import("./_core/llm");
          const { getSystemPrompt } = await import("../shared/systemPrompts");

          const systemPrompt = getSystemPrompt(conv.language as "en" | "bn");

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
