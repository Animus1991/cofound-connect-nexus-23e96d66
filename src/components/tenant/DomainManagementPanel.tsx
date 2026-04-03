/**
 * DomainManagementPanel — Tenant-admin domain management.
 * Embedded inside the tenant settings / branding admin area.
 * Allows tenant admins to add subdomains or custom domains, view
 * DNS instructions, trigger verification, set primary, and remove.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Plus, Trash2, Check, X, ShieldCheck, AlertTriangle,
  Loader2, RefreshCw, Copy, ExternalLink, ChevronDown,
  Star, Settings2, Clock, Activity, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  tenantDomainApi, checkSubdomainAvailability,
  VERIFICATION_LABELS, VERIFICATION_COLORS,
  SSL_LABELS, SSL_COLORS, DOMAIN_TYPE_LABELS,
  type TenantDomain, type DomainVerification,
} from "@/lib/domainResolver";

interface DomainManagementPanelProps {
  tenantId: string;
}

type AddMode = "subdomain" | "custom";

const PLATFORM_DOMAIN = import.meta.env.VITE_PLATFORM_DOMAIN ?? "cofounderbay.com";

export default function DomainManagementPanel({ tenantId }: DomainManagementPanelProps) {
  const { user } = useAuth();
  const token = user?.token ?? null;

  const [domains, setDomains] = useState<TenantDomain[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Add domain form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>("subdomain");
  const [subdomainLabel, setSubdomainLabel] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [subAvailability, setSubAvailability] = useState<{ available: boolean; hostname?: string; reason?: string } | null>(null);
  const [subCheckLoading, setSubCheckLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  // Detail expansion
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, DomainVerification[]>>({});
  const [historyLoading, setHistoryLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await tenantDomainApi.list(token, tenantId);
      setDomains(r.domains);
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
    finally { setLoading(false); }
  }, [token, tenantId]);

  useEffect(() => { void load(); }, [load]);

  const loadHistory = useCallback(async (domainId: string) => {
    if (!token || history[domainId]) return;
    setHistoryLoading(domainId);
    try {
      const r = await tenantDomainApi.getHistory(token, tenantId, domainId);
      setHistory((h) => ({ ...h, [domainId]: r.verifications }));
    } finally { setHistoryLoading(null); }
  }, [token, tenantId, history]);

  const checkSubdomainAvailable = useCallback(async (label: string) => {
    if (!label || label.length < 2) { setSubAvailability(null); return; }
    setSubCheckLoading(true);
    try {
      const r = await checkSubdomainAvailability(label);
      setSubAvailability(r);
    } finally { setSubCheckLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (addMode === "subdomain") void checkSubdomainAvailable(subdomainLabel); }, 500);
    return () => clearTimeout(t);
  }, [subdomainLabel, addMode, checkSubdomainAvailable]);

  const doAdd = async () => {
    if (!token) return;
    setAddLoading(true);
    try {
      const domainName = addMode === "subdomain"
        ? `${subdomainLabel.toLowerCase()}.${PLATFORM_DOMAIN}`
        : customDomain.toLowerCase().trim();
      await tenantDomainApi.add(token, tenantId, {
        domainName,
        domainType: addMode,
      });
      setMsg({ type: "ok", text: `Domain ${domainName} added. ${addMode === "custom" ? "Follow DNS instructions to verify." : "Awaiting admin activation."}` });
      setShowAddForm(false);
      setSubdomainLabel("");
      setCustomDomain("");
      setSubAvailability(null);
      await load();
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
    finally { setAddLoading(false); }
  };

  const doVerify = async (domainId: string) => {
    if (!token) return;
    try {
      const r = await tenantDomainApi.verify(token, tenantId, domainId);
      setMsg({ type: r.success ? "ok" : "err", text: r.message });
      await load();
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
  };

  const doSetPrimary = async (domainId: string) => {
    if (!token) return;
    try {
      await tenantDomainApi.setPrimary(token, tenantId, domainId);
      setMsg({ type: "ok", text: "Primary domain updated." });
      await load();
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
  };

  const doRemove = async (domainId: string, name: string) => {
    if (!token || !confirm(`Remove ${name}? This cannot be undone.`)) return;
    try {
      await tenantDomainApi.remove(token, tenantId, domainId);
      setMsg({ type: "ok", text: `Domain ${name} removed.` });
      setExpandedId(null);
      await load();
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setMsg({ type: "ok", text: "Copied to clipboard." });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Domain mapping</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Connect your organization via platform subdomains or custom domains.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="h-8 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" />Add domain
          </Button>
        </div>
      </div>

      {/* Message banner */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs border ${
              msg.type === "ok" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-destructive/10 text-destructive border-destructive/30"
            }`}>
            {msg.type === "ok" ? <Check className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
            {msg.text}
            <button onClick={() => setMsg(null)} className="ml-auto"><X className="h-3 w-3" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add domain form ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="rounded-2xl border border-primary/20 bg-primary/3 p-5 space-y-4">
              <p className="text-sm font-semibold text-foreground">Add a domain</p>

              {/* Mode toggle */}
              <div className="inline-flex items-center gap-0.5 rounded-full border border-border p-0.5 bg-card">
                {(["subdomain", "custom"] as AddMode[]).map((m) => (
                  <button key={m} onClick={() => { setAddMode(m); setSubAvailability(null); }}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all capitalize ${addMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {m === "subdomain" ? `Platform subdomain (.${PLATFORM_DOMAIN})` : "Custom domain"}
                  </button>
                ))}
              </div>

              {addMode === "subdomain" ? (
                <div className="space-y-2">
                  <Label className="text-xs">Subdomain label</Label>
                  <div className="flex items-center gap-0">
                    <Input
                      className="h-9 text-sm rounded-r-none border-r-0 font-mono"
                      placeholder="athens"
                      value={subdomainLabel}
                      onChange={(e) => setSubdomainLabel(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    />
                    <div className="flex items-center px-3 h-9 rounded-r-md border border-border bg-secondary/60 text-xs text-muted-foreground whitespace-nowrap">
                      .{PLATFORM_DOMAIN}
                    </div>
                  </div>
                  {subCheckLoading && <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Checking availability…</p>}
                  {subAvailability && !subCheckLoading && (
                    subAvailability.available
                      ? <p className="text-[11px] text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" />{subAvailability.hostname} is available</p>
                      : <p className="text-[11px] text-destructive flex items-center gap-1"><X className="h-3 w-3" />
                          {subAvailability.reason === "taken" ? "Subdomain is already taken" :
                           subAvailability.reason === "reserved" ? "This subdomain is reserved" :
                           subAvailability.reason === "slug-taken" ? "Conflicts with an existing tenant slug" :
                           "Not available"}
                        </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Platform subdomains are managed by CoFounderBay. No DNS changes required on your end.
                    After adding, an admin will activate your subdomain within 24h.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Custom domain name</Label>
                    <Input className="h-9 text-sm font-mono" placeholder="founders.yourorganization.com"
                      value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} />
                    <p className="text-[10px] text-muted-foreground">Enter the full domain you own. Root domains (e.g. example.org) and subdomains are both supported.</p>
                  </div>

                  {/* DNS preview */}
                  {customDomain && customDomain.includes(".") && (
                    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">DNS configuration required</p>
                      <div className="space-y-1.5">
                        <div className="rounded-lg bg-secondary/50 px-3 py-2 font-mono text-[10px] space-y-1">
                          <p className="text-muted-foreground">Add a CNAME record:</p>
                          <p><span className="text-muted-foreground">Host: </span><strong>{customDomain}</strong></p>
                          <p className="flex items-center gap-1">
                            <span className="text-muted-foreground">Value: </span>
                            <strong>tenants.{PLATFORM_DOMAIN}</strong>
                            <button onClick={() => copyToClipboard(`tenants.${PLATFORM_DOMAIN}`)} className="text-muted-foreground hover:text-foreground ml-0.5">
                              <Copy className="h-3 w-3" />
                            </button>
                          </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          After adding, click <strong>Verify Domain</strong> on the domain card to confirm ownership.
                          DNS changes can take up to 48 hours to propagate.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" onClick={doAdd} disabled={
                  addLoading ||
                  (addMode === "subdomain" && (!subdomainLabel || subAvailability?.available === false)) ||
                  (addMode === "custom" && !customDomain.includes("."))
                } className="gap-2">
                  {addLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
                  Add domain
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(false); setSubAvailability(null); }}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Domain list ──────────────────────────────────────────────── */}
      {loading && domains.length === 0 ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : domains.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <Globe className="h-9 w-9 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No domains configured</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Add a platform subdomain or custom domain so your members can reach your branded space directly.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setShowAddForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />Add your first domain
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {domains.map((domain) => (
            <div key={domain.id} className={`rounded-2xl border overflow-hidden transition-all ${
              domain.isPrimary ? "border-primary/30 bg-primary/3" : "border-border bg-card"
            }`}>
              {/* Header row */}
              <div className="px-4 py-3.5 flex items-start gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  domain.isActive ? "bg-emerald-500/10" : "bg-secondary/50"
                }`}>
                  <Globe className={`h-4 w-4 ${domain.isActive ? "text-emerald-500" : "text-muted-foreground"}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground font-mono">{domain.domainName}</span>
                    <Badge variant="outline" className="text-[10px]">{DOMAIN_TYPE_LABELS[domain.domainType]}</Badge>
                    {domain.isPrimary && (
                      <Badge className="text-[10px] bg-primary/10 text-primary border-0 gap-0.5">
                        <Star className="h-2.5 w-2.5" />Primary
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1">
                    <Badge variant="outline" className={`text-[10px] ${VERIFICATION_COLORS[domain.verificationStatus]}`}>
                      {VERIFICATION_LABELS[domain.verificationStatus]}
                    </Badge>
                    {domain.isActive
                      ? <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-0">Active</Badge>
                      : <Badge variant="secondary" className="text-[10px]">Inactive — pending admin approval</Badge>
                    }
                    <span className={`text-[10px] flex items-center gap-1 ${SSL_COLORS[domain.sslStatus]}`}>
                      {domain.sslStatus === "active" ? <ShieldCheck className="h-3 w-3" /> : null}
                      {SSL_LABELS[domain.sslStatus]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {domain.isActive && (
                    <a href={`https://${domain.domainName}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      const next = expandedId === domain.id ? null : domain.id;
                      setExpandedId(next);
                      if (next) void loadHistory(domain.id);
                    }}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === domain.id ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              <AnimatePresence>
                {expandedId === domain.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-border">
                    <div className="px-4 py-4 space-y-4">

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        {domain.verificationStatus !== "verified" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => doVerify(domain.id)}>
                            <ShieldCheck className="h-3 w-3 mr-1" />Verify domain
                          </Button>
                        )}
                        {domain.isActive && !domain.isPrimary && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => doSetPrimary(domain.id)}>
                            <Star className="h-3 w-3 mr-1" />Set as primary
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => doRemove(domain.id, domain.domainName)}>
                          <Trash2 className="h-3 w-3 mr-1" />Remove
                        </Button>
                      </div>

                      {/* DNS Instructions */}
                      {domain.verificationStatus !== "verified" && (
                        <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Settings2 className="h-3.5 w-3.5" />DNS configuration
                          </p>
                          <p className="text-[11px] text-muted-foreground">{domain.dnsInstructions.summary}</p>

                          {/* Steps */}
                          <ol className="space-y-1">
                            {domain.dnsInstructions.steps.map((step, i) => (
                              <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                                <span className="h-4 w-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                {step}
                              </li>
                            ))}
                          </ol>

                          {/* CNAME record */}
                          {domain.dnsInstructions.cnameRecord && (
                            <div className="rounded-lg bg-secondary/60 p-3 space-y-1 font-mono text-[11px]">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">CNAME Record</p>
                              <p><span className="text-muted-foreground">Host: </span>{domain.dnsInstructions.cnameRecord.host}</p>
                              <p className="flex items-center gap-1">
                                <span className="text-muted-foreground">Value: </span>
                                <strong>{domain.dnsInstructions.cnameRecord.value}</strong>
                                <button onClick={() => copyToClipboard(domain.dnsInstructions.cnameRecord!.value)} className="text-muted-foreground hover:text-foreground">
                                  <Copy className="h-3 w-3" />
                                </button>
                              </p>
                              <p><span className="text-muted-foreground">TTL: </span>{domain.dnsInstructions.cnameRecord.ttl}s</p>
                              {domain.dnsInstructions.cnameRecord.note && (
                                <p className="text-[10px] text-muted-foreground italic">{domain.dnsInstructions.cnameRecord.note}</p>
                              )}
                            </div>
                          )}

                          {/* TXT record */}
                          <div className="rounded-lg bg-secondary/60 p-3 space-y-1 font-mono text-[11px]">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">TXT Record (Ownership verification)</p>
                            <p><span className="text-muted-foreground">Host: </span>{domain.dnsInstructions.txtRecord.host}</p>
                            <p className="flex items-center gap-1 break-all">
                              <span className="text-muted-foreground">Value: </span>
                              <strong>{domain.dnsInstructions.txtRecord.value}</strong>
                              <button onClick={() => copyToClipboard(domain.dnsInstructions.txtRecord.value)} className="text-muted-foreground hover:text-foreground shrink-0">
                                <Copy className="h-3 w-3" />
                              </button>
                            </p>
                            <p><span className="text-muted-foreground">TTL: </span>{domain.dnsInstructions.txtRecord.ttl}s</p>
                          </div>

                          {/* HTTP probe alternative */}
                          {domain.dnsInstructions.httpProbe && (
                            <div className="rounded-lg border border-border/60 p-2.5 space-y-1">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Alternative: HTTP file probe</p>
                              <p className="text-[10px] text-muted-foreground">Serve the following content at:</p>
                              <p className="font-mono text-[10px] text-primary break-all">{domain.dnsInstructions.httpProbe.url}</p>
                              <div className="flex items-center gap-1">
                                <code className="text-[10px] bg-secondary/60 px-2 py-0.5 rounded font-mono">
                                  {domain.dnsInstructions.httpProbe.content}
                                </code>
                                <button onClick={() => copyToClipboard(domain.dnsInstructions.httpProbe!.content)} className="text-muted-foreground hover:text-foreground">
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Verification status info */}
                      {domain.verificationStatus === "verified" && !domain.isActive && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 flex items-start gap-2">
                          <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-foreground">Verified — pending activation</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Your domain ownership is confirmed. A platform admin will activate this domain within 24 hours.
                              Contact support if it takes longer.
                            </p>
                          </div>
                        </div>
                      )}

                      {domain.verificationStatus === "failed" && (
                        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-foreground">Verification failed</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              DNS record not found or doesn't match. Ensure the TXT record is published and wait for DNS propagation (up to 48h), then click Verify again.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Verification history */}
                      {(history[domain.id]?.length ?? 0) > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                            <Activity className="h-3 w-3" />Verification history
                          </p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {history[domain.id].map((v) => (
                              <div key={v.id} className="flex items-start gap-2">
                                <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${v.outcome === "success" ? "bg-emerald-500" : "bg-destructive"}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] text-foreground capitalize">{v.method.replace("_", " ")} · {v.outcome}</p>
                                  {v.errorMessage && <p className="text-[10px] text-destructive">{v.errorMessage}</p>}
                                  <p className="text-[10px] text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {historyLoading === domain.id && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />Loading history…
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground">
          Platform subdomains (e.g. <code className="font-mono">yourname.{PLATFORM_DOMAIN}</code>) are provisioned by the platform team and require admin approval.
          Custom domains need a CNAME record pointing to <code className="font-mono">tenants.{PLATFORM_DOMAIN}</code> and DNS TXT verification before activation.
        </p>
      </div>
    </div>
  );
}
