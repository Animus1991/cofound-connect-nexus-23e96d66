import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { and, eq, inArray, ne, or } from "drizzle-orm";
import type * as schema from "../db/schema.js";
import {
  users,
  profiles,
  matchPreferences,
  connections,
  connectionRequests,
  matchModelVersions,
  matchScores,
  matchInferenceLogs,
  matchFeatureVectors,
  userBehaviorSignals,
  matchOutcomes,
  matchFeedback,
} from "../db/schema.js";

type Db = BetterSQLite3Database<typeof schema>;

function parseJson<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").split(/\s+/).filter((t) => t.length >= 3).slice(0, 400);
}

function cosineSim(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, na = 0, nb = 0;
  for (const v of a.values()) na += v * v;
  for (const v of b.values()) nb += v * v;
  for (const [k, va] of a.entries()) { const vb = b.get(k); if (vb !== undefined) dot += va * vb; }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function tf(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  const denom = Math.max(1, tokens.length);
  for (const [k, v] of m.entries()) m.set(k, v / denom);
  return m;
}

function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const sa = new Set(a.map((x) => x.toLowerCase()));
  const sb = new Set(b.map((x) => x.toLowerCase()));
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter += 1;
  const uni = sa.size + sb.size - inter;
  return uni === 0 ? 0 : inter / uni;
}

function stageDistance(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b) return 0.35;
  const order = ["idea", "mvp", "early_traction", "traction", "growth", "scale", "seed", "series_a"];
  const ia = order.indexOf(a), ib = order.indexOf(b);
  if (ia === -1 || ib === -1) return 0.35;
  const diff = Math.abs(ia - ib);
  return diff === 0 ? 0 : diff === 1 ? 0.15 : diff === 2 ? 0.3 : 0.55;
}

function commitmentDistance(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b) return 0.3;
  const tiers: Record<string, number> = { "full-time": 3, fulltime: 3, "part-time": 2, parttime: 2, flexible: 2, weekends: 1, "weekends only": 1, "20h/week": 2, freelance: 1 };
  const diff = Math.abs((tiers[a.toLowerCase()] ?? 2) - (tiers[b.toLowerCase()] ?? 2));
  return diff === 0 ? 0 : diff === 1 ? 0.35 : 0.7;
}

export type MatchingWeights = {
  explicitWeight: number;
  semanticWeight: number;
  behavioralWeight: number;
  outcomeWeight: number;
  explorationRate: number;
};

const MATCHTYPE_DEFAULT_WEIGHTS: Record<string, MatchingWeights> = {
  "co-founder": { explicitWeight: 0.50, semanticWeight: 0.35, behavioralWeight: 0.10, outcomeWeight: 0.05, explorationRate: 0.08 },
  "mentor":     { explicitWeight: 0.38, semanticWeight: 0.42, behavioralWeight: 0.12, outcomeWeight: 0.08, explorationRate: 0.10 },
  "advisor":    { explicitWeight: 0.45, semanticWeight: 0.38, behavioralWeight: 0.10, outcomeWeight: 0.07, explorationRate: 0.08 },
  "community":  { explicitWeight: 0.35, semanticWeight: 0.45, behavioralWeight: 0.12, outcomeWeight: 0.08, explorationRate: 0.12 },
  "investor":   { explicitWeight: 0.55, semanticWeight: 0.30, behavioralWeight: 0.08, outcomeWeight: 0.07, explorationRate: 0.06 },
};

export type MatchBreakdown = {
  explicitScore: number;
  semanticScore: number;
  behavioralScore: number;
  outcomePriorScore: number;
  profileCompletenessSource: number;
  profileCompletenessTarget: number;
  finalScore: number;
  confidenceScore: number;
  sharedDimensions: string[];
  complementaryDimensions: string[];
  frictionDimensions: string[];
  recommendationReason: string;
  isNewUserBoost: boolean;
  isExplorationMatch: boolean;
  matchType: string;
  modelVersion: string;
};

export type RecommendationRow = {
  userId: string;
  name: string;
  headline: string | null;
  location: string | null;
  stage: string | null;
  commitment: string | null;
  skills: string[];
  score: number;
  breakdown: MatchBreakdown;
};

function computeProfileCompleteness(profile: {
  headline: string | null;
  bio?: string | null;
  skills: string;
  interests: string;
  location: string | null;
  stage?: string | null;
  commitment?: string | null;
  availability?: string | null;
}): number {
  let score = 0;
  if (profile.headline && profile.headline.trim().length > 5) score++;
  if (profile.bio && profile.bio.trim().length > 20) score++;
  if (parseJson<string[]>(profile.skills, []).length >= 3) score++;
  if (parseJson<string[]>(profile.interests, []).length >= 2) score++;
  if (profile.location) score++;
  if (profile.stage) score++;
  if (profile.commitment) score++;
  if (profile.availability) score++;
  return score / 8;
}

