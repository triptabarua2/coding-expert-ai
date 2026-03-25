import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

// Mock database functions
vi.mock("./db", () => ({
  createConversation: vi.fn(async (userId: number, language: string) => ({
    id: 1,
  })),
  getConversations: vi.fn(async (userId: number) => [
    {
      id: 1,
      userId,
      title: "Test Chat",
      language: "en",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getConversationById: vi.fn(async (conversationId: number, userId: number) => ({
    id: conversationId,
    userId,
    title: "Test Chat",
    language: "en",
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  addMessage: vi.fn(async (conversationId: number, role: string, content: string) => ({
    id: 1,
  })),
  getConversationMessages: vi.fn(async (conversationId: number) => [
    {
      id: 1,
      conversationId,
      role: "user",
      content: "Hello",
      codeBlocks: null,
      createdAt: new Date(),
    },
  ]),
  deleteConversation: vi.fn(async (conversationId: number) => {}),
  updateConversationTitle: vi.fn(async (conversationId: number, title: string) => {}),
  addUploadedFile: vi.fn(async () => ({ id: 1 })),
}));

function createAuthContext(): TrpcContext {
  const user: User = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

describe("chat procedures", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });


  describe("createConversation", () => {
    it("should create a new conversation with default language", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.chat.createConversation({});

      expect(result).toEqual({ id: 1 });
    });

    it("should create a conversation with specified language", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.chat.createConversation({ language: "bn" });

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("listConversations", () => {
    it("should list all conversations for the user", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.chat.listConversations();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.userId).toBe(ctx.user?.id);
    });
  });

  describe("getMessages", () => {
    it("should get messages for a conversation", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.chat.getMessages({ conversationId: 1 });

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]?.conversationId).toBe(1);
    });
  });

  describe("deleteConversation", () => {
    it("should delete a conversation", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.chat.deleteConversation({ conversationId: 1 });

      expect(result).toEqual({ success: true });
    });
  });

  describe("updateTitle", () => {
    it("should update conversation title", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.chat.updateTitle({
        conversationId: 1,
        title: "New Title",
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe("uploadFile", () => {
    it("should upload a file to conversation", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.chat.uploadFile({
        conversationId: 1,
        fileName: "test.js",
        fileUrl: "https://example.com/test.js",
        fileSize: 1024,
        mimeType: "text/javascript",
      });

      expect(result).toHaveProperty("fileId");
      expect(result).toHaveProperty("fileKey");
    });
  });
});
