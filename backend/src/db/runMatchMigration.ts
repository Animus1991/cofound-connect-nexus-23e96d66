import Database from "better-sqlite3";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH ?? resolve(__dirname, "..", "..", "data", "dev.db");
mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const DDL = `
CREATE TABLE IF NOT EXISTS match_model_versions (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  version     TEXT NOT NULL UNIQUE,
  stage       TEXT NOT NULL DEFAULT 'stage1',
  description TEXT,
  weights     TEXT NOT NULL DEFAULT '{}',
  is_active   INTEGER NOT NULL DEFAULT 0,
  is_fallback INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS match_scores (
  id                   TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  source_user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model_version        TEXT NOT NULL DEFAULT 'v1',
  match_type           TEXT NOT NULL DEFAULT 'co-founder',
  explicit_score       REAL NOT NULL DEFAULT 0,
  semantic_score       REAL NOT NULL DEFAULT 0,
  behavioral_score     REAL NOT NULL DEFAULT 0,
  outcome_prior_score  REAL NOT NULL DEFAULT 0,
  final_score          REAL NOT NULL DEFAULT 0,
  confidence_score     REAL NOT NULL DEFAULT 0.5,
  shared_dimensions    TEXT NOT NULL DEFAULT '[]',
  complementary_dims   TEXT NOT NULL DEFAULT '[]',
  friction_dims        TEXT NOT NULL DEFAULT '[]',
  recommendation_reason TEXT,
  is_new_user_boost    INTEGER NOT NULL DEFAULT 0,
  is_exploration       INTEGER NOT NULL DEFAULT 0,
  computed_at          TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at           TEXT,
  UNIQUE(source_user_id, target_user_id, match_type)
);
CREATE INDEX IF NOT EXISTS idx_match_scores_source_score ON match_scores(source_user_id, final_score);
CREATE INDEX IF NOT EXISTS idx_match_scores_target       ON match_scores(target_user_id);

CREATE TABLE IF NOT EXISTS match_feedback (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  source_user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feedback_type   TEXT NOT NULL,
  feedback_reason TEXT,
  model_version   TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source_user_id, target_user_id)
);
CREATE INDEX IF NOT EXISTS idx_match_feedback_source ON match_feedback(source_user_id);
CREATE INDEX IF NOT EXISTS idx_match_feedback_target ON match_feedback(target_user_id);

CREATE TABLE IF NOT EXISTS user_behavior_signals (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signal_type    TEXT NOT NULL,
  target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  weight         REAL NOT NULL DEFAULT 1.0,
  metadata       TEXT NOT NULL DEFAULT '{}',
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_behavior_signals_user_type ON user_behavior_signals(user_id, signal_type);
CREATE INDEX IF NOT EXISTS idx_behavior_signals_target    ON user_behavior_signals(target_user_id);

CREATE TABLE IF NOT EXISTS match_outcomes (
  id                        TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  source_user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_score_id            TEXT REFERENCES match_scores(id) ON DELETE SET NULL,
  model_version             TEXT,
  shown_at                  TEXT,
  clicked_at                TEXT,
  requested_at              TEXT,
  accepted_at               TEXT,
  rejected_at               TEXT,
  conversation_started_at   TEXT,
  conversation_sustained_at TEXT,
  engagement_depth          INTEGER NOT NULL DEFAULT 0,
  quality_flag              TEXT,
  created_at                TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_match_outcomes_source ON match_outcomes(source_user_id);
CREATE INDEX IF NOT EXISTS idx_match_outcomes_pair   ON match_outcomes(source_user_id, target_user_id);
CREATE INDEX IF NOT EXISTS idx_match_outcomes_model  ON match_outcomes(model_version);

CREATE TABLE IF NOT EXISTS match_experiments (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name          TEXT NOT NULL,
  description   TEXT,
  strategy_a    TEXT NOT NULL,
  strategy_b    TEXT NOT NULL,
  traffic_split REAL NOT NULL DEFAULT 0.5,
  is_active     INTEGER NOT NULL DEFAULT 0,
  started_at    TEXT,
  ended_at      TEXT,
  metrics       TEXT NOT NULL DEFAULT '{}',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS match_feature_vectors (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  source_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model_version  TEXT NOT NULL DEFAULT 'v1',
  feature_json   TEXT NOT NULL DEFAULT '{}',
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source_user_id, target_user_id, model_version)
);
CREATE INDEX IF NOT EXISTS idx_match_feature_source ON match_feature_vectors(source_user_id);

CREATE TABLE IF NOT EXISTS match_embeddings (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model_version TEXT NOT NULL DEFAULT 'embed-v1',
  vector_json   TEXT NOT NULL DEFAULT '[]',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, model_version)
);

CREATE TABLE IF NOT EXISTS match_inference_logs (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  source_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model_version  TEXT NOT NULL,
  match_type     TEXT NOT NULL DEFAULT 'co-founder',
  score_id       TEXT REFERENCES match_scores(id) ON DELETE SET NULL,
  breakdown_json TEXT NOT NULL DEFAULT '{}',
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_match_infer_source  ON match_inference_logs(source_user_id);
CREATE INDEX IF NOT EXISTS idx_match_infer_model   ON match_inference_logs(model_version);
CREATE INDEX IF NOT EXISTS idx_match_infer_created ON match_inference_logs(created_at);

CREATE TABLE IF NOT EXISTS match_evaluation_metrics (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  model_version TEXT NOT NULL,
  window_start  TEXT NOT NULL,
  window_end    TEXT NOT NULL,
  metrics_json  TEXT NOT NULL DEFAULT '{}',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_match_eval_model  ON match_evaluation_metrics(model_version);
CREATE INDEX IF NOT EXISTS idx_match_eval_window ON match_evaluation_metrics(window_start, window_end);
`;

const SEED_MODELS = [
  {
    version:     "v1-rule-based",
    stage:       "stage1",
    description: "Baseline: explicit structured-feature matching only. Transparent, deterministic, fast.",
    weights:     JSON.stringify({ explicitWeight: 1.0, semanticWeight: 0.0, behavioralWeight: 0.0, outcomeWeight: 0.0, explorationRate: 0.05 }),
    is_fallback: 1,
    is_active:   0,
  },
  {
    version:     "v1-hybrid",
    stage:       "stage1",
    description: "Stage 1 active: rule-based explicit features + semantic text similarity scoring.",
    weights:     JSON.stringify({ explicitWeight: 0.55, semanticWeight: 0.35, behavioralWeight: 0.0, outcomeWeight: 0.0, explorationRate: 0.08 }),
    is_fallback: 0,
    is_active:   1,
  },
  {
    version:     "v2-behavioral",
    stage:       "stage2",
    description: "Stage 2: hybrid scoring + behavioral signal reranking. Not yet active.",
    weights:     JSON.stringify({ explicitWeight: 0.40, semanticWeight: 0.30, behavioralWeight: 0.20, outcomeWeight: 0.10, explorationRate: 0.10 }),
    is_fallback: 0,
    is_active:   0,
  },
];

function run() {
  console.log("[MatchMigration] Running DDL…");
  db.exec(DDL);
  console.log("[MatchMigration] Tables created/verified.");

  const insert = db.prepare(`
    INSERT OR IGNORE INTO match_model_versions
      (id, version, stage, description, weights, is_active, is_fallback)
    VALUES
      (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?)
  `);

  for (const m of SEED_MODELS) {
    insert.run(m.version, m.stage, m.description, m.weights, m.is_active, m.is_fallback);
  }
  console.log("[MatchMigration] Seed model versions inserted (if not already present).");
  console.log("[MatchMigration] Done.");
}

run();