function computeBehavioralScore(db: Db, sourceUserId: string, targetUserId: string): number {
  const signals = db.select({
    signalType: userBehaviorSignals.signalType,
    weight: userBehaviorSignals.weight,
  }).from(userBehaviorSignals)
    .where(and(eq(userBehaviorSignals.userId, sourceUserId), eq(userBehaviorSignals.targetUserId, targetUserId)))
    .all();

  if (!signals.length) return 0.5;

  const SIGNAL_VALUES: Record<string, number> = {
    profile_view: 0.10,
    match_click: 0.20,
    match_feedback: 0.30,
    connection_request_sent: 0.40,
    conversation_started: 0.60,
  };

  let total = 0;
  let count = 0;
  for (const s of signals) {
    const base = SIGNAL_VALUES[s.signalType] ?? 0.10;
    const w = typeof s.weight === "number" ? s.weight : 1.0;
    total += base * Math.min(2.0, Math.max(-1.0, w));
    count++;
  }

  if (count > 30) total *= 0.6;

  return clamp01(0.5 + (total / Math.max(1, count)) * 0.5);
}

function computeOutcomePriorScore(db: Db, sourceUserId: string, targetUserId: string): number {
  const outcome = db.select({
    acceptedAt: matchOutcomes.acceptedAt,
    rejectedAt: matchOutcomes.rejectedAt,
    conversationStartedAt: matchOutcomes.conversationStartedAt,
    conversationSustainedAt: matchOutcomes.conversationSustainedAt,
    engagementDepth: matchOutcomes.engagementDepth,
  }).from(matchOutcomes)
    .where(and(eq(matchOutcomes.sourceUserId, sourceUserId), eq(matchOutcomes.targetUserId, targetUserId)))
    .get();

  if (!outcome) return 0.5;
  if (outcome.conversationSustainedAt) return 0.95;
  if (outcome.conversationStartedAt) return 0.88;
  if (outcome.acceptedAt) return 0.80;
  if (outcome.rejectedAt) return 0.08;
  if ((outcome.engagementDepth ?? 0) >= 3) return 0.70;
  return 0.5;
}

function hasBadFeedback(db: Db, sourceUserId: string, targetUserId: string): boolean {
  const fb = db.select({ feedbackType: matchFeedback.feedbackType })
    .from(matchFeedback)
    .where(and(eq(matchFeedback.sourceUserId, sourceUserId), eq(matchFeedback.targetUserId, targetUserId)))
    .get();
  return fb ? ["hidden", "reported", "not_relevant"].includes(fb.feedbackType) : false;
}

export function getActiveModel(db: Db): { version: string; weights: MatchingWeights; stage: string } {
  const active = db.select({ version: matchModelVersions.version, weights: matchModelVersions.weights, stage: matchModelVersions.stage })
    .from(matchModelVersions).where(eq(matchModelVersions.isActive, true)).get();
  const fallback = db.select({ version: matchModelVersions.version, weights: matchModelVersions.weights, stage: matchModelVersions.stage })
    .from(matchModelVersions).where(eq(matchModelVersions.isFallback, true)).get();
  const chosen = active ?? fallback ?? { version: "v1-hybrid", stage: "stage1", weights: "{}" };
  const w = parseJson<Partial<MatchingWeights>>(chosen.weights, {});
  const weights: MatchingWeights = {
    explicitWeight: typeof w.explicitWeight === "number" ? w.explicitWeight : 0.50,
    semanticWeight: typeof w.semanticWeight === "number" ? w.semanticWeight : 0.35,
    behavioralWeight: typeof w.behavioralWeight === "number" ? w.behavioralWeight : 0.10,
    outcomeWeight: typeof w.outcomeWeight === "number" ? w.outcomeWeight : 0.05,
    explorationRate: typeof w.explorationRate === "number" ? w.explorationRate : 0.08,
  };
  return { version: chosen.version, weights, stage: chosen.stage };
}

function buildText(profile: { headline: string | null; bio?: string | null; skills: string; interests: string }): string {
  return [
    profile.headline ?? "",
    (profile as { bio?: string | null }).bio ?? "",
    parseJson<string[]>(profile.skills, []).join(" "),
    parseJson<string[]>(profile.interests, []).join(" "),
  ].join(" ");
}

