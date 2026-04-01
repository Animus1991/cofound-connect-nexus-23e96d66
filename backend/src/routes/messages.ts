import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { z } from "zod";
import { db } from "../db/index.js";
import { users, conversations, conversationParticipants, messages } from "../db/schema.js";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";
import { logActivity } from "../lib/activity.js";

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

const createConversationSchema = z.object({
  participantId: z.string().min(1),
});

export const messagesRoutes = new Hono<AppEnv>();
messagesRoutes.use("*", authMiddleware);

messagesRoutes.get("/conversations", (c) => {
  const userId = c.get("userId") as string;

  const myParticipations = db.select().from(conversationParticipants)
    .where(eq(conversationParticipants.userId, userId)).all();

  const convIds = myParticipations.map((p) => p.conversationId);
  if (convIds.length === 0) return c.json({ conversations: [] });

  // Batch-load all participants for all conversations
  const allParts = db.select().from(conversationParticipants)
    .where(inArray(conversationParticipants.conversationId, convIds)).all();

  // Build map: conversationId → other user ID
  const otherUserIdMap = new Map<string, string>();
  for (const p of allParts) {
    if (p.userId !== userId) otherUserIdMap.set(p.conversationId, p.userId);
  }

  // Batch-load all other users
  const otherIds = [...new Set(otherUserIdMap.values())];
  const userMap = new Map<string, { id: string; name: string | null }>();
  if (otherIds.length > 0) {
    db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, otherIds)).all()
      .forEach((u) => userMap.set(u.id, u));
  }

  // Batch-load last message per conversation
  const allMsgs = db.select().from(messages)
    .where(inArray(messages.conversationId, convIds))
    .orderBy(desc(messages.createdAt)).all();
  const lastMsgMap = new Map<string, typeof messages.$inferSelect>();
  for (const m of allMsgs) {
    if (!lastMsgMap.has(m.conversationId)) lastMsgMap.set(m.conversationId, m);
  }

  const convos = myParticipations.map((p) => {
    const otherId = otherUserIdMap.get(p.conversationId);
    const otherUser = otherId ? userMap.get(otherId) ?? null : null;
    const lastMsg = lastMsgMap.get(p.conversationId);
    return {
      id: p.conversationId,
      otherUser,
      lastMessage: lastMsg
        ? { content: lastMsg.content, createdAt: lastMsg.createdAt, fromMe: lastMsg.senderId === userId }
        : null,
    };
  });

  return c.json({ conversations: convos });
});

messagesRoutes.post("/conversations", async (c) => {
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const parseResult = createConversationSchema.safeParse(body);
  if (!parseResult.success) return c.json({ error: "Validation failed", details: parseResult.error.flatten() }, 400);

  const { participantId } = parseResult.data;
  if (participantId === userId) return c.json({ error: "Cannot create conversation with yourself" }, 400);

  // Check for existing conversation between these two users (single query instead of N+1 loop)
  const myConvIds = db.select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants).where(eq(conversationParticipants.userId, userId)).all()
    .map((r) => r.conversationId);

  if (myConvIds.length > 0) {
    const otherInMyConvs = db.select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(and(inArray(conversationParticipants.conversationId, myConvIds), eq(conversationParticipants.userId, participantId)))
      .get();
    if (otherInMyConvs) {
      return c.json({ id: otherInMyConvs.conversationId, existing: true }, 200);
    }
  }

  // Create new conversation + participants in a transaction
  const convId = db.transaction((tx) => {
    const conv = tx.insert(conversations).values({}).returning().get();
    tx.insert(conversationParticipants).values({ conversationId: conv.id, userId }).run();
    tx.insert(conversationParticipants).values({ conversationId: conv.id, userId: participantId }).run();
    return conv.id;
  });

  return c.json({ id: convId, existing: false }, 201);
});

messagesRoutes.get("/conversations/:id", (c) => {
  const userId = c.get("userId") as string;
  const id = c.req.param("id");

  const participant = db.select().from(conversationParticipants)
    .where(and(eq(conversationParticipants.conversationId, id), eq(conversationParticipants.userId, userId))).get();
  if (!participant) return c.json({ error: "Conversation not found" }, 404);

  const allParticipants = db.select().from(conversationParticipants)
    .where(eq(conversationParticipants.conversationId, id)).all();
  const otherPart = allParticipants.find((p) => p.userId !== userId);
  const otherUser = otherPart
    ? db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, otherPart.userId)).get()
    : null;

  const msgs = db.select().from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt)).all();

  // Batch-load all sender names instead of per-message query
  const senderIds = [...new Set(msgs.map((m) => m.senderId))];
  const senderMap = new Map<string, { id: string; name: string | null }>();
  if (senderIds.length > 0) {
    db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, senderIds)).all()
      .forEach((u) => senderMap.set(u.id, u));
  }

  return c.json({
    id,
    otherUser: otherUser ?? null,
    messages: msgs.map((m) => {
      const sender = senderMap.get(m.senderId);
      return {
        id: m.id, content: m.content, senderId: m.senderId,
        senderName: sender?.name ?? "Unknown", createdAt: m.createdAt, fromMe: m.senderId === userId,
      };
    }),
  });
});

messagesRoutes.post("/conversations/:id/messages", async (c) => {
  const userId = c.get("userId") as string;
  const id = c.req.param("id");
  const body = await c.req.json();
  const parseResult = sendMessageSchema.safeParse(body);
  if (!parseResult.success) return c.json({ error: "Validation failed", details: parseResult.error.flatten() }, 400);

  const participant = db.select().from(conversationParticipants)
    .where(and(eq(conversationParticipants.conversationId, id), eq(conversationParticipants.userId, userId))).get();
  if (!participant) return c.json({ error: "Conversation not found" }, 404);

  const msg = db.insert(messages).values({
    conversationId: id, senderId: userId, content: parseResult.data.content,
  }).returning().get();
  logActivity(userId, "message_sent", { conversationId: id });

  const sender = db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, userId)).get();

  return c.json({
    id: msg.id, content: msg.content, senderId: msg.senderId,
    senderName: sender?.name ?? "Unknown", createdAt: msg.createdAt, fromMe: true,
  }, 201);
});
