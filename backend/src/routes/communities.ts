import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { db } from "../db/index.js";
import {
  communities, communityMemberships, communityPosts, communityPostComments, users,
} from "../db/schema.js";
import { eq, and, ne, desc, inArray } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { logActivity } from "../lib/activity.js";
import { z } from "zod";

export const communitiesRoutes = new Hono<AppEnv>();
communitiesRoutes.use("*", authMiddleware);

// ── GET /api/communities — list all public communities ───────────────────────

communitiesRoutes.get("/", (c) => {
  const userId = c.get("userId");
  const all = db.select().from(communities).where(eq(communities.isPublic, true)).all();

  const myMemberships = db.select({ communityId: communityMemberships.communityId })
    .from(communityMemberships).where(eq(communityMemberships.userId, userId)).all();
  const memberSet = new Set(myMemberships.map((m) => m.communityId));

  return c.json({
    communities: all.map((c) => ({
      ...c,
      tags: JSON.parse(c.tags),
      isMember: memberSet.has(c.id),
    })),
  });
});

// ── POST /api/communities — create a community ───────────────────────────────

const createSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string()).max(10).optional(),
  isPublic: z.boolean().optional(),
});

communitiesRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parse = createSchema.safeParse(body);
  if (!parse.success) return c.json({ error: "Validation failed", details: parse.error.flatten() }, 400);

  const { tags = [], isPublic = true, ...rest } = parse.data;
  const community = db.insert(communities).values({
    ownerId: userId,
    tags: JSON.stringify(tags),
    isPublic,
    ...rest,
  }).returning().get();

  // Owner auto-joins as owner
  db.insert(communityMemberships).values({ communityId: community.id, userId, role: "owner" }).run();
  db.update(communities).set({ memberCount: 1 }).where(eq(communities.id, community.id)).run();

  logActivity(userId, "community_created", { communityId: community.id });
  return c.json({ community: { ...community, tags } }, 201);
});

// ── GET /api/communities/:id ─────────────────────────────────────────────────

communitiesRoutes.get("/:id", (c) => {
  const userId = c.get("userId");
  const communityId = c.req.param("id");

  const community = db.select().from(communities).where(eq(communities.id, communityId)).get();
  if (!community) return c.json({ error: "Not found" }, 404);

  const membership = db.select().from(communityMemberships)
    .where(and(eq(communityMemberships.communityId, communityId), eq(communityMemberships.userId, userId))).get();

  // Get recent members
  const memberships = db.select().from(communityMemberships)
    .where(eq(communityMemberships.communityId, communityId)).all();
  const memberIds = memberships.map((m) => m.userId);
  const memberUsers = memberIds.length
    ? db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, memberIds)).all()
    : [];
  const userMap = new Map(memberUsers.map((u) => [u.id, u]));

  return c.json({
    community: {
      ...community,
      tags: JSON.parse(community.tags),
      isMember: !!membership,
      myRole: membership?.role ?? null,
      recentMembers: memberships.slice(0, 6).map((m) => ({
        userId: m.userId,
        name: userMap.get(m.userId)?.name ?? "Unknown",
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    },
  });
});

// ── POST /api/communities/:id/join ───────────────────────────────────────────

communitiesRoutes.post("/:id/join", (c) => {
  const userId = c.get("userId");
  const communityId = c.req.param("id");

  const community = db.select().from(communities).where(eq(communities.id, communityId)).get();
  if (!community) return c.json({ error: "Not found" }, 404);

  const existing = db.select({ id: communityMemberships.id }).from(communityMemberships)
    .where(and(eq(communityMemberships.communityId, communityId), eq(communityMemberships.userId, userId))).get();
  if (existing) return c.json({ error: "Already a member" }, 409);

  db.insert(communityMemberships).values({ communityId, userId, role: "member" }).run();
  db.update(communities).set({ memberCount: (community.memberCount ?? 0) + 1 }).where(eq(communities.id, communityId)).run();
  logActivity(userId, "community_joined", { communityId });

  return c.json({ ok: true });
});

// ── POST /api/communities/:id/leave ──────────────────────────────────────────

communitiesRoutes.post("/:id/leave", (c) => {
  const userId = c.get("userId");
  const communityId = c.req.param("id");

  const community = db.select().from(communities).where(eq(communities.id, communityId)).get();
  if (!community) return c.json({ error: "Not found" }, 404);
  if (community.ownerId === userId) return c.json({ error: "Owner cannot leave their own community" }, 400);

  db.delete(communityMemberships)
    .where(and(eq(communityMemberships.communityId, communityId), eq(communityMemberships.userId, userId))).run();
  const current = community.memberCount ?? 1;
  db.update(communities).set({ memberCount: Math.max(0, current - 1) }).where(eq(communities.id, communityId)).run();

  return c.json({ ok: true });
});

// ── GET /api/communities/:id/posts ───────────────────────────────────────────

communitiesRoutes.get("/:id/posts", (c) => {
  const communityId = c.req.param("id");
  const limit = Math.min(50, parseInt(c.req.query("limit") ?? "20", 10));
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const offset = (page - 1) * limit;

  const community = db.select({ id: communities.id }).from(communities).where(eq(communities.id, communityId)).get();
  if (!community) return c.json({ error: "Not found" }, 404);

  const posts = db.select().from(communityPosts)
    .where(eq(communityPosts.communityId, communityId))
    .orderBy(desc(communityPosts.isPinned), desc(communityPosts.createdAt))
    .limit(limit).offset(offset).all();

  const authorIds = [...new Set(posts.map((p) => p.authorId))];
  const authorUsers = authorIds.length
    ? db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, authorIds)).all()
    : [];
  const authorMap = new Map(authorUsers.map((u) => [u.id, u]));

  return c.json({
    posts: posts.map((p) => ({
      ...p,
      author: { id: p.authorId, name: authorMap.get(p.authorId)?.name ?? "Unknown" },
    })),
    page,
    limit,
  });
});