function computeSemanticScore(
  me: { headline: string | null; bio?: string | null; skills: string; interests: string },
  them: { headline: string | null; bio?: string | null; skills: string; interests: string },
): { score01: number; shared: string[] } {
  const aTokens = tokenize(buildText(me));
  const bTokens = tokenize(buildText(them));
  const sim = cosineSim(tf(aTokens), tf(bTokens));
  const setB = new Set(bTokens);
  const shared = Array.from(new Set(aTokens.filter((t) => setB.has(t)))).slice(0, 6);
  return { score01: clamp01(sim), shared };
}

function computeExplicitScore(
  meProfile: { skills: string; interests: string; stage?: string | null; commitment?: string | null },
  mePrefs: { lookingForRoles: string; preferredSkills: string; preferredIndustries: string; preferredStage?: string | null; preferredCommitment?: string | null; preferredLocation?: string | null; remoteOk?: boolean; workStyle?: string | null } | null,
  themProfile: { skills: string; interests: string; stage?: string | null; commitment?: string | null },
): { score01: number; shared: string[]; complementary: string[]; friction: string[] } {
  const meSkills = parseJson<string[]>(meProfile.skills, []);
  const themSkills = parseJson<string[]>(themProfile.skills, []);
  const meInterests = parseJson<string[]>(meProfile.interests, []);
  const themInterests = parseJson<string[]>(themProfile.interests, []);
  const desiredSkills = parseJson<string[]>(mePrefs?.preferredSkills ?? "[]", []);

  const skillOverlap = jaccard(meSkills, themSkills);
  const interestOverlap = jaccard(meInterests, themInterests);
  const desiredCoverage = desiredSkills.length ? jaccard(desiredSkills, themSkills) : 0.45;
  const stagePenalty = stageDistance(mePrefs?.preferredStage ?? meProfile.stage, themProfile.stage);
  const commitmentPenalty = commitmentDistance(mePrefs?.preferredCommitment ?? meProfile.commitment, themProfile.commitment);

  const raw = 0.42 * desiredCoverage + 0.22 * skillOverlap + 0.18 * interestOverlap + 0.10 * (1 - stagePenalty) + 0.08 * (1 - commitmentPenalty);
  const score01 = clamp01(raw);

  const themSet = new Set(themSkills.map((s) => s.toLowerCase()));
  const meSet = new Set(meSkills.map((s) => s.toLowerCase()));
  const shared = meSkills.filter((s) => themSet.has(s.toLowerCase())).slice(0, 5);
  const complementary = themSkills.filter((s) => !meSet.has(s.toLowerCase())).slice(0, 5);
  const friction: string[] = [];
  if (stagePenalty >= 0.5) friction.push("Stage focus may differ");
  if (commitmentPenalty >= 0.6) friction.push("Availability expectations may differ");

  return { score01, shared, complementary, friction };
}

function confidenceFromSignals(
  explicit01: number, semantic01: number, behavioral01: number,
  completenessA: number, completenessB: number,
): number {
  const base = 0.25 + 0.30 * explicit01 + 0.20 * semantic01 + 0.10 * behavioral01;
  const richness = 0.075 * completenessA + 0.075 * completenessB;
  return clamp01(base + richness);
}

function pickReason(explicit01: number, semantic01: number, behavioral01: number, isExploration: boolean): string {
  if (isExploration) return "Exploration match — broadening your discovery beyond your usual preferences.";
  if (explicit01 >= 0.75 && semantic01 >= 0.60) return "Strong fit across skills and goals, with high semantic alignment.";
  if (explicit01 >= 0.75 && behavioral01 >= 0.65) return "Strong structured fit reinforced by behavioral signals.";
  if (explicit01 >= 0.75) return "Strong fit based on structured profile preferences.";
  if (semantic01 >= 0.65) return "Strong semantic alignment in goals, interests, and language.";
  if (behavioral01 >= 0.65) return "Past interactions suggest high mutual interest.";
  if (explicit01 >= 0.55 && semantic01 >= 0.50) return "Good complementarity in skills and shared domain interests.";
  return "Potential fit worth exploring — different background may spark new ideas.";
}

