/**
 * TenantDomainPanel — Super-admin domain management.
 * Displays all registered tenant domains across the platform with
 * tools for approval, activation, force-verify, deactivation, and routing rules.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Check, X, ShieldCheck, AlertTriangle, Loader2,
  RefreshCw, ChevronDown, Plus, Trash2, Lock, Unlock,
  ExternalLink, Copy, Activity, Settings, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  adminDomainApi,
  VERIFICATION_LABELS, VERIFICATION_COLORS,
  SSL_LABELS, SSL_COLORS, DOMAIN_TYPE_LABELS,
  type TenantDomain, type DomainVerification, type DomainRoutingRule,
} from "@/lib/domainResolver";

type Tab = "all" | "pending" | "verified" | "active";

export default function TenantDomainPanel() {
  const { user } = useAuth();
  const token = user?.token ?? null;

  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [domains, setDomains] = useState<(TenantDomain & { tenantSlug: string; tenantDisplayName: string | null })[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 30;
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Detail panel
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    domain: TenantDomain;
    tenant: { id: string; slug: string; displayName: string | null } | null;
    verifications: DomainVerification[];
    rules: DomainRoutingRule[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // New routing rule form
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [newRule, setNewRule] = useState({ ruleType: "auth_mode" as DomainRoutingRule["ruleType"], ruleValue: "open", domainId: "" });

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const statusMap: Record<Tab, string> = { all: "", pending: "pending", verified: "verified", active: "" };
      const r = await adminDomainApi.list(token, { limit, offset: page * limit });
      const filtered = r.domains.filter((d) => {
        if (tab === "active") return d.isActive;
        if (tab === "pending") return d.verificationStatus === "pending";
        if (tab === "verified") return d.verificationStatus === "verified" && !d.isActive;
        return true;
      }).filter((d) => !search || d.domainName.includes(search.toLowerCase()) || (d.tenantSlug ?? "").includes(search.toLowerCase()));
      setDomains(filtered);
      setTotal(r.total);
    } finally { setLoading(false); }
  }, [token, page, tab, search]);

  useEffect(() => { void load(); }, [load]);

  const loadDetail = useCallback(async (domainId: string) => {
    if (!token) return;
    setDetailLoading(true);
    try {
      const r = await adminDomainApi.get(token, domainId);
      setDetail(r);
      setNewRule((prev) => ({ ...prev, domainId }));
    } finally { setDetailLoading(false); }
  }, [token]);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const act = async (action: () => Promise<{ success: boolean }>, successMsg: string) => {
    try {
      await action();
      setMsg({ type: "ok", text: successMsg });
      void load();
      if (selectedId) void loadDetail(selectedId);
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text).catch(() => {}); };

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All domains" },
    { id: "pending", label: "Pending verification" },
    { id: "verified", label: "Verified, inactive" },
    { id: "active", label: "Active" },
  ];

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="flex gap-0.5 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setPage(0); }}
            className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {/* Message */}
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs border ${
                msg.type === "ok" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-destructive/10 text-destructive border-destructive/30"
              }`}>
              {msg.type === "ok" ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              {msg.text}
              <button onClick={() => setMsg(null)} className="ml-auto"><X className="h-3 w-3" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search + refresh */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="pl-8 h-8 text-xs" placeholder="Search domain or tenant slug…"
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
          </div>
          <Button size="sm" variant="ghost" className="h-8" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">{total} total registered domains</p>

        <div className="grid gap-3 lg:grid-cols-[1fr_380px]">
          {/* Domain list */}
          <div className="space-y-2">
            {loading && domains.length === 0 ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : domains.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-10 text-center">
                <Globe className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No domains found</p>
              </div>
            ) : (
              domains.map((d) => (
                <div key={d.id}
                  onClick={() => setSelectedId(selectedId === d.id ? null : d.id)}
                  className={`rounded-xl border cursor-pointer transition-all overflow-hidden ${
                    selectedId === d.id ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:border-primary/20"
                  }`}>
                  <div className="px-4 py-3 flex items-start gap-3">
                    <Globe className={`h-4 w-4 shrink-0 mt-0.5 ${d.isActive ? "text-emerald-500" : "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground font-mono">{d.domainName}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {DOMAIN_TYPE_LABELS[d.domainType] ?? d.domainType}
                        </Badge>
                        {d.isPrimary && <Badge className="text-[10px] bg-primary/10 text-primary border-0">Primary</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">
                          Tenant: <strong className="text-foreground">{d.tenantDisplayName ?? d.tenantSlug}</strong>
                        </span>
                        <span className={`text-[10px] font-medium ${VERIFICATION_COLORS[d.verificationStatus].split(" ")[1]}`}>
                          {VERIFICATION_LABELS[d.verificationStatus]}
                        </span>
                        <span className={`text-[10px] ${SSL_COLORS[d.sslStatus]}`}>
                          {SSL_LABELS[d.sslStatus]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {d.isActive
                        ? <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">Active</Badge>
                        : <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${selectedId === d.id ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {/* Quick actions row */}
                  <AnimatePresence>
                    {selectedId === d.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border bg-secondary/20 px-4 py-2.5 flex gap-2 flex-wrap overflow-hidden">
                        {!d.isActive && d.verificationStatus === "verified" && (
                          <Button size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); act(() => adminDomainApi.activate(token!, d.id), "Domain activated."); }}>
                            <Unlock className="h-3 w-3 mr-1" />Activate
                          </Button>
                        )}
                        {!d.isActive && d.verificationStatus !== "verified" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); act(() => adminDomainApi.approve(token!, d.id), "Domain approved and activated."); }}>
                            <ShieldCheck className="h-3 w-3 mr-1" />Approve & Activate
                          </Button>
                        )}
                        {d.isActive && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-amber-600 border-amber-500/30" onClick={(e) => { e.stopPropagation(); act(() => adminDomainApi.deactivate(token!, d.id), "Domain deactivated."); }}>
                            <Lock className="h-3 w-3 mr-1" />Deactivate
                          </Button>
                        )}
                        {d.verificationStatus !== "verified" && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); act(() => adminDomainApi.forceVerify(token!, d.id), "Domain force-verified."); }}>
                            <Check className="h-3 w-3 mr-1" />Force verify
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); if (!confirm(`Delete domain ${d.domainName}?`)) return; act(() => adminDomainApi.remove(token!, d.id), "Domain removed."); }}>
                          <Trash2 className="h-3 w-3 mr-1" />Remove
                        </Button>
                        <a href={`https://${d.domainName}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />Preview
                          </Button>
                        </a>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}

            {/* Pagination */}
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="h-7 text-xs">Prev</Button>
              <span className="text-xs text-muted-foreground">Page {page + 1}</span>
              <Button size="sm" variant="outline" disabled={(page + 1) * limit >= total} onClick={() => setPage((p) => p + 1)} className="h-7 text-xs">Next</Button>
            </div>
          </div>

          {/* Detail panel */}
          {selectedId && (
            <div className="rounded-xl border border-border bg-card overflow-hidden self-start">
              {detailLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : detail ? (
                <div className="divide-y divide-border">
                  {/* Header */}
                  <div className="px-4 py-3 bg-secondary/30">
                    <p className="text-xs font-semibold text-foreground font-mono">{detail.domain.domainName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {detail.tenant?.displayName ?? detail.tenant?.slug ?? "Unknown tenant"}
                    </p>
                  </div>

                  {/* DNS instructions */}
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Settings className="h-3.5 w-3.5" />DNS Instructions
                    </p>
                    {detail.domain.dnsInstructions.cnameRecord && (
                      <div className="rounded-lg bg-secondary/40 p-2.5 space-y-1">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">CNAME Record</p>
                        <div className="font-mono text-[10px] space-y-0.5">
                          <p><span className="text-muted-foreground">Host: </span>{detail.domain.dnsInstructions.cnameRecord.host}</p>
                          <p className="flex items-center gap-1">
                            <span className="text-muted-foreground">Value: </span>{detail.domain.dnsInstructions.cnameRecord.value}
                            <button onClick={() => copyToClipboard(detail.domain.dnsInstructions.cnameRecord!.value)} className="text-muted-foreground hover:text-foreground ml-1">
                              <Copy className="h-3 w-3" />
                            </button>
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="rounded-lg bg-secondary/40 p-2.5 space-y-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">TXT Record (Verification)</p>
                      <div className="font-mono text-[10px] space-y-0.5">
                        <p><span className="text-muted-foreground">Host: </span>{detail.domain.dnsInstructions.txtRecord.host}</p>
                        <p className="flex items-center gap-1 break-all">
                          <span className="text-muted-foreground">Value: </span>{detail.domain.dnsInstructions.txtRecord.value}
                          <button onClick={() => copyToClipboard(detail.domain.dnsInstructions.txtRecord.value)} className="text-muted-foreground hover:text-foreground ml-1 shrink-0">
                            <Copy className="h-3 w-3" />
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Routing rules */}
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-foreground">Routing rules</p>
                      <button onClick={() => setShowRuleForm(!showRuleForm)} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                        <Plus className="h-3 w-3" />Add
                      </button>
                    </div>

                    {showRuleForm && (
                      <div className="rounded-lg border border-border bg-secondary/20 p-2.5 space-y-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Rule type</Label>
                          <select className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            value={newRule.ruleType}
                            onChange={(e) => setNewRule((r) => ({ ...r, ruleType: e.target.value as DomainRoutingRule["ruleType"] }))}>
                            <option value="auth_mode">Auth mode</option>
                            <option value="landing_path">Landing path</option>
                            <option value="feature_preset">Feature preset</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Value</Label>
                          {newRule.ruleType === "auth_mode" ? (
                            <select className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              value={newRule.ruleValue}
                              onChange={(e) => setNewRule((r) => ({ ...r, ruleValue: e.target.value }))}>
                              <option value="open">open — anyone can register</option>
                              <option value="invite_only">invite_only — invitation required</option>
                              <option value="sso_required">sso_required — SSO login only</option>
                              <option value="disabled">disabled — access suspended</option>
                            </select>
                          ) : (
                            <Input className="h-7 text-xs" placeholder={newRule.ruleType === "landing_path" ? "/custom-landing" : "preset-name"}
                              value={newRule.ruleValue} onChange={(e) => setNewRule((r) => ({ ...r, ruleValue: e.target.value }))} />
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <Button size="sm" className="h-7 text-xs" onClick={async () => {
                            if (!token || !detail) return;
                            try {
                              await adminDomainApi.createRoutingRule(token, detail.domain.tenantId, {
                                domainId: detail.domain.id,
                                ruleType: newRule.ruleType,
                                ruleValue: newRule.ruleValue,
                                config: {},
                                isActive: true,
                              });
                              setMsg({ type: "ok", text: "Rule created." });
                              setShowRuleForm(false);
                              void loadDetail(selectedId!);
                            } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
                          }}>Save</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowRuleForm(false)}>Cancel</Button>
                        </div>
                      </div>
                    )}

                    {detail.rules.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground">No routing rules configured.</p>
                    ) : (
                      <div className="space-y-1">
                        {detail.rules.map((rule) => (
                          <div key={rule.id} className="flex items-center gap-2 rounded-lg bg-secondary/30 px-2.5 py-1.5">
                            <span className="text-[10px] font-medium text-foreground capitalize">{rule.ruleType.replace("_", " ")}</span>
                            <code className="text-[10px] font-mono text-primary">{rule.ruleValue}</code>
                            <Badge variant={rule.isActive ? "default" : "secondary"} className="text-[9px] ml-auto">
                              {rule.isActive ? "active" : "inactive"}
                            </Badge>
                            <button className="text-muted-foreground hover:text-destructive transition-colors"
                              onClick={() => {
                                if (!token || !confirm("Delete this rule?")) return;
                                adminDomainApi.deleteRoutingRule(token, rule.id)
                                  .then(() => { setMsg({ type: "ok", text: "Rule deleted." }); void loadDetail(selectedId!); })
                                  .catch((e: Error) => setMsg({ type: "err", text: e.message }));
                              }}>
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Verification history */}
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5" />Verification history
                    </p>
                    {detail.verifications.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground">No verification attempts yet.</p>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {detail.verifications.map((v) => (
                          <div key={v.id} className="flex items-start gap-2">
                            <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${v.outcome === "success" ? "bg-emerald-500" : "bg-destructive"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-foreground capitalize">{v.method.replace("_", " ")} · {v.actor}</p>
                              {v.errorMessage && <p className="text-[10px] text-destructive">{v.errorMessage}</p>}
                              {v.resolvedValue && <p className="text-[10px] text-muted-foreground font-mono truncate">{v.resolvedValue}</p>}
                              <p className="text-[10px] text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
