/**
 * AutomationDashboard — Super-admin UI for the automation framework.
 * 4 tabs: Rules / Executions / Templates / Stats
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  listRules, pauseRule, resumeRule, manuallyTrigger, deleteRule, createRule, updateRule,
  listExecutions, getExecutionLogs,
  listNotificationTemplates, deleteNotificationTemplate,
  listEmailTemplates, getAutomationStats,
  TRIGGER_LABELS, STATUS_COLORS,
  type AutomationRule, type AutomationExecution, type AutomationLog,
  type NotificationTemplate, type EmailTemplate, type AutomationStats,
} from "@/lib/automation";
import {
  Zap, Play, Pause, Trash2, Plus, RefreshCw, Loader2,
  CheckCircle2, XCircle, Clock, Activity, BarChart3,
  Bell, Mail, Search, Eye, ChevronDown, ChevronUp,
} from "lucide-react";

function fmtDate(s: string | null | undefined) {
  return s ? new Date(s).toLocaleString() : "—";
}
function fmtRelative(s: string | null | undefined) {
  if (!s) return "—";
  const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m/60)}h ago`;
  return `${Math.floor(m/1440)}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "text-muted-foreground bg-secondary border-border";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${cls}`}>
      {status === "running" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
      {status === "completed" && <CheckCircle2 className="h-2.5 w-2.5" />}
      {status === "failed" && <XCircle className="h-2.5 w-2.5" />}
      {status === "queued" && <Clock className="h-2.5 w-2.5" />}
      {status}
    </span>
  );
}

type Tab = "rules" | "executions" | "templates" | "stats";

export default function AutomationDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("rules");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500);
  };

  // ── Rules ────────────────────────────────────────────────────────────────
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [ruleSearch, setRuleSearch] = useState("");
  const [ruleFilter, setRuleFilter] = useState<"all" | "active" | "inactive">("all");
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [triggerLoading, setTriggerLoading] = useState<string | null>(null);

  const loadRules = useCallback(async () => {
    if (!user?.token) return;
    setRulesLoading(true);
    try {
      const { rules: r } = await listRules(user.token, {
        search: ruleSearch || undefined,
        isActive: ruleFilter === "active" ? true : ruleFilter === "inactive" ? false : undefined,
        limit: 100,
      });
      setRules(r);
    } catch { /* silent */ } finally { setRulesLoading(false); }
  }, [user?.token, ruleSearch, ruleFilter]);

  useEffect(() => { if (tab === "rules") { void loadRules(); } }, [tab, loadRules]);

  // ── Executions ────────────────────────────────────────────────────────────
  const [execs, setExecs] = useState<AutomationExecution[]>([]);
  const [execsLoading, setExecsLoading] = useState(false);
  const [execFilter, setExecFilter] = useState("all");
  const [selectedExec, setSelectedExec] = useState<string | null>(null);
  const [execLogs, setExecLogs] = useState<AutomationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const loadExecs = useCallback(async () => {
    if (!user?.token) return;
    setExecsLoading(true);
    try {
      const { executions } = await listExecutions(user.token, {
        status: execFilter !== "all" ? execFilter as AutomationExecution["status"] : undefined,
        limit: 100,
      });
      setExecs(executions);
    } catch { /* silent */ } finally { setExecsLoading(false); }
  }, [user?.token, execFilter]);

  useEffect(() => { if (tab === "executions") { void loadExecs(); } }, [tab, loadExecs]);

  const loadLogs = useCallback(async (execId: string) => {
    if (!user?.token) return;
    setLogsLoading(true);
    try {
      const { logs } = await getExecutionLogs(user.token, execId);
      setExecLogs(logs);
    } catch { /* silent */ } finally { setLogsLoading(false); }
  }, [user?.token]);

  useEffect(() => {
    if (selectedExec) { void loadLogs(selectedExec); }
    else setExecLogs([]);
  }, [selectedExec, loadLogs]);

  // ── Templates ─────────────────────────────────────────────────────────────
  const [notifTpls, setNotifTpls] = useState<NotificationTemplate[]>([]);
  const [emailTpls, setEmailTpls] = useState<EmailTemplate[]>([]);
  const [tplsLoading, setTplsLoading] = useState(false);

  const loadTemplates = useCallback(async () => {
    if (!user?.token) return;
    setTplsLoading(true);
    try {
      const [n, e] = await Promise.all([
        listNotificationTemplates(user.token),
        listEmailTemplates(user.token),
      ]);
      setNotifTpls(n.templates);
      setEmailTpls(e.templates);
    } catch { /* silent */ } finally { setTplsLoading(false); }
  }, [user?.token]);

  useEffect(() => { if (tab === "templates") { void loadTemplates(); } }, [tab, loadTemplates]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    if (!user?.token) return;
    setStatsLoading(true);
    try {
      const s = await getAutomationStats(user.token);
      setStats(s);
    } catch { /* silent */ } finally { setStatsLoading(false); }
  }, [user?.token]);

  useEffect(() => { if (tab === "stats") { void loadStats(); } }, [tab, loadStats]);

  // ── Rule actions ──────────────────────────────────────────────────────────
  const handlePauseResume = async (rule: AutomationRule) => {
    if (!user?.token) return;
    try {
      if (rule.isActive) await pauseRule(user.token, rule.id);
      else await resumeRule(user.token, rule.id);
      showToast("success", rule.isActive ? "Rule paused" : "Rule resumed");
      void loadRules();
    } catch (e) { showToast("error", e instanceof Error ? e.message : "Failed"); }
  };

  const handleDelete = async (rule: AutomationRule) => {
    if (!user?.token) return;
    if (!confirm(`Delete rule "${rule.name}"?`)) return;
    try {
      await deleteRule(user.token, rule.id);
      showToast("success", "Rule deleted");
      void loadRules();
    } catch (e) { showToast("error", e instanceof Error ? e.message : "Failed"); }
  };

  const handleTrigger = async (rule: AutomationRule) => {
    if (!user?.token) return;
    setTriggerLoading(rule.id);
    try {
      const { success, executionId } = await manuallyTrigger(user.token, rule.id, {});
      showToast(success ? "success" : "error", success ? `Triggered (exec: ${executionId.slice(0,8)}…)` : "Trigger failed");
    } catch (e) { showToast("error", e instanceof Error ? e.message : "Failed"); }
    finally { setTriggerLoading(null); }
  };

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "rules",      label: "Rules",      icon: Zap },
    { key: "executions", label: "Executions", icon: Activity },
    { key: "templates",  label: "Templates",  icon: Bell },
    { key: "stats",      label: "Stats",      icon: BarChart3 },
  ];

  return (
    <div className="p-5 space-y-5">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium border ${
              toast.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-600"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}>
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border/50 pb-px overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 whitespace-nowrap transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* ── RULES TAB ── */}
      {tab === "rules" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={ruleSearch} onChange={e => setRuleSearch(e.target.value)}
                  placeholder="Search rules…" className="pl-8 h-8 text-xs" />
              </div>
              <select value={ruleFilter} onChange={e => setRuleFilter(e.target.value as typeof ruleFilter)}
                className="h-8 rounded-md border border-border/50 bg-secondary/30 px-2 text-xs text-foreground">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Paused</option>
              </select>
            </div>
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => void loadRules()} variant="outline">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>

          {rulesLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No rules found.</div>
          ) : (
            <div className="space-y-2">
              {rules.map(rule => (
                <div key={rule.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{rule.name}</span>
                        {rule.isSystem && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">system</Badge>}
                        <Badge variant={rule.isActive ? "default" : "secondary"}
                          className={`text-[10px] px-1.5 py-0 ${rule.isActive ? "bg-green-500/15 text-green-600 border-green-500/20" : ""}`}>
                          {rule.isActive ? "active" : "paused"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {TRIGGER_LABELS[rule.triggerType] ?? rule.triggerType}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          delay: {rule.scheduleDelay > 0 ? `${rule.scheduleDelay}min` : "immediate"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          priority: {rule.priority}
                        </span>
                        {rule.lastRunAt && (
                          <span className="text-[11px] text-muted-foreground">
                            last run: {fmtRelative(rule.lastRunAt)}
                          </span>
                        )}
                        {rule.failureCount > 0 && (
                          <span className="text-[11px] text-destructive">
                            failures: {rule.failureCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                        onClick={() => handleTrigger(rule)} disabled={triggerLoading === rule.id}>
                        {triggerLoading === rule.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Play className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                        onClick={() => handlePauseResume(rule)}>
                        {rule.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 text-green-500" />}
                      </Button>
                      {!rule.isSystem && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDelete(rule)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                        onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}>
                        {expandedRule === rule.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                  {expandedRule === rule.id && (
                    <div className="border-t border-border/50 bg-secondary/20 px-4 py-3 space-y-2">
                      {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Conditions</p>
                          <pre className="text-[11px] font-mono text-foreground bg-background rounded-md border border-border/40 p-2 overflow-x-auto">
                            {JSON.stringify(JSON.parse(rule.conditionDefinition || "[]"), null, 2)}
                          </pre>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Actions</p>
                          <pre className="text-[11px] font-mono text-foreground bg-background rounded-md border border-border/40 p-2 overflow-x-auto">
                            {JSON.stringify(JSON.parse(rule.actionDefinition || "[]"), null, 2)}
                          </pre>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        ID: <span className="font-mono">{rule.id}</span>
                        {" · "}Created: {fmtDate(rule.createdAt)}
                        {" · "}Max retries: {rule.maxRetries}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EXECUTIONS TAB ── */}
      {tab === "executions" && (
        <div className="space-y-4">
          <div className="flex gap-2 items-center flex-wrap">
            <select value={execFilter} onChange={e => setExecFilter(e.target.value)}
              className="h-8 rounded-md border border-border/50 bg-secondary/30 px-2 text-xs text-foreground">
              {["all","queued","running","completed","failed","skipped","cancelled"].map(s => (
                <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>
              ))}
            </select>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => void loadExecs()}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            {/* Execution list */}
            <div className="space-y-2">
              {execsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : execs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No executions found.</div>
              ) : execs.map(ex => (
                <button key={ex.id} onClick={() => setSelectedExec(selectedExec === ex.id ? null : ex.id)}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                    selectedExec === ex.id ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:border-border/80"
                  }`}>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={ex.status} />
                    <span className="text-xs font-mono text-muted-foreground flex-1 truncate">{ex.triggerEvent}</span>
                    <span className="text-[11px] text-muted-foreground">{fmtRelative(ex.createdAt)}</span>
                    <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </div>
                  {ex.entityId && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {ex.entityType}: <span className="font-mono">{ex.entityId.slice(0,12)}…</span>
                    </p>
                  )}
                  {ex.errorMessage && (
                    <p className="text-[11px] text-destructive mt-1 truncate">{ex.errorMessage}</p>
                  )}
                </button>
              ))}
            </div>

            {/* Log panel */}
            {selectedExec && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3 h-fit sticky top-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">Execution Logs</p>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs"
                    onClick={() => setSelectedExec(null)}>×</Button>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground truncate">{selectedExec}</p>
                {logsLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : execLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No logs.</p>
                ) : (
                  <div className="space-y-1.5 max-h-96 overflow-y-auto">
                    {execLogs.map(log => (
                      <div key={log.id} className={`rounded-md px-2.5 py-1.5 text-[11px] border ${
                        log.level === "error" ? "bg-destructive/5 border-destructive/20 text-destructive"
                          : log.level === "warn" ? "bg-amber-500/5 border-amber-500/20 text-amber-600"
                          : "bg-secondary/40 border-border/30 text-foreground"
                      }`}>
                        <span className="font-mono text-[9px] text-muted-foreground mr-2">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                        {log.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TEMPLATES TAB ── */}
      {tab === "templates" && (
        <div className="space-y-5">
          {tplsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {/* Notification templates */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">In-App Notification Templates</h4>
                  <Badge variant="secondary" className="text-[10px]">{notifTpls.length}</Badge>
                </div>
                <div className="space-y-2">
                  {notifTpls.map(tpl => (
                    <div key={tpl.id} className="rounded-xl border border-border bg-card px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{tpl.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded">{tpl.slug}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{tpl.channel}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{tpl.subject}</p>
                          <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">{tpl.bodyTemplate}</p>
                        </div>
                        <Badge variant={tpl.isActive ? "default" : "secondary"}
                          className={`shrink-0 text-[10px] ${tpl.isActive ? "bg-green-500/15 text-green-600 border-green-500/20" : ""}`}>
                          {tpl.isActive ? "active" : "inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email templates */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Email Templates</h4>
                  <Badge variant="secondary" className="text-[10px]">{emailTpls.length}</Badge>
                </div>
                <div className="space-y-2">
                  {emailTpls.map(tpl => (
                    <div key={tpl.id} className="rounded-xl border border-border bg-card px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{tpl.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded">{tpl.slug}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{tpl.subjectTemplate}</p>
                          {tpl.fromEmail && <p className="text-[11px] text-muted-foreground/70">From: {tpl.fromName} &lt;{tpl.fromEmail}&gt;</p>}
                        </div>
                        <Badge variant={tpl.isActive ? "default" : "secondary"}
                          className={`shrink-0 text-[10px] ${tpl.isActive ? "bg-green-500/15 text-green-600 border-green-500/20" : ""}`}>
                          {tpl.isActive ? "active" : "inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── STATS TAB ── */}
      {tab === "stats" && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => void loadStats()}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
          {statsLoading || !stats ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-5">
              {/* Rules KPIs */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Rules</p>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-[11px] text-muted-foreground">Total rules</p>
                    <p className="text-2xl font-display font-bold tabular-nums">{stats.rules.total}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-[11px] text-muted-foreground">Active</p>
                    <p className="text-2xl font-display font-bold text-green-600 tabular-nums">{stats.rules.active}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-[11px] text-muted-foreground">Paused</p>
                    <p className="text-2xl font-display font-bold text-muted-foreground tabular-nums">{stats.rules.inactive}</p>
                  </div>
                </div>
              </div>
              {/* Execution KPIs */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Executions</p>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-[11px] text-muted-foreground">Total</p>
                    <p className="text-2xl font-display font-bold tabular-nums">{stats.execs.total}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-[11px] text-muted-foreground">Completed</p>
                    <p className="text-2xl font-display font-bold text-green-600 tabular-nums">{stats.execs.completed}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-[11px] text-muted-foreground">Failed</p>
                    <p className="text-2xl font-display font-bold text-destructive tabular-nums">{stats.execs.failed}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-[11px] text-muted-foreground">Queued</p>
                    <p className="text-2xl font-display font-bold text-amber-500 tabular-nums">{stats.execs.queued}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-[11px] text-muted-foreground">Last 7 days</p>
                    <p className="text-2xl font-display font-bold text-primary tabular-nums">{stats.execs.last7d}</p>
                  </div>
                </div>
              </div>
              {/* Success rate */}
              {stats.execs.total > 0 && (
                <div className="rounded-xl border border-border bg-card px-5 py-4">
                  <p className="text-xs font-medium text-foreground mb-2">
                    Success rate: {Math.round((stats.execs.completed / stats.execs.total) * 100)}%
                  </p>
                  <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${Math.round((stats.execs.completed / stats.execs.total) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
