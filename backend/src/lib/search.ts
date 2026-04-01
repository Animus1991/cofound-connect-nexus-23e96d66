/**
 * Orama full-text search service.
 *
 * Two in-memory indexes are maintained:
 *  - usersIndex   — searchable by name, headline, bio, skills, location
 *  - oppsIndex    — searchable by title, description, skills, type, stage
 *
 * The indexes are built lazily on first use and can be force-rebuilt by
 * calling rebuildAll().  Individual document mutations call upsert/remove
 * helpers so indexes stay hot without a full rebuild.
 */

import { create, insert, remove, search, update } from "@orama/orama";
import type { Orama, Results } from "@orama/orama";
import { db } from "../db/index.js";
import { users, profiles, opportunities } from "../db/schema.js";
import { eq, inArray } from "drizzle-orm";
import { logger } from "./logger.js";

// ── Schema definitions ────────────────────────────────────────────────────

const userSchema = {
  id: "string",
  name: "string",
  headline: "string",
  bio: "string",
  skills: "string",
  location: "string",
  stage: "string",
} as const;

const oppSchema = {
  id: "string",
  title: "string",
  description: "string",
  skills: "string",
  type: "string",
  stage: "string",
  location: "string",
  orgName: "string",
} as const;

type UserIndex = Orama<typeof userSchema>;
type OppIndex = Orama<typeof oppSchema>;

let usersIndex: UserIndex | null = null;
let oppsIndex: OppIndex | null = null;
let indexReady = false;

// ── Build helpers ────────────────────────────────────────────────────────

async function buildUsersIndex(): Promise<UserIndex> {
  const idx = await create({ schema: userSchema });

  const allUsers = db.select({ id: users.id, name: users.name }).from(users).all();
  const userIds = allUsers.map((u) => u.id);

  const profileMap = new Map<string, typeof profiles.$inferSelect>();
  if (userIds.length > 0) {
    db.select().from(profiles).where(inArray(profiles.userId, userIds)).all()
      .forEach((p) => profileMap.set(p.userId, p));
  }

  for (const u of allUsers) {
    const p = profileMap.get(u.id);
    await insert(idx, {
      id: u.id,
      name: u.name ?? "",
      headline: p?.headline ?? "",
      bio: p?.bio ?? "",
      skills: parseSkills(p?.skills),
      location: p?.location ?? "",
      stage: p?.stage ?? "",
    });
  }

  return idx;
}

async function buildOppsIndex(): Promise<OppIndex> {
  const idx = await create({ schema: oppSchema });

  const allOpps = db.select().from(opportunities).all();
  const ownerIds = [...new Set(allOpps.map((o) => o.userId))];
  const ownerMap = new Map<string, { name: string | null }>();
  if (ownerIds.length > 0) {
    db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, ownerIds)).all()
      .forEach((u) => ownerMap.set(u.id, u));
  }

  for (const o of allOpps) {
    await insert(idx, {
      id: o.id,
      title: o.title,
      description: o.description ?? "",
      skills: parseSkills(o.skills),
      type: o.type ?? "",
      stage: o.stage ?? "",
      location: o.location ?? "",
      orgName: ownerMap.get(o.userId)?.name ?? "",
    });
  }

  return idx;
}

function parseSkills(s: string | null | undefined): string {
  if (!s) return "";
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr.join(" ") : "";
  } catch {
    return "";
  }
}

// ── Public API ────────────────────────────────────────────────────────────

export async function ensureIndexes(): Promise<void> {
  if (indexReady) return;
  try {
    [usersIndex, oppsIndex] = await Promise.all([buildUsersIndex(), buildOppsIndex()]);
    indexReady = true;
    logger.info("Orama search indexes built");
  } catch (err) {
    logger.warn({ err }, "Orama index build failed (search degraded)");
  }
}

export async function rebuildAll(): Promise<void> {
  indexReady = false;
  usersIndex = null;
  oppsIndex = null;
  await ensureIndexes();
}

export async function searchUsers(term: string, limit = 20): Promise<Results<typeof userSchema>> {
  await ensureIndexes();
  if (!usersIndex) throw new Error("Users index not ready");
  return search(usersIndex, { term, limit, tolerance: 1 });
}

export async function searchOpportunities(term: string, limit = 20): Promise<Results<typeof oppSchema>> {
  await ensureIndexes();
  if (!oppsIndex) throw new Error("Opportunities index not ready");
  return search(oppsIndex, { term, limit, tolerance: 1 });
}

// ── Incremental updates ──────────────────────────────────────────────────
// Call these from mutation routes so the in-memory index stays consistent
// without requiring a full rebuild on every write.

export async function upsertUserInIndex(userId: string): Promise<void> {
  try {
    await ensureIndexes();
    if (!usersIndex) return;

    const u = db.select().from(users).where(eq(users.id, userId)).get();
    if (!u) return;
    const p = db.select().from(profiles).where(eq(profiles.userId, userId)).get();

    const doc = {
      id: u.id,
      name: u.name ?? "",
      headline: p?.headline ?? "",
      bio: p?.bio ?? "",
      skills: parseSkills(p?.skills),
      location: p?.location ?? "",
      stage: p?.stage ?? "",
    };

    try {
      await update(usersIndex, userId, doc);
    } catch {
      await insert(usersIndex, doc);
    }
  } catch (err) {
    logger.warn({ err, userId }, "upsertUserInIndex failed (non-fatal)");
  }
}

export async function upsertOpportunityInIndex(oppId: string): Promise<void> {
  try {
    await ensureIndexes();
    if (!oppsIndex) return;

    const o = db.select().from(opportunities).where(eq(opportunities.id, oppId)).get();
    if (!o) return;
    const owner = db.select({ name: users.name }).from(users).where(eq(users.id, o.userId)).get();

    const doc = {
      id: o.id,
      title: o.title,
      description: o.description ?? "",
      skills: parseSkills(o.skills),
      type: o.type ?? "",
      stage: o.stage ?? "",
      location: o.location ?? "",
      orgName: owner?.name ?? "",
    };

    try {
      await update(oppsIndex, oppId, doc);
    } catch {
      await insert(oppsIndex, doc);
    }
  } catch (err) {
    logger.warn({ err, oppId }, "upsertOpportunityInIndex failed (non-fatal)");
  }
}

export async function removeOpportunityFromIndex(oppId: string): Promise<void> {
  try {
    if (!oppsIndex) return;
    await remove(oppsIndex, oppId);
  } catch (err) {
    logger.warn({ err, oppId }, "removeOpportunityFromIndex failed (non-fatal)");
  }
}
