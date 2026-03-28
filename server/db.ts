import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, conversations, messages, uploadedFiles } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Conversation queries
 */
export async function createConversation(
  userId: number,
  language: string = "en",
  model: string = "anthropic/claude-sonnet-4-5"
): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(conversations).values({
    userId,
    language,
    model,
    title: "New Chat",
  });

  return { id: result[0].insertId as number };
}

export async function updateConversationModel(
  conversationId: number,
  model: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(conversations)
    .set({ model })
    .where(eq(conversations.id, conversationId));
}

export async function getConversations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy((t) => desc(t.updatedAt));
}

export async function getConversationById(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    )
    .limit(1);

  return result[0];
}

export async function updateConversationTitle(
  conversationId: number,
  title: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(conversations)
    .set({ title })
    .where(eq(conversations.id, conversationId));
}

export async function deleteConversation(conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(conversations).where(eq(conversations.id, conversationId));
}

/**
 * Message queries
 */
export async function addMessage(
  conversationId: number,
  role: "user" | "assistant",
  content: string,
  codeBlocks?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values({
    conversationId,
    role,
    content,
    codeBlocks,
  });

  return { id: result[0].insertId as number };
}

export async function getConversationMessages(conversationId: number, limit?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  if (limit) {
    // To get the LAST N messages in chronological order, we need to:
    // 1. Sort by desc, limit N
    // 2. Then sort those N messages by asc
    const subquery = db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    
    // Since Drizzle's MySQL driver might have issues with subqueries in this way,
    // we'll fetch and sort in memory if limit is provided, or just return the limited set.
    // For simplicity and reliability in this environment:
    const results = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    
    return results.reverse();
  }

  return query.orderBy((t) => t.createdAt);
}

/**
 * File upload queries
 */
export async function addUploadedFile(
  conversationId: number,
  fileName: string,
  fileKey: string,
  fileUrl: string,
  fileSize: number,
  mimeType: string,
  language?: string,
  messageId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(uploadedFiles).values({
    conversationId,
    fileName,
    fileKey,
    fileUrl,
    fileSize,
    mimeType,
    language,
    messageId,
  });

  return { id: result[0].insertId as number };
}

export async function getConversationFiles(conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(uploadedFiles)
    .where(eq(uploadedFiles.conversationId, conversationId))
    .orderBy((t) => desc(t.createdAt));
}
