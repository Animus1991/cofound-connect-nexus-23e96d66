import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { db } from "../db/index.js";
import {
  users,
  connectionRequests,
  connections,
  conversationParticipants,
  messages,
} from "../db/schema.js";
import { eq, and, or, desc, inArray, ne } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";

export interface NotificationItem {
  id: string;
  type: "connection_request" | "connection_accepted" | "new_message";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  metadata: Record<string, unknown>;
}

export const notificationsRoutes = new Hono<AppEnv>();
notificationsRoutes.use("*", authMiddleware);

/**
 * GET /api/notifications
 * Derives notifications from real data:
 * - Pending incoming connection requests
 * - Connections accepted in last 7 days
 * - Conversations where the last message is NOT from me (unread indication)
 *
 * No separate notifications table yet — computed on every request.
 * Phase 3 will add a dedicated table with read/unread state persisted.
 */
notificationsRoutes.get("/", (c) => {
  const userId = c.get("userId") as string;
  const notifications: NotificationItem[] = [];

  // ── 1. Pending incoming connection requests ───────────────────────────────
  const incomingReqs = db
    .select()
    .from(connectionRequests)
    .where(and(eq(connectionRequests.toId, userId), eq(connectionRequests.status, "pending")))
    .orderBy(desc(connectionRequests.createdAt))
    .limit(20)
    .all();

  const fromIds = incomingReqs.map((r) => r.fromId);
  const reqUserMap = new Map<string, { id: string; name: string | null }>();
  if (fromIds.length > 0) {
    db.select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, fromIds))
      .all()
      .forEach((u) => reqUserMap.set(u.id, u));
  }

  for (const req of incomingReqs) {
    const from = reqUserMap.get(req.fromId);
    notifications.push({
      id: `req-${req.id}`,
      type: "connection_request",
      title: "New connection request",
      body: `${from?.name ?? "Someone"} wants to connect with you.`,
      createdAt: req.createdAt,
      read: false,
      metadata: { requestId: req.id, fromId: req.fromId, fromName: from?.name ?? null },
    });
  }

  // ── 2. Connections accepted in last 7 days ────────────────────────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentConnections = db
    .select()
    .from(connections)
    .where(and(eq(connections.userId, userId)))
    .orderBy(desc(connections.createdAt))
    .limit(10)
    .all()
    .filter((conn) => conn.createdAt >= sevenDaysAgo);

  const connTargetIds = recentConnections.map((c) => c.targetId);
  const connUserMap = new Map<string, { id: string; name: string | null }>();
  if (connTargetIds.length > 0) {
    db.select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, connTargetIds))
      .all()
      .forEach((u) => connUserMap.set(u.id, u));
  }

  for (const conn of recentConnections) {
    const other = connUserMap.get(conn.targetId);
    notifications.push({
      id: `conn-${conn.id}`,
      type: "connection_accepted",
      title: "Connection made",
      body: `You are now connected with ${other?.name ?? "a new contact"}.`,
      createdAt: conn.createdAt,
      read: false,
      metadata: { userId: conn.targetId, userName: other?.name ?? null },
    });
  }

  // ── 3. Conversations with unread messages (last message not from me) ───────
  const myConvParticipations = db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, userId))
    .all();

  const myConvIds = myConvParticipations.map((p) => p.conversationId);

  if (myConvIds.length > 0) {
    // Get all participants to find other users
    const allParts = db
      .select()
      .from(conversationParticipants)
      .where(inArray(conversationParticipants.conversationId, myConvIds))
      .all();

    const otherUserMap = new Map<string, string>(); // convId → otherUserId
    for (const p of allParts) {
      if (p.userId !== userId) otherUserMap.set(p.conversationId, p.userId);
    }

    // Get last message per conversation
    const allMsgs = db
      .select()
      .from(messages)
      .where(inArray(messages.conversationId, myConvIds))
      .orderBy(desc(messages.createdAt))
      .all();

    const lastMsgByConv = new Map<string, typeof messages.$inferSelect>();
    for (const m of allMsgs) {
      if (!lastMsgByConv.has(m.conversationId)) lastMsgByConv.set(m.conversationId, m);
    }

    // Collect sender IDs from last messages not sent by me
    const unreadSenderIds: string[] = [];
    for (const [convId, lastMsg] of lastMsgByConv) {
      if (lastMsg.senderId !== userId) unreadSenderIds.push(lastMsg.senderId);
    }

    const senderUserMap = new Map<string, { id: string; name: string | null }>();
    if (unreadSenderIds.length > 0) {
      db.select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, [...new Set(unreadSenderIds)]))
        .all()
        .forEach((u) => senderUserMap.set(u.id, u));
    }

    for (const [convId, lastMsg] of lastMsgByConv) {
      if (lastMsg.senderId === userId) continue; // sent by me — not unread
      const sender = senderUserMap.get(lastMsg.senderId);
      notifications.push({
        id: `msg-${lastMsg.id}`,
        type: "new_message",
        title: "New message",
        body: `${sender?.name ?? "Someone"} sent you a message.`,
        createdAt: lastMsg.createdAt,
        read: false,
        metadata: { conversationId: convId, senderId: lastMsg.senderId, senderName: sender?.name ?? null },
      });
    }
  }

  // Sort by createdAt descending
  notifications.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const unreadCount = notifications.filter((n) => !n.read).length;

  return c.json({ notifications: notifications.slice(0, 30), unreadCount });
});
