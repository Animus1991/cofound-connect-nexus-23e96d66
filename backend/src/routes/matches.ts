import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { users, profiles, matchPreferences, matchSuggestions, connections, connectionRequests } from "../db/schema.js";
import { eq, and, ne, or, inArray } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { z } from "zod";

export const matchesRoutes = new Hono<AppEnv>();
matchesRoutes.use("*", authMiddleware);

// ── Compatibility Scoring ─────────────────────────────────────────────────────

type DimensionScores = {
  skills: number;
  role: number;
  industry: number;
  stage: number;
  commitment: number;
  location: number;
  workStyle: number;
};

const WEIGHTS: DimensionScores = {
  skills: 0.22,
  role: 0.18,
  industry: 0.18,
  stage: 0.12,
  commitment: 0.15,
  location: 0.08,
  workStyle: 0.07,
};

function parseJson<T>(str: string, fallback: T): T {
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

function overlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b.map((x) => x.toLowerCase()));
  const common = a.filter((x) => setB.has(x.toLowerCase())).length;
  return Math.round((common / Math.max(a.length, b.length)) * 100);
}

function complementaryScore(mySkills: string[], theirSkills: string[], myDesired: string[], theirDesired: string[]): number {
  // How well do their skills cover what I want?
  const cover1 = myDesired.length ? overlap(theirSkills, myDesired) : 50;
  // How well do my skills cover what they want?
  const cover2 = theirDesired.length ? overlap(mySkills, theirDesired) : 50;
  return Math.round((cover1 + cover2) / 2);
}

function roleScore(myLookingFor: string[], theirSkills: string[], theirProfile: { commitment?: string | null; stage?: string | null }): number {
  if (!myLookingFor.length) return 60;
  const roleKeywords: Record<string, string[]> = {
    technical: ["react", "node.js", "python", "engineering", "developer", "devops", "backend", "frontend", "ai/ml", "data"],
    business: ["sales", "marketing", "finance", "growth", "strategy", "operations", "bd"],
    design: ["ui/ux", "design", "figma", "product design"],
    marketing: ["marketing", "growth", "seo", "content", "brand"],
    finance: ["finance", "fundraising", "accounting", "cfo", "financial"],
  };
  const allSkillsLower = theirSkills.map((s) => s.toLowerCase());
  let best = 0;
  for (const wantedRole of myLookingFor) {
    const keywords = roleKeywords[wantedRole.toLowerCase()] ?? [];
    if (!keywords.length) { best = Math.max(best, 50); continue; }
    const matches = keywords.filter((k) => allSkillsLower.some((s) => s.includes(k))).length;
    const score = Math.min(100, Math.round((matches / keywords.length) * 100));
    best = Math.max(best, score);
  }
  return best;
}

function stageScore(myStage: string | null | undefined, theirStage: string | null | undefined): number {
  if (!myStage || !theirStage) return 60;
  if (myStage === theirStage) return 100;
  const order = ["idea", "mvp", "traction", "growth", "scale", "seed", "series_a", "early_traction"];
  const iA = order.indexOf(myStage);
  const iB = order.indexOf(theirStage);
  if (iA === -1 || iB === -1) return 60;
  const diff = Math.abs(iA - iB);
  return diff === 0 ? 100 : diff === 1 ? 75 : diff === 2 ? 50 : 25;
}

function commitmentScore(my: string | null | undefined, their: string | null | undefined): number {
  if (!my || !their) return 60;
  if (my === their) return 100;
  const tiers: Record<string, number> = { "full-time": 3, fulltime: 3, "part-time": 2, parttime: 2, flexible: 2, weekends: 1, "weekends only": 1 };
  const a = tiers[my.toLowerCase()] ?? 2;
  const b = tiers[their.toLowerCase()] ?? 2;
  const diff = Math.abs(a - b);
  return diff === 0 ? 100 : diff === 1 ? 65 : 30;
}

function locationScore(myPref: string, theirPref: string, myGeo: string, theirGeo: string): number {
  if (myPref === "remote" || theirPref === "remote") return 90;
  if (myPref === "hybrid" && theirPref !== "onsite") return 75;
  if (myPref === "onsite" && theirPref === "onsite") return 100;
  if (myGeo === "global" || theirGeo === "global") return 80;
  return 60;
}

