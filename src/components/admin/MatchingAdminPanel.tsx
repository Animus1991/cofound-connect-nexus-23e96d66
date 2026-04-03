import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain, RefreshCw, Zap, ShieldCheck, FlaskConical,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  Play, Pause, Trash2, Plus, SlidersHorizontal,
} from "lucide-react";

type ModelVersion = {
  id: string;
  version: string;
  stage: string;
  description: string | null;
  weights: string;
  isActive: boolean;
  isFallback: boolean;
  createdAt: string;
};

type Experiment = {
  id: string;
  name: string;
  description: string | null;
  strategyA: string;
  strategyB: string;
  trafficSplit: number;
  isActive: boolean;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
};

type FairnessData = {
  explorationRate: number;
  newUserBoostRate: number;
  negativeFeedbackRate: number;
  totalShown: number;
  totalScores: number;
  totalFeedback: number;
};

type WeightDraft = {
  explicitWeight: number;
  semanticWeight: number;
  behavioralWeight: number;
  outcomeWeight: number;
  explorationRate: number;
};

const TAB_LIST = ["Overview", "Model Weights", "Experiments", "Fairness"] as const;
type TabId = (typeof TAB_LIST)[number];

function pct(n: number) { return `${Math.round(n * 100)}%`; }

function StatCard({ label, value, sub, trend }: { label: string; value: string | number; sub?: string; trend?: "good" | "warn" | "bad" }) {
  const colors = { good: "text-emerald-500", warn: "text-amber-500", bad: "text-red-500" };
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className={`mt-1.5 text-2xl font-bold tabular-nums ${trend ? colors[trend] : "text-foreground"}`}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function WeightSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-primary font-semibold tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range" min="0" max="1" step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary bg-secondary"
      />
    </div>
  );
}