export function getRecommendations(db: Db, userId: string, opts?: { limit?: number; matchType?: string }): RecommendationRow[] {
  const limit = Math.min(50, Math.max(1, opts?.limit ?? 20));
  const matchType = opts?.matchType ?? "co-founder";

  const meProfile = db.select().from(profiles).where(eq(profiles.userId, userId)).get();
  if (!meProfile) return [];

  const mePrefs = db.select().from(matchPreferences).where(eq(matchPreferences.userId, userId)).get() ?? null;
  const { version: modelVersion, weights: modelWeights } = getActiveModel(db);

  const typeDefaults = MATCHTYPE_DEFAULT_WEIGHTS[matchType] ?? MATCHTYPE_DEFAULT_WEIGHTS["co-founder"];
  const weights: MatchingWeights = {
    explicitWeight: modelWeights.explicitWeight,
    semanticWeight: modelWeights.semanticWeight,
    behavioralWeight: modelWeights.behavioralWeight > 0 ? modelWeights.behavioralWeight : typeDefaults.behavioralWeight,
    outcomeWeight: modelWeights.outcomeWeight > 0 ? modelWeights.outcomeWeight : typeDefaults.outcomeWeight,
    explorationRate: modelWeights.explorationRate,
  };

  const myConns = db.select({ targetId: connections.targetId }).from(connections).where(eq(connections.userId, userId)).all();
  const myConnsReverse = db.select({ userId: connections.userId }).from(connections).where(eq(connections.targetId, userId)).all();
  const connectedIds = new Set([...myConns.map((c) => c.targetId), ...myConnsReverse.map((c) => c.userId)]);

  const pendingReqs = db.select({ fromId: connectionRequests.fromId, toId: connectionRequests.toId })
    .from(connectionRequests)
    .where(and(eq(connectionRequests.status, "pending"), or(eq(connectionRequests.fromId, userId), eq(connectionRequests.toId, userId))))
    .all();
  const pendingIds = new Set(pendingReqs.flatMap((r) => [r.fromId, r.toId]).filter((id) => id !== userId));

  const hiddenFeedback = db.select({ targetUserId: matchFeedback.targetUserId })
    .from(matchFeedback)
    .where(and(
      eq(matchFeedback.sourceUserId, userId),
      or(eq(matchFeedback.feedbackType, "hidden"), eq(matchFeedback.feedbackType, "reported")),
    ))
    .all();
  const hiddenIds = new Set(hiddenFeedback.map((f) => f.targetUserId));

  const candidates = db.select({
    userId: profiles.userId,
    skills: profiles.skills,
    interests: profiles.interests,
    stage: profiles.stage,
    commitment: profiles.commitment,
    headline: profiles.headline,
    location: profiles.location,
    availability: profiles.availability,
    bio: profiles.bio,
    updatedAt: profiles.updatedAt,
  }).from(profiles)
    .where(ne(profiles.userId, userId))
    .all()
    .filter((p) => !connectedIds.has(p.userId) && !pendingIds.has(p.userId) && !hiddenIds.has(p.userId));

  if (!candidates.length) return [];

  const ids = candidates.map((c) => c.userId);
  const candidateUsers = db.select({ id: users.id, name: users.name, createdAt: users.createdAt })
    .from(users).where(inArray(users.id, ids)).all();
  const userMap = new Map(candidateUsers.map((u) => [u.id, u]));

  const meCompleteness = computeProfileCompleteness(meProfile);

  const scored = candidates.map((c) => {
    const u = userMap.get(c.userId);
    const explicit = computeExplicitScore(meProfile, mePrefs, c);
    const semantic = computeSemanticScore(meProfile, c);
    const behavioral01 = computeBehavioralScore(db, userId, c.userId);
    const outcomePrior = computeOutcomePriorScore(db, userId, c.userId);
    const theirCompleteness = computeProfileCompleteness(c);

    const createdAt = u?.createdAt;
    const isNew = createdAt ? (Date.now() - Date.parse(createdAt)) < 7 * 24 * 60 * 60 * 1000 : false;
    const isExploration = Math.random() < weights.explorationRate;

    const completenessBoost = 0.04 * theirCompleteness;
    const newUserBoost = isNew ? 0.04 : 0;
    const explorationBoost = isExploration ? 0.05 : 0;

    const totalWeight = weights.explicitWeight + weights.semanticWeight + weights.behavioralWeight + weights.outcomeWeight;
    const rawScore =
      (weights.explicitWeight * explicit.score01 +
       weights.semanticWeight * semantic.score01 +
       weights.behavioralWeight * behavioral01 +
       weights.outcomeWeight * outcomePrior) / Math.max(0.01, totalWeight);

    const final01 = clamp01(rawScore + completenessBoost + newUserBoost + explorationBoost);
    const confidence = confidenceFromSignals(explicit.score01, semantic.score01, behavioral01, meCompleteness, theirCompleteness);

    const sharedDims = Array.from(new Set([...explicit.shared, ...semantic.shared])).slice(0, 6);
    const complementaryDims = explicit.complementary.slice(0, 5);
    const reason = pickReason(explicit.score01, semantic.score01, behavioral01, isExploration);

    const breakdown: MatchBreakdown = {
      explicitScore: explicit.score01,
      semanticScore: semantic.score01,
      behavioralScore: behavioral01,
      outcomePriorScore: outcomePrior,
      profileCompletenessSource: meCompleteness,
      profileCompletenessTarget: theirCompleteness,
      finalScore: final01,
      confidenceScore: confidence,
      sharedDimensions: sharedDims,
      complementaryDimensions: complementaryDims,
      frictionDimensions: explicit.friction,
      recommendationReason: reason,
      isNewUserBoost: isNew,
      isExplorationMatch: isExploration,
      matchType,
      modelVersion,
    };

    return {
      userId: c.userId,
      name: u?.name ?? "Unknown",
      headline: c.headline,
      location: c.location,
      stage: c.stage,
      commitment: c.commitment,
      skills: parseJson<string[]>(c.skills, []),
      score: Math.round(final01 * 100),
      breakdown,
      _raw: { explicit01: explicit.score01, semantic01: semantic.score01, behavioral01, outcomePrior, final01, confidence },
      _features: { explicit, semanticShared: semantic.shared, theirCompleteness },
    };
  });

  scored.sort((a, b) => b._raw.final01 - a._raw.final01);
  const top = scored.slice(0, limit);

  const now = new Date().toISOString();
  for (const r of top) {
    const id = crypto.randomUUID();
    db.insert(matchScores).values({
      id,
      sourceUserId: userId,
      targetUserId: r.userId,
      modelVersion,
      matchType,
      explicitScore: r._raw.explicit01,
      semanticScore: r._raw.semantic01,
      behavioralScore: r._raw.behavioral01,
      outcomePriorScore: r._raw.outcomePrior,
      finalScore: r._raw.final01,
      confidenceScore: r._raw.confidence,
      sharedDimensions: JSON.stringify(r.breakdown.sharedDimensions),
      complementaryDimensions: JSON.stringify(r.breakdown.complementaryDimensions),
      frictionDimensions: JSON.stringify(r.breakdown.frictionDimensions),
      recommendationReason: r.breakdown.recommendationReason,
      isNewUserBoost: r.breakdown.isNewUserBoost,
      isExplorationMatch: r.breakdown.isExplorationMatch,
      computedAt: now,
    }).onConflictDoUpdate({
      target: [matchScores.sourceUserId, matchScores.targetUserId, matchScores.matchType],
      set: {
        modelVersion,
        explicitScore: r._raw.explicit01,
        semanticScore: r._raw.semantic01,
        behavioralScore: r._raw.behavioral01,
        outcomePriorScore: r._raw.outcomePrior,
        finalScore: r._raw.final01,
        confidenceScore: r._raw.confidence,
        sharedDimensions: JSON.stringify(r.breakdown.sharedDimensions),
        complementaryDimensions: JSON.stringify(r.breakdown.complementaryDimensions),
        frictionDimensions: JSON.stringify(r.breakdown.frictionDimensions),
        recommendationReason: r.breakdown.recommendationReason,
        isNewUserBoost: r.breakdown.isNewUserBoost,
        isExplorationMatch: r.breakdown.isExplorationMatch,
        computedAt: now,
      },
    }).run();

    db.insert(matchInferenceLogs).values({
      id: crypto.randomUUID(),
      sourceUserId: userId,
      targetUserId: r.userId,
      modelVersion,
      matchType,
      scoreId: id,
      breakdownJson: JSON.stringify(r.breakdown),
      createdAt: now,
    }).run();

    db.insert(matchFeatureVectors).values({
      id: crypto.randomUUID(),
      sourceUserId: userId,
      targetUserId: r.userId,
      modelVersion,
      featureJson: JSON.stringify({ explicit: r._features.explicit, semanticShared: r._features.semanticShared, completeness: r._features.theirCompleteness }),
      createdAt: now,
    }).onConflictDoUpdate({
      target: [matchFeatureVectors.sourceUserId, matchFeatureVectors.targetUserId, matchFeatureVectors.modelVersion],
      set: {
        featureJson: JSON.stringify({ explicit: r._features.explicit, semanticShared: r._features.semanticShared, completeness: r._features.theirCompleteness }),
        createdAt: now,
      },
    }).run();
  }

  return top.map(({ _raw: _r, _features: _f, ...rest }) => rest);
}

export { hasBadFeedback };