function workStyleScore(my: string | null | undefined, their: string | null | undefined): number {
  if (!my || !their) return 65;
  if (my === their) return 100;
  const compatible: Record<string, string[]> = {
    structured: ["structured"],
    flexible: ["flexible", "async"],
    async: ["async", "flexible"],
    sync: ["sync", "structured"],
  };
  return (compatible[my] ?? []).includes(their) ? 80 : 45;
}

function computeScore(
  myProfile: { skills: string; interests: string; stage?: string | null; commitment?: string | null },
  myPrefs: { lookingForRoles: string; desiredSkills: string; preferredIndustries: string; preferredStage?: string | null; preferredCommitment?: string | null; workLocationPreference: string; geographicOpenness: string; workStyle?: string | null } | null,
  theirProfile: { skills: string; interests: string; stage?: string | null; commitment?: string | null },
  theirPrefs: { lookingForRoles: string; desiredSkills: string; preferredIndustries: string; preferredStage?: string | null; preferredCommitment?: string | null; workLocationPreference: string; geographicOpenness: string; workStyle?: string | null } | null,
): { overall: number; dimensions: DimensionScores; explanation: string; sharedStrengths: string[]; complementaryStrengths: string[]; mismatches: string[] } {
  const mySkills = parseJson<string[]>(myProfile.skills, []);
  const myInterests = parseJson<string[]>(myProfile.interests, []);
  const theirSkills = parseJson<string[]>(theirProfile.skills, []);
  const theirInterests = parseJson<string[]>(theirProfile.interests, []);

  const myDesiredSkills = parseJson<string[]>(myPrefs?.desiredSkills ?? "[]", []);
  const theirDesiredSkills = parseJson<string[]>(theirPrefs?.desiredSkills ?? "[]", []);
  const myLookingFor = parseJson<string[]>(myPrefs?.lookingForRoles ?? "[]", []);
  const myPrefIndustries = parseJson<string[]>(myPrefs?.preferredIndustries ?? "[]", []);
  const theirPrefIndustries = parseJson<string[]>(theirPrefs?.preferredIndustries ?? "[]", []);

  const dims: DimensionScores = {
    skills: complementaryScore(mySkills, theirSkills, myDesiredSkills, theirDesiredSkills),
    role: roleScore(myLookingFor, theirSkills, theirProfile),
    industry: overlap([...myInterests, ...myPrefIndustries], [...theirInterests, ...theirPrefIndustries]) || 55,
    stage: stageScore(myPrefs?.preferredStage ?? myProfile.stage, theirProfile.stage),
    commitment: commitmentScore(myPrefs?.preferredCommitment ?? myProfile.commitment, theirProfile.commitment),
    location: locationScore(
      myPrefs?.workLocationPreference ?? "remote",
      theirPrefs?.workLocationPreference ?? "remote",
      myPrefs?.geographicOpenness ?? "global",
      theirPrefs?.geographicOpenness ?? "global",
    ),
    workStyle: workStyleScore(myPrefs?.workStyle, theirPrefs?.workStyle),
  };

  const overall = Math.round(
    dims.skills * WEIGHTS.skills +
    dims.role * WEIGHTS.role +
    dims.industry * WEIGHTS.industry +
    dims.stage * WEIGHTS.stage +
    dims.commitment * WEIGHTS.commitment +
    dims.location * WEIGHTS.location +
    dims.workStyle * WEIGHTS.workStyle,
  );

  // Shared strengths = overlapping skills/interests
  const setTheirs = new Set(theirSkills.map((s) => s.toLowerCase()));
  const sharedStrengths = mySkills.filter((s) => setTheirs.has(s.toLowerCase())).slice(0, 4);

  // Complementary = skills they have that you don't
  const setMine = new Set(mySkills.map((s) => s.toLowerCase()));
  const complementaryStrengths = theirSkills.filter((s) => !setMine.has(s.toLowerCase())).slice(0, 4);

  // Mismatches
  const mismatches: string[] = [];
  if (dims.commitment < 50) mismatches.push("Different availability expectations");
  if (dims.stage < 40) mismatches.push("Different startup stage focus");
  if (dims.location < 40) mismatches.push("Location preference may differ");
  if (dims.workStyle < 40) mismatches.push("Work styles may clash");

  // Explanation
  const topDim = (Object.entries(dims) as [keyof DimensionScores, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
  const explainMap: Record<keyof DimensionScores, string> = {
    skills: "strong skill complementarity",
    role: "role alignment",
    industry: "shared industry focus",
    stage: "matched startup stage",
    commitment: "compatible availability",
    location: "flexible on location",
    workStyle: "compatible work style",
  };
  const explanation = overall >= 80
    ? `Excellent match — especially strong on ${explainMap[topDim]}${sharedStrengths.length ? ` with shared background in ${sharedStrengths.slice(0, 2).join(", ")}` : ""}.`
    : overall >= 65
    ? `Good potential match with ${explainMap[topDim]}${complementaryStrengths.length ? `. They bring ${complementaryStrengths.slice(0, 2).join(", ")} to complement your skills` : ""}.`
    : `Moderate compatibility — worth exploring if ${mismatches.length ? mismatches[0].toLowerCase() + " can be resolved" : "goals align"}.`;

  return { overall, dimensions: dims, explanation, sharedStrengths, complementaryStrengths, mismatches };
}

// ── GET /api/matches — paginated ranked match list ────────────────────────────

matchesRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query("limit") ?? "20", 10)));
  const stageFilter = c.req.query("stage");
  const commitmentFilter = c.req.query("commitment");
  const minScore = parseInt(c.req.query("minScore") ?? "0", 10);

  try {
    // Fetch requesting user's profile + prefs
    const myProfile = db.select().from(profiles).where(eq(profiles.userId, userId)).get();
    if (!myProfile) return c.json({ matches: [], total: 0, page, limit }, 200);

    const myPrefs = db.select().from(matchPreferences).where(eq(matchPreferences.userId, userId)).get() ?? null;

    // Get existing connections (to exclude them from matches)
    const myConns = db.select({ targetId: connections.targetId }).from(connections).where(eq(connections.userId, userId)).all();
    const myConnsReverse = db.select({ userId: connections.userId }).from(connections).where(eq(connections.targetId, userId)).all();
    const connectedIds = new Set([...myConns.map((c) => c.targetId), ...myConnsReverse.map((c) => c.userId)]);

    // Get sent/received pending requests (to avoid re-showing)
    const pendingReqs = db.select({ fromId: connectionRequests.fromId, toId: connectionRequests.toId })
      .from(connectionRequests)
      .where(
        and(
          eq(connectionRequests.status, "pending"),
          or(eq(connectionRequests.fromId, userId), eq(connectionRequests.toId, userId)),
        )
      ).all();
    const pendingIds = new Set(pendingReqs.flatMap((r) => [r.fromId, r.toId]).filter((id) => id !== userId));

    // Fetch all candidate profiles (excluding self, connected, pending)
    const candidates = db.select({
      userId: profiles.userId,
      skills: profiles.skills,
      interests: profiles.interests,
      stage: profiles.stage,
      commitment: profiles.commitment,
      headline: profiles.headline,
      location: profiles.location,
      availability: profiles.availability,
    }).from(profiles)
      .where(ne(profiles.userId, userId))
      .all()
      .filter((p) => !connectedIds.has(p.userId) && !pendingIds.has(p.userId));

    if (!candidates.length) return c.json({ matches: [], total: 0, page, limit });

    // Fetch candidate users (names) and preferences
    const candidateIds = candidates.map((c) => c.userId);
    const candidateUsers = db.select({ id: users.id, name: users.name }).from(users)
      .where(inArray(users.id, candidateIds)).all();
    const userMap = new Map(candidateUsers.map((u) => [u.id, u]));

    const candidatePrefs = db.select().from(matchPreferences)
      .where(inArray(matchPreferences.userId, candidateIds)).all();
    const prefsMap = new Map(candidatePrefs.map((p) => [p.userId, p]));

    // Compute scores
    const scored = candidates.map((candidate) => {
      const theirPrefs = prefsMap.get(candidate.userId) ?? null;
      const result = computeScore(myProfile, myPrefs, candidate, theirPrefs);
      return {
        userId: candidate.userId,
        name: userMap.get(candidate.userId)?.name ?? "Unknown",
        headline: candidate.headline,
        location: candidate.location,
        stage: candidate.stage,
        commitment: candidate.commitment,
        skills: parseJson<string[]>(candidate.skills, []),
        interests: parseJson<string[]>(candidate.interests, []),
        score: result.overall,
        dimensions: result.dimensions,
        explanation: result.explanation,
        sharedStrengths: result.sharedStrengths,
        complementaryStrengths: result.complementaryStrengths,
        mismatches: result.mismatches,
      };
    });

    // Apply filters
    let filtered = scored.filter((m) => m.score >= minScore);
    if (stageFilter) filtered = filtered.filter((m) => m.stage === stageFilter);
    if (commitmentFilter) filtered = filtered.filter((m) => m.commitment === commitmentFilter);

    // Sort by score descending
    filtered.sort((a, b) => b.score - a.score);

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return c.json({ matches: paginated, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error({ err }, "Matches fetch failed");
    return c.json({ error: "Failed to compute matches" }, 500);
  }
});