export default function MatchingAdminPanel() {
  const [activeTab, setActiveTab] = useState<TabId>("Overview");
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [savingWeights, setSavingWeights] = useState(false);
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [active, setActive] = useState<{ version: string; stage: string; weights: WeightDraft } | null>(null);
  const [metrics, setMetrics] = useState<{ byModel: Array<Record<string, unknown>>; feedback: Array<Record<string, unknown>>; lastInference: Array<Record<string, unknown>>; since7d: string } | null>(null);
  const [fairness, setFairness] = useState<FairnessData | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [weightDraft, setWeightDraft] = useState<WeightDraft>({ explicitWeight: 0.55, semanticWeight: 0.15, behavioralWeight: 0.15, outcomeWeight: 0.15, explorationRate: 0.10 });
  const [newExp, setNewExp] = useState({ name: "", strategyA: "", strategyB: "", trafficSplit: 0.5 });
  const [addingExp, setAddingExp] = useState(false);
  const [togglingExp, setTogglingExp] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [mv, m, f, exps] = await Promise.all([
        api.matching.admin.listModelVersions(),
        api.matching.admin.getMetrics(),
        api.matching.admin.getFairness(),
        api.matching.admin.listExperiments(),
      ]);
      setVersions(mv.versions);
      setActive({ version: mv.active.version, stage: mv.active.stage, weights: mv.active.weights });
      setSelectedVersion(mv.active.version);
      setWeightDraft(mv.active.weights);
      setMetrics(m);
      setFairness(f);
      setExperiments(exps.experiments);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const activeRow = useMemo(() => versions.find((v) => v.version === active?.version) ?? null, [versions, active]);

  const setActiveVersion = useCallback(async () => {
    if (!selectedVersion || switching) return;
    setSwitching(true);
    try {
      const res = await api.matching.admin.setActiveModelVersion({ version: selectedVersion });
      setActive({ version: res.active.version, stage: res.active.stage, weights: res.active.weights });
      setWeightDraft(res.active.weights);
      await reload();
    } finally { setSwitching(false); }
  }, [selectedVersion, switching, reload]);

  const saveWeights = useCallback(async () => {
    if (!active || savingWeights) return;
    setSavingWeights(true);
    try {
      await api.matching.admin.updateModelWeights(active.version, { weights: weightDraft });
      setActive((prev) => prev ? { ...prev, weights: weightDraft } : prev);
    } finally { setSavingWeights(false); }
  }, [active, weightDraft, savingWeights]);

  const createExperiment = useCallback(async () => {
    if (!newExp.name || !newExp.strategyA || !newExp.strategyB) return;
    setAddingExp(true);
    try {
      await api.matching.admin.createExperiment(newExp);
      setNewExp({ name: "", strategyA: "", strategyB: "", trafficSplit: 0.5 });
      const exps = await api.matching.admin.listExperiments();
      setExperiments(exps.experiments);
    } finally { setAddingExp(false); }
  }, [newExp]);

  const toggleExperiment = useCallback(async (id: string) => {
    setTogglingExp(id);
    try {
      await api.matching.admin.toggleExperiment(id);
      const exps = await api.matching.admin.listExperiments();
      setExperiments(exps.experiments);
    } finally { setTogglingExp(null); }
  }, []);

  const deleteExperiment = useCallback(async (id: string) => {
    await api.matching.admin.deleteExperiment(id);
    setExperiments((prev) => prev.filter((e) => e.id !== id));
  }, []);

  if (loading) {
    return (
      <div className="p-5 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 rounded-xl bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  const inferenceCount = metrics?.lastInference.reduce((a, r) => a + (Number(r.count ?? 0) || 0), 0) ?? 0;
  const feedbackCount = metrics?.feedback.reduce((a, r) => a + (Number(r.relevant ?? 0) || 0) + (Number(r.notRelevant ?? 0) || 0), 0) ?? 0;

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">AI Matching Engine</h4>
              {active && <Badge variant="secondary" className="text-[10px]">{active.version}</Badge>}
              {active && <Badge variant="outline" className="text-[10px]">{active.stage}</Badge>}
            </div>
            <p className="text-[11px] text-muted-foreground">Full-stack AI matching controls, fairness monitoring, and A/B experiments.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={reload}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-secondary rounded-lg p-0.5 w-fit">
        {TAB_LIST.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === "Overview" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Inference (7d)" value={inferenceCount} sub="Total scoring runs" />
            <StatCard label="Feedback signals (7d)" value={feedbackCount} sub="Relevant + Not relevant" />
            <StatCard label="Shown (7d)" value={fairness?.totalShown ?? 0} sub="Via outcome tracking" />
            <StatCard label="Neg. feedback rate (30d)" value={pct(fairness?.negativeFeedbackRate ?? 0)} sub="Hidden / not relevant / reported" trend={(fairness?.negativeFeedbackRate ?? 0) > 0.25 ? "bad" : (fairness?.negativeFeedbackRate ?? 0) > 0.15 ? "warn" : "good"} />
          </div>

          {/* Model selector */}
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <div className="text-xs font-semibold text-foreground mb-1">Active Model</div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                <SelectTrigger className="h-9 w-full sm:w-[260px] text-xs"><SelectValue placeholder="Select model" /></SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.version} className="text-xs">
                      {v.version}{v.isFallback ? " (fallback)" : ""}{v.isActive ? " ✓" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" className="text-xs" disabled={switching || !selectedVersion || selectedVersion === active?.version} onClick={setActiveVersion}>
                {switching ? "Switching…" : "Apply Model"}
              </Button>
            </div>
            {activeRow?.description && (
              <div className="text-xs text-foreground/80 rounded-lg bg-secondary/40 p-3 border border-border/50">{activeRow.description}</div>
            )}
          </div>

          {/* Funnel table */}
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="text-xs font-semibold text-foreground mb-3">Funnel by Model (7d)</div>
            <div className="space-y-1.5">
              {(metrics?.byModel ?? []).length === 0 && (
                <div className="text-xs text-muted-foreground">No metrics yet.</div>
              )}
              {(metrics?.byModel ?? []).map((row, idx) => {
                const shown = Number(row.count ?? 0) || 0;
                return (
                  <div key={idx} className="grid grid-cols-5 gap-2 rounded-lg border border-border/40 bg-background/50 px-3 py-2">
                    <div className="col-span-1 text-xs font-semibold text-foreground truncate">{String(row.modelVersion ?? "–")}</div>
                    <div className="text-[11px] text-muted-foreground tabular-nums text-center">{shown}<div className="text-[9px]">shown</div></div>
                    <div className="text-[11px] text-muted-foreground tabular-nums text-center">{Number(row.clicked ?? 0) || 0}<div className="text-[9px]">clicked</div></div>
                    <div className="text-[11px] text-muted-foreground tabular-nums text-center">{Number(row.accepted ?? 0) || 0}<div className="text-[9px]">accepted</div></div>
                    <div className="text-[11px] text-muted-foreground tabular-nums text-center">{Number(row.convStarted ?? 0) || 0}<div className="text-[9px]">conv</div></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Model Weights ── */}
      {activeTab === "Model Weights" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Weight Editor — {active?.version}</span>
            </div>
            <p className="text-xs text-muted-foreground">Adjust scoring dimension weights for the active model. Changes apply to new recommendations after saving.</p>

            <div className="space-y-4">
              <WeightSlider label="Explicit (skills, stage, role)" value={weightDraft.explicitWeight} onChange={(v) => setWeightDraft((d) => ({ ...d, explicitWeight: v }))} />
              <WeightSlider label="Semantic alignment" value={weightDraft.semanticWeight} onChange={(v) => setWeightDraft((d) => ({ ...d, semanticWeight: v }))} />
              <WeightSlider label="Behavioral signals" value={weightDraft.behavioralWeight} onChange={(v) => setWeightDraft((d) => ({ ...d, behavioralWeight: v }))} />
              <WeightSlider label="Outcome prior" value={weightDraft.outcomeWeight} onChange={(v) => setWeightDraft((d) => ({ ...d, outcomeWeight: v }))} />
              <WeightSlider label="Exploration rate" value={weightDraft.explorationRate} onChange={(v) => setWeightDraft((d) => ({ ...d, explorationRate: v }))} />
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-border/40">
              <div className="text-xs text-muted-foreground">
                Sum: <span className={`font-semibold ${Math.abs((weightDraft.explicitWeight + weightDraft.semanticWeight + weightDraft.behavioralWeight + weightDraft.outcomeWeight) - 1) > 0.05 ? "text-amber-500" : "text-emerald-500"}`}>
                  {Math.round((weightDraft.explicitWeight + weightDraft.semanticWeight + weightDraft.behavioralWeight + weightDraft.outcomeWeight) * 100)}%
                </span>
                <span className="text-muted-foreground/60"> (excl. exploration)</span>
              </div>
              <div className="flex-1" />
              <Button variant="outline" size="sm" className="text-xs" onClick={() => active && setWeightDraft(active.weights)}>Reset</Button>
              <Button size="sm" className="text-xs" disabled={savingWeights || !active} onClick={saveWeights}>
                {savingWeights ? "Saving…" : "Save Weights"}
              </Button>
            </div>
          </div>

          {/* Manual fallback control */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground mb-1">Manual Fallback</div>
              <p className="text-xs text-muted-foreground">If the active model is producing poor results, switch to the fallback rule-based model immediately.</p>
            </div>
            <Button
              variant="outline" size="sm" className="text-xs border-amber-500/40 text-amber-600 hover:bg-amber-500/10 shrink-0"
              disabled={switching}
              onClick={async () => {
                const fb = versions.find((v) => v.isFallback);
                if (!fb) return;
                setSwitching(true);
                try {
                  const res = await api.matching.admin.setActiveModelVersion({ version: fb.version });
                  setActive({ version: res.active.version, stage: res.active.stage, weights: res.active.weights });
                  await reload();
                } finally { setSwitching(false); }
              }}
            >
              {switching ? "Switching…" : "Switch to Fallback"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Tab: Experiments ── */}
      {activeTab === "Experiments" && (
        <div className="space-y-4">
          {/* Create form */}
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">New A/B Experiment</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder="Experiment name" className="h-8 text-xs" value={newExp.name} onChange={(e) => setNewExp((n) => ({ ...n, name: e.target.value }))} />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Traffic split</span>
                <input type="range" min="0.1" max="0.9" step="0.05" value={newExp.trafficSplit}
                  onChange={(e) => setNewExp((n) => ({ ...n, trafficSplit: parseFloat(e.target.value) }))}
                  className="flex-1 h-2 accent-primary cursor-pointer" />
                <span className="text-xs font-medium text-foreground tabular-nums w-8">{Math.round(newExp.trafficSplit * 100)}%</span>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder="Strategy A (e.g. v1-hybrid)" className="h-8 text-xs" value={newExp.strategyA} onChange={(e) => setNewExp((n) => ({ ...n, strategyA: e.target.value }))} />
              <Input placeholder="Strategy B (e.g. v2-behavioral)" className="h-8 text-xs" value={newExp.strategyB} onChange={(e) => setNewExp((n) => ({ ...n, strategyB: e.target.value }))} />
            </div>
            <Button size="sm" className="text-xs gap-1.5" disabled={addingExp || !newExp.name || !newExp.strategyA || !newExp.strategyB} onClick={createExperiment}>
              <Plus className="h-3.5 w-3.5" /> {addingExp ? "Creating…" : "Create Experiment"}
            </Button>
          </div>

          {/* Experiment list */}
          {experiments.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">No experiments yet.</div>
          ) : (
            <div className="space-y-2">
              {experiments.map((exp) => (
                <div key={exp.id} className={`rounded-xl border p-4 space-y-2 ${exp.isActive ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50 bg-card"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{exp.name}</span>
                        <Badge variant="outline" className={`text-[9px] py-0 ${exp.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "text-muted-foreground"}`}>
                          {exp.isActive ? "Running" : "Paused"}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {exp.strategyA} vs {exp.strategyB} — {Math.round(exp.trafficSplit * 100)}/{Math.round((1 - exp.trafficSplit) * 100)} split
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleExperiment(exp.id)}
                        disabled={togglingExp === exp.id}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] border border-border hover:bg-secondary transition-colors"
                      >
                        {exp.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        {togglingExp === exp.id ? "…" : exp.isActive ? "Pause" : "Start"}
                      </button>
                      <button onClick={() => deleteExperiment(exp.id)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  {exp.startedAt && (
                    <div className="text-[10px] text-muted-foreground">Started: {new Date(exp.startedAt).toLocaleDateString()}{exp.endedAt ? ` — Ended: ${new Date(exp.endedAt).toLocaleDateString()}` : ""}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Fairness ── */}
      {activeTab === "Fairness" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold text-foreground">Exploration Rate</span>
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums">{pct(fairness?.explorationRate ?? 0)}</div>
              <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-amber-400" style={{ width: pct(fairness?.explorationRate ?? 0) }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Target: 10–20% exploration matches (serendipity & new user discovery)</p>
              {((fairness?.explorationRate ?? 0) < 0.05 || (fairness?.explorationRate ?? 0) > 0.35) && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-500"><AlertCircle className="h-3 w-3" /> Outside healthy range</div>
              )}
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold text-foreground">New User Boost Rate</span>
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums">{pct(fairness?.newUserBoostRate ?? 0)}</div>
              <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: pct(fairness?.newUserBoostRate ?? 0) }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Share of recommendations boosted for new users. Healthy range: 5–30%.</p>
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-semibold text-foreground">Negative Feedback Rate</span>
              </div>
              <div className={`text-2xl font-bold tabular-nums ${(fairness?.negativeFeedbackRate ?? 0) > 0.25 ? "text-red-500" : (fairness?.negativeFeedbackRate ?? 0) > 0.15 ? "text-amber-500" : "text-emerald-500"}`}>
                {pct(fairness?.negativeFeedbackRate ?? 0)}
              </div>
              <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full ${(fairness?.negativeFeedbackRate ?? 0) > 0.25 ? "bg-red-400" : (fairness?.negativeFeedbackRate ?? 0) > 0.15 ? "bg-amber-400" : "bg-emerald-400"}`}
                  style={{ width: pct(fairness?.negativeFeedbackRate ?? 0) }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Hidden + not relevant + reported. Target: &lt;15%.</p>
              {(fairness?.negativeFeedbackRate ?? 0) <= 0.15 ? (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-500"><CheckCircle2 className="h-3 w-3" /> Healthy</div>
              ) : (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-500"><AlertCircle className="h-3 w-3" /> Review match quality</div>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Total scored (7d)" value={fairness?.totalScores ?? 0} />
            <StatCard label="Total shown (7d)" value={fairness?.totalShown ?? 0} />
            <StatCard label="Total feedback (30d)" value={fairness?.totalFeedback ?? 0} />
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold text-foreground">Fairness Health Summary</span>
            </div>
            <ul className="space-y-1 text-[11px] text-muted-foreground">
              <li className="flex items-center gap-1.5">
                {(fairness?.explorationRate ?? 0) >= 0.05 && (fairness?.explorationRate ?? 0) <= 0.35
                  ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  : <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />}
                Exploration rate: {pct(fairness?.explorationRate ?? 0)} — target 5–35%
              </li>
              <li className="flex items-center gap-1.5">
                {(fairness?.newUserBoostRate ?? 0) >= 0.05
                  ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  : <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />}
                New user coverage: {pct(fairness?.newUserBoostRate ?? 0)} — target ≥5%
              </li>
              <li className="flex items-center gap-1.5">
                {(fairness?.negativeFeedbackRate ?? 0) <= 0.15
                  ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  : <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />}
                Negative feedback: {pct(fairness?.negativeFeedbackRate ?? 0)} — target &lt;15%
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