// ── POST /api/communities/:id/posts ─────────────────────────────────────────

const postSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(10000),
  type: z.enum(["post", "question", "announcement"]).optional(),
});

communitiesRoutes.post("/:id/posts", async (c) => {
  const userId = c.get("userId");
  const communityId = c.req.param("id");

  const community = db.select().from(communities).where(eq(communities.id, communityId)).get();
  if (!community) return c.json({ error: "Not found" }, 404);

  const membership = db.select({ id: communityMemberships.id }).from(communityMemberships)
    .where(and(eq(communityMemberships.communityId, communityId), eq(communityMemberships.userId, userId))).get();
  if (!membership) return c.json({ error: "Join the community first to post" }, 403);

  const body = await c.req.json().catch(() => ({}));
  const parse = postSchema.safeParse(body);
  if (!parse.success) return c.json({ error: "Validation failed", details: parse.error.flatten() }, 400);

  const post = db.insert(communityPosts).values({
    communityId,
    authorId: userId,
    title: parse.data.title,
    content: parse.data.content,
    type: parse.data.type ?? "post",
  }).returning().get();

  db.update(communities).set({ postCount: (community.postCount ?? 0) + 1 }).where(eq(communities.id, communityId)).run();
  logActivity(userId, "post_created", { communityId, postId: post.id });

  const author = db.select({ name: users.name }).from(users).where(eq(users.id, userId)).get();

  return c.json({
    post: { ...post, author: { id: userId, name: author?.name ?? "Unknown" } },
  }, 201);
});

// ── GET /api/communities/:id/posts/:postId ───────────────────────────────────

communitiesRoutes.get("/:id/posts/:postId", (c) => {
  const postId = c.req.param("postId");

  const post = db.select().from(communityPosts).where(eq(communityPosts.id, postId)).get();
  if (!post) return c.json({ error: "Not found" }, 404);

  const comments = db.select().from(communityPostComments)
    .where(eq(communityPostComments.postId, postId))
    .orderBy(communityPostComments.createdAt).all();

  const allUserIds = [...new Set([post.authorId, ...comments.map((c) => c.authorId)])];
  const allUsers = allUserIds.length
    ? db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, allUserIds)).all()
    : [];
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  return c.json({
    post: {
      ...post,
      author: { id: post.authorId, name: userMap.get(post.authorId)?.name ?? "Unknown" },
    },
    comments: comments.map((c) => ({
      ...c,
      author: { id: c.authorId, name: userMap.get(c.authorId)?.name ?? "Unknown" },
    })),
  });
});

// ── POST /api/communities/:id/posts/:postId/comments ─────────────────────────

const commentSchema = z.object({
  content: z.string().min(1).max(5000),
});

communitiesRoutes.post("/:id/posts/:postId/comments", async (c) => {
  const userId = c.get("userId");
  const postId = c.req.param("postId");

  const post = db.select().from(communityPosts).where(eq(communityPosts.id, postId)).get();
  if (!post) return c.json({ error: "Post not found" }, 404);

  const body = await c.req.json().catch(() => ({}));
  const parse = commentSchema.safeParse(body);
  if (!parse.success) return c.json({ error: "Validation failed", details: parse.error.flatten() }, 400);

  const comment = db.insert(communityPostComments).values({
    postId,
    authorId: userId,
    content: parse.data.content,
  }).returning().get();

  db.update(communityPosts).set({ commentCount: (post.commentCount ?? 0) + 1 }).where(eq(communityPosts.id, postId)).run();

  const author = db.select({ name: users.name }).from(users).where(eq(users.id, userId)).get();
  return c.json({ comment: { ...comment, author: { id: userId, name: author?.name ?? "Unknown" } } }, 201);
});