// ── GET /api/matches/preferences — get current user's match preferences ───────

matchesRoutes.get("/preferences", (c) => {
  const userId = c.get("userId");
  const prefs = db.select().from(matchPreferences).where(eq(matchPreferences.userId, userId)).get();
  return c.json({ preferences: prefs ?? null });
});

// ── PUT /api/matches/preferences — upsert match preferences ──────────────────

const prefsSchema = z.object({
  lookingForRoles: z.array(z.string()).optional(),
  desiredSkills: z.array(z.string()).optional(),
  preferredIndustries: z.array(z.string()).optional(),
  preferredStage: z.string().optional(),
  preferredCommitment: z.string().optional(),
  workLocationPreference: z.enum(["remote", "hybrid", "onsite"]).optional(),
  geographicOpenness: z.enum(["local", "regional", "global"]).optional(),
  workStyle: z.string().optional(),
  riskTolerance: z.string().optional(),
  missionOrientation: z.string().optional(),
  visibleInFeed: z.boolean().optional(),
});

matchesRoutes.put("/preferences", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parse = prefsSchema.safeParse(body);
  if (!parse.success) return c.json({ error: "Validation failed", details: parse.error.flatten() }, 400);

  const d = parse.data;
  const existing = db.select({ id: matchPreferences.id }).from(matchPreferences).where(eq(matchPreferences.userId, userId)).get();

  if (existing) {
    db.update(matchPreferences).set({
      ...(d.lookingForRoles !== undefined ? { lookingForRoles: JSON.stringify(d.lookingForRoles) } : {}),
      ...(d.desiredSkills !== undefined ? { desiredSkills: JSON.stringify(d.desiredSkills) } : {}),
      ...(d.preferredIndustries !== undefined ? { preferredIndustries: JSON.stringify(d.preferredIndustries) } : {}),
      ...(d.preferredStage !== undefined ? { preferredStage: d.preferredStage } : {}),
      ...(d.preferredCommitment !== undefined ? { preferredCommitment: d.preferredCommitment } : {}),
      ...(d.workLocationPreference !== undefined ? { workLocationPreference: d.workLocationPreference } : {}),
      ...(d.geographicOpenness !== undefined ? { geographicOpenness: d.geographicOpenness } : {}),
      ...(d.workStyle !== undefined ? { workStyle: d.workStyle } : {}),
      ...(d.riskTolerance !== undefined ? { riskTolerance: d.riskTolerance } : {}),
      ...(d.missionOrientation !== undefined ? { missionOrientation: d.missionOrientation } : {}),
      ...(d.visibleInFeed !== undefined ? { visibleInFeed: d.visibleInFeed } : {}),
      updatedAt: new Date().toISOString(),
    }).where(eq(matchPreferences.userId, userId)).run();
  } else {
    db.insert(matchPreferences).values({
      userId,
      lookingForRoles: JSON.stringify(d.lookingForRoles ?? []),
      desiredSkills: JSON.stringify(d.desiredSkills ?? []),
      preferredIndustries: JSON.stringify(d.preferredIndustries ?? []),
      preferredStage: d.preferredStage,
      preferredCommitment: d.preferredCommitment,
      workLocationPreference: d.workLocationPreference ?? "remote",
      geographicOpenness: d.geographicOpenness ?? "global",
      workStyle: d.workStyle,
      riskTolerance: d.riskTolerance,
      missionOrientation: d.missionOrientation,
      visibleInFeed: d.visibleInFeed ?? true,
    }).run();
  }

  const updated = db.select().from(matchPreferences).where(eq(matchPreferences.userId, userId)).get();
  return c.json({ preferences: updated });
});
