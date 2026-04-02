/**
 * SSOConfigPanel — Full enterprise SSO admin editor.
 *
 * Sections:
 *  1. SSO Mode + Policy
 *  2. Identity Providers (CRUD + test connection)
 *  3. Domain Mappings
 *  4. Role Mapping Rules
 *  5. Audit Log viewer
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Plus, Trash2, Pencil, RefreshCw, ChevronRight,
  Building2, Globe, GitBranch, ClipboardList, CheckCircle2,
  XCircle, AlertTriangle, Loader2, Wifi, WifiOff, Info,
  ChevronDown, Link2, Lock, Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

// ── API base ──────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

function apiReq<T>(path: string, opts?: RequestInit & { token?: string }): Promise<T> {
  const { token, ...rest } = opts ?? {};
  return fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...rest,
  }).then(async (r) => {
    if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error((b as { error?: string }).error ?? r.statusText); }
    return r.json() as Promise<T>;
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface IdentityProvider {
  id: string;
  tenantId: string;
  providerType: string;
  providerName: string;
  issuerUrl: string | null;
  clientId: string | null;
  clientSecretEncrypted: string | null;
  metadataUrl: string | null;
  scopes: string[];
  loginButtonText: string | null;
  loginButtonLogoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SsoConfig {
  id: string;
  tenantId: string;
  ssoMode: "none" | "optional" | "required";
  allowedDomains: string[];
  autoProvisionEnabled: boolean;
  defaultRole: string;
  showSsoButtonPublicly: boolean;
  postLoginRedirectUrl: string | null;
  postLogoutRedirectUrl: string | null;
  deactivateOnSsoRevoke: boolean;
}

interface DomainMapping {
  id: string;
  domain: string;
  tenantId: string;
  identityProviderId: string | null;
  ssoRequired: boolean;
  isVerified: boolean;
  verificationToken: string | null;
  verifiedAt: string | null;
}

interface RoleMappingRule {
  id: string;
  identityProviderId: string;
  claimKey: string;
  claimValue: string;
  mappedRole: string;
  priority: number;
  isActive: boolean;
}

interface AuditLogEntry {
  id: string;
  eventType: string;
  outcome: string;
  email: string | null;
  externalSubject: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  ipAddress: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface AuditStats { total: number; successes: number; failures: number; provisions: number }

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function OutcomeIcon({ outcome }: { outcome: string }) {
  if (outcome === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (outcome === "failure") return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
  return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
}

const EVENT_LABELS: Record<string, string> = {
  login_attempt: "Login attempt",
  login_success: "Login success",
  login_failure: "Login failure",
  jit_provision: "JIT provisioned",
  link_identity: "Identity linked",
  unlink_identity: "Identity unlinked",
  sso_revoke: "SSO revoked",
  domain_verify: "Domain verify",
  config_change: "Config changed",
  test_connection: "Test connection",
};

// ── Main component ────────────────────────────────────────────────────────────

interface SSOConfigPanelProps {
  /** If provided, scopes the panel to a specific tenant. If omitted, shows a tenant selector. */
  tenantId?: string;
}

export default function SSOConfigPanel({ tenantId: propTenantId }: SSOConfigPanelProps) {
  const { user } = useAuth();
  const token = user?.token ?? null;
  const [activeTab, setActiveTab] = useState<"mode" | "providers" | "domains" | "roles" | "audit">("mode");

  // ── Tenant selection (when no tenantId prop) ────────────────────────────────
  const [tenantId, setTenantId] = useState(propTenantId ?? "");

  // ── SSO Mode / Config ────────────────────────────────────────────────────────
  const [ssoConfig, setSsoConfig] = useState<SsoConfig | null>(null);
  const [ssoConfigDraft, setSsoConfigDraft] = useState<Partial<SsoConfig>>({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMsg, setConfigMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ── Identity Providers ───────────────────────────────────────────────────────
  const [providers, setProviders] = useState<IdentityProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<IdentityProvider | null>(null);
  const [providerDraft, setProviderDraft] = useState<Partial<IdentityProvider & { clientSecret: string }>>({});
  const [providerMode, setProviderMode] = useState<"list" | "create" | "edit">("list");
  const [savingProvider, setSavingProvider] = useState(false);
  const [testResult, setTestResult] = useState<{ reachable: boolean; discoveryValid: boolean; error: string | null } | null>(null);
  const [testingProvider, setTestingProvider] = useState(false);

  // ── Domains ─────────────────────────────────────────────────────────────────
  const [domains, setDomains] = useState<DomainMapping[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [newDomainProviderId, setNewDomainProviderId] = useState("");
  const [newDomainRequired, setNewDomainRequired] = useState(false);
  const [addingDomain, setAddingDomain] = useState(false);

  // ── Role Mappings ────────────────────────────────────────────────────────────
  const [roleMappings, setRoleMappings] = useState<RoleMappingRule[]>([]);
  const [roleMappingProviderId, setRoleMappingProviderId] = useState("");
  const [newRuleKey, setNewRuleKey] = useState("");
  const [newRuleValue, setNewRuleValue] = useState("");
  const [newRuleRole, setNewRuleRole] = useState("founder");
  const [addingRule, setAddingRule] = useState(false);

  // ── Audit Log ────────────────────────────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState<string>("");

  // ── Loading ──────────────────────────────────────────────────────────────────
  const [loadingProviders, setLoadingProviders] = useState(false);

  const tid = tenantId;

  const loadConfig = useCallback(async () => {
    if (!tid || !token) return;
    try {
      const r = await apiReq<{ config: SsoConfig | null }>(`/api/sso/tenants/${tid}/config`, { token });
      setSsoConfig(r.config);
      setSsoConfigDraft(r.config ?? { ssoMode: "none", autoProvisionEnabled: true, defaultRole: "founder", deactivateOnSsoRevoke: false, showSsoButtonPublicly: false });
    } catch {}
  }, [tid, token]);

  const loadProviders = useCallback(async () => {
    if (!tid || !token) return;
    setLoadingProviders(true);
    try {
      const r = await apiReq<{ providers: IdentityProvider[] }>(`/api/sso/tenants/${tid}/providers`, { token });
      setProviders(r.providers);
    } catch {} finally { setLoadingProviders(false); }
  }, [tid, token]);

  const loadDomains = useCallback(async () => {
    if (!tid || !token) return;
    try {
      const r = await apiReq<{ domains: DomainMapping[] }>(`/api/sso/tenants/${tid}/domains`, { token });
      setDomains(r.domains);
    } catch {}
  }, [tid, token]);

  const loadRoleMappings = useCallback(async (providerId: string) => {
    if (!tid || !token || !providerId) return;
    try {
      const r = await apiReq<{ rules: RoleMappingRule[] }>(`/api/sso/tenants/${tid}/providers/${providerId}/role-mappings`, { token });
      setRoleMappings(r.rules);
    } catch {}
  }, [tid, token]);

  const loadAuditLogs = useCallback(async () => {
    if (!tid || !token) return;
    setAuditLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        apiReq<{ logs: AuditLogEntry[] }>(`/api/sso/tenants/${tid}/audit-logs${auditFilter ? `?eventType=${auditFilter}` : ""}`, { token }),
        apiReq<AuditStats>(`/api/sso/tenants/${tid}/audit-logs/stats`, { token }),
      ]);
      setAuditLogs(logsRes.logs);
      setAuditStats(statsRes);
    } catch {} finally { setAuditLoading(false); }
  }, [tid, token, auditFilter]);

  useEffect(() => { if (tid) { loadConfig(); loadProviders(); loadDomains(); } }, [tid, loadConfig, loadProviders, loadDomains]);
  useEffect(() => { if (activeTab === "audit" && tid) loadAuditLogs(); }, [activeTab, tid, loadAuditLogs]);
  useEffect(() => { if (activeTab === "roles" && providers.length > 0 && !roleMappingProviderId) { const first = providers[0].id; setRoleMappingProviderId(first); loadRoleMappings(first); } }, [activeTab, providers, roleMappingProviderId, loadRoleMappings]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const saveConfig = async () => {
    if (!tid || !token) return;
    setSavingConfig(true);
    setConfigMsg(null);
    try {
      await apiReq(`/api/sso/tenants/${tid}/config`, {
        method: "PUT", token,
        body: JSON.stringify({
          ssoMode: ssoConfigDraft.ssoMode ?? "none",
          allowedDomains: ssoConfigDraft.allowedDomains ?? [],
          autoProvisionEnabled: ssoConfigDraft.autoProvisionEnabled ?? true,
          defaultRole: ssoConfigDraft.defaultRole ?? "founder",
          showSsoButtonPublicly: ssoConfigDraft.showSsoButtonPublicly ?? false,
          postLoginRedirectUrl: ssoConfigDraft.postLoginRedirectUrl ?? null,
          postLogoutRedirectUrl: ssoConfigDraft.postLogoutRedirectUrl ?? null,
          deactivateOnSsoRevoke: ssoConfigDraft.deactivateOnSsoRevoke ?? false,
        }),
      });
      setConfigMsg({ type: "ok", text: "SSO configuration saved." });
      await loadConfig();
    } catch (e) {
      setConfigMsg({ type: "err", text: (e as Error).message });
    } finally { setSavingConfig(false); }
  };

  const saveProvider = async () => {
    if (!tid || !token) return;
    setSavingProvider(true);
    try {
      const payload = { ...providerDraft };
      if (providerMode === "create") {
        await apiReq(`/api/sso/tenants/${tid}/providers`, { method: "POST", token, body: JSON.stringify(payload) });
      } else if (selectedProvider) {
        await apiReq(`/api/sso/tenants/${tid}/providers/${selectedProvider.id}`, { method: "PUT", token, body: JSON.stringify(payload) });
      }
      await loadProviders();
      setProviderMode("list");
      setProviderDraft({});
    } catch (e) { alert((e as Error).message); }
    finally { setSavingProvider(false); }
  };

  const deleteProvider = async (id: string) => {
    if (!tid || !token || !confirm("Delete this identity provider? All linked domain mappings and user identities will be affected.")) return;
    await apiReq(`/api/sso/tenants/${tid}/providers/${id}`, { method: "DELETE", token });
    await loadProviders();
  };

  const testProvider = async (id: string) => {
    if (!tid || !token) return;
    setTestingProvider(true);
    setTestResult(null);
    try {
      const r = await apiReq<{ result: typeof testResult }>(`/api/sso/tenants/${tid}/providers/${id}/test`, { method: "POST", token });
      setTestResult(r.result);
    } catch (e) { setTestResult({ reachable: false, discoveryValid: false, error: (e as Error).message }); }
    finally { setTestingProvider(false); }
  };

  const addDomain = async () => {
    if (!tid || !token || !newDomain.trim()) return;
    setAddingDomain(true);
    try {
      await apiReq(`/api/sso/tenants/${tid}/domains`, {
        method: "POST", token,
        body: JSON.stringify({ domain: newDomain.trim().toLowerCase(), identityProviderId: newDomainProviderId || null, ssoRequired: newDomainRequired }),
      });
      setNewDomain(""); setNewDomainProviderId(""); setNewDomainRequired(false);
      await loadDomains();
    } catch (e) { alert((e as Error).message); }
    finally { setAddingDomain(false); }
  };

  const verifyDomain = async (id: string) => {
    if (!tid || !token) return;
    await apiReq(`/api/sso/tenants/${tid}/domains/${id}/verify`, { method: "POST", token });
    await loadDomains();
  };

  const deleteDomain = async (id: string) => {
    if (!tid || !token || !confirm("Remove this domain mapping?")) return;
    await apiReq(`/api/sso/tenants/${tid}/domains/${id}`, { method: "DELETE", token });
    await loadDomains();
  };

  const addRuleMapping = async () => {
    if (!tid || !token || !roleMappingProviderId || !newRuleKey || !newRuleValue) return;
    setAddingRule(true);
    try {
      await apiReq(`/api/sso/tenants/${tid}/providers/${roleMappingProviderId}/role-mappings`, {
        method: "POST", token,
        body: JSON.stringify({ claimKey: newRuleKey, claimValue: newRuleValue, mappedRole: newRuleRole }),
      });
      setNewRuleKey(""); setNewRuleValue(""); setNewRuleRole("founder");
      await loadRoleMappings(roleMappingProviderId);
    } catch (e) { alert((e as Error).message); }
    finally { setAddingRule(false); }
  };

  const deleteRuleMapping = async (id: string) => {
    if (!tid || !token || !roleMappingProviderId) return;
    await apiReq(`/api/sso/tenants/${tid}/providers/${roleMappingProviderId}/role-mappings/${id}`, { method: "DELETE", token });
    await loadRoleMappings(roleMappingProviderId);
  };

  // ── No tenant guard ───────────────────────────────────────────────────────────
  if (!propTenantId && !tenantId) {
    return (
      <div className="p-5 space-y-3">
        <SectionHeader icon={ShieldCheck} title="Enterprise SSO" subtitle="Enter a Tenant ID to configure SSO settings" />
        <div className="flex gap-2 max-w-sm">
          <Input placeholder="Tenant ID (UUID)" value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="font-mono text-xs" />
          <Button size="sm" onClick={() => { loadConfig(); loadProviders(); loadDomains(); }} disabled={!tenantId}>Load</Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "mode" as const, label: "SSO Mode", icon: ShieldCheck },
    { id: "providers" as const, label: "Providers", icon: Building2 },
    { id: "domains" as const, label: "Domains", icon: Globe },
    { id: "roles" as const, label: "Role Mapping", icon: GitBranch },
    { id: "audit" as const, label: "Audit Log", icon: ClipboardList },
  ];

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border pb-0 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {/* ── SSO MODE ─────────────────────────────────────────────────────────── */}
          {activeTab === "mode" && (
            <motion.div key="mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <SectionHeader icon={ShieldCheck} title="SSO Mode & Policy" subtitle="Control how members of this tenant authenticate" />

              <div className="grid gap-4 sm:grid-cols-2">
                {/* SSO Mode */}
                <div className="space-y-2">
                  <Label>SSO Mode</Label>
                  <div className="flex flex-col gap-2">
                    {(["none", "optional", "required"] as const).map((m) => (
                      <label key={m} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${ssoConfigDraft.ssoMode === m ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary/40"}`}>
                        <input type="radio" name="ssoMode" value={m} checked={ssoConfigDraft.ssoMode === m} onChange={() => setSsoConfigDraft((d) => ({ ...d, ssoMode: m }))} className="accent-primary" />
                        <div>
                          <p className="text-xs font-medium text-foreground capitalize">{m === "none" ? "No SSO" : m === "optional" ? "Optional SSO" : "Mandatory SSO"}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {m === "none" && "Standard login only"}
                            {m === "optional" && "SSO shown alongside password login"}
                            {m === "required" && "Domain users must use SSO — password blocked"}
                          </p>
                        </div>
                        {m === "required" && <Lock className="h-3.5 w-3.5 text-amber-500 ml-auto" />}
                        {m === "optional" && <Unlock className="h-3.5 w-3.5 text-primary ml-auto" />}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Provisioning settings */}
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-card p-3 space-y-3">
                    <p className="text-xs font-medium text-foreground">JIT Provisioning</p>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" className="accent-primary rounded" checked={ssoConfigDraft.autoProvisionEnabled ?? true}
                        onChange={(e) => setSsoConfigDraft((d) => ({ ...d, autoProvisionEnabled: e.target.checked }))} />
                      <div>
                        <span className="text-xs font-medium text-foreground">Auto-create accounts on first SSO login</span>
                        <p className="text-[10px] text-muted-foreground">JIT provisioning — creates platform user automatically</p>
                      </div>
                    </label>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Default role for new SSO users</Label>
                      <select
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        value={ssoConfigDraft.defaultRole ?? "founder"}
                        onChange={(e) => setSsoConfigDraft((d) => ({ ...d, defaultRole: e.target.value }))}
                      >
                        {["founder", "investor", "mentor", "member"].map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                      </select>
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" className="accent-primary rounded" checked={ssoConfigDraft.deactivateOnSsoRevoke ?? false}
                        onChange={(e) => setSsoConfigDraft((d) => ({ ...d, deactivateOnSsoRevoke: e.target.checked }))} />
                      <div>
                        <span className="text-xs font-medium text-foreground">Deactivate on SSO revoke</span>
                        <p className="text-[10px] text-muted-foreground">Disable user when IdP revokes access</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" className="accent-primary rounded" checked={ssoConfigDraft.showSsoButtonPublicly ?? false}
                        onChange={(e) => setSsoConfigDraft((d) => ({ ...d, showSsoButtonPublicly: e.target.checked }))} />
                      <span className="text-xs font-medium text-foreground">Show SSO button publicly (all users)</span>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Post-login redirect URL</Label>
                    <Input className="text-xs h-8" placeholder="/dashboard or https://…" value={ssoConfigDraft.postLoginRedirectUrl ?? ""}
                      onChange={(e) => setSsoConfigDraft((d) => ({ ...d, postLoginRedirectUrl: e.target.value || null }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Post-logout redirect URL</Label>
                    <Input className="text-xs h-8" placeholder="/login or https://…" value={ssoConfigDraft.postLogoutRedirectUrl ?? ""}
                      onChange={(e) => setSsoConfigDraft((d) => ({ ...d, postLogoutRedirectUrl: e.target.value || null }))} />
                  </div>
                </div>
              </div>

              {configMsg && (
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${configMsg.type === "ok" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                  {configMsg.type === "ok" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  {configMsg.text}
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" onClick={saveConfig} disabled={savingConfig}>
                  {savingConfig ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                  Save SSO Settings
                </Button>
                <Button size="sm" variant="outline" onClick={loadConfig}><RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reload</Button>
              </div>
            </motion.div>
          )}

          {/* ── PROVIDERS ────────────────────────────────────────────────────────── */}
          {activeTab === "providers" && (
            <motion.div key="providers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {providerMode === "list" ? (
                <>
                  <div className="flex items-center justify-between">
                    <SectionHeader icon={Building2} title="Identity Providers" subtitle="Configure SAML or OIDC connections" />
                    <Button size="sm" onClick={() => { setProviderDraft({ providerType: "oidc", isActive: true, scopes: ["openid", "email", "profile"] as unknown as string[] }); setProviderMode("create"); }}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Provider
                    </Button>
                  </div>

                  {loadingProviders ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : providers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-10 text-center">
                      <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No identity providers configured</p>
                      <p className="text-xs text-muted-foreground mt-1">Add a SAML or OIDC provider to enable SSO</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {providers.map((p) => (
                        <div key={p.id} className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground truncate">{p.providerName}</span>
                              <Badge variant={p.isActive ? "default" : "secondary"} className="text-[10px]">{p.isActive ? "Active" : "Inactive"}</Badge>
                              <Badge variant="outline" className="text-[10px] capitalize">{p.providerType}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.issuerUrl ?? p.metadataUrl ?? "No endpoint configured"}</p>
                            {p.loginButtonText && <p className="text-[10px] text-muted-foreground mt-0.5">Button: "{p.loginButtonText}"</p>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button size="sm" variant="ghost" className="h-7 px-2"
                              onClick={() => { testProvider(p.id); setSelectedProvider(p); }}
                            >
                              {testingProvider && selectedProvider?.id === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2"
                              onClick={() => { setSelectedProvider(p); setProviderDraft({ ...p }); setProviderMode("edit"); setTestResult(null); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive"
                              onClick={() => deleteProvider(p.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Test result banner */}
                  {testResult && (
                    <div className={`rounded-lg border px-3 py-2.5 text-xs space-y-1 ${testResult.reachable ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                      <div className="flex items-center gap-2 font-medium">
                        {testResult.reachable ? <Wifi className="h-3.5 w-3.5 text-emerald-500" /> : <WifiOff className="h-3.5 w-3.5 text-destructive" />}
                        {testResult.reachable ? "Provider reachable" : "Provider unreachable"}
                        {testResult.discoveryValid && <Badge variant="secondary" className="text-[10px]">Discovery valid</Badge>}
                      </div>
                      {testResult.error && <p className="text-muted-foreground">{testResult.error}</p>}
                    </div>
                  )}
                </>
              ) : (
                /* Provider create/edit form */
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setProviderMode("list"); setProviderDraft({}); setTestResult(null); }}>
                      <ChevronDown className="h-3.5 w-3.5 rotate-90" />
                    </Button>
                    <h3 className="text-sm font-semibold text-foreground">
                      {providerMode === "create" ? "New Identity Provider" : `Edit: ${selectedProvider?.providerName}`}
                    </h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Provider name *</Label>
                      <Input className="h-8 text-xs" placeholder="e.g. Athens University SSO" value={providerDraft.providerName ?? ""}
                        onChange={(e) => setProviderDraft((d) => ({ ...d, providerName: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Provider type *</Label>
                      <select className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        value={providerDraft.providerType ?? "oidc"}
                        onChange={(e) => setProviderDraft((d) => ({ ...d, providerType: e.target.value }))}
                      >
                        {["oidc", "saml", "google_workspace", "microsoft_entra", "okta", "ping", "custom"].map((t) => (
                          <option key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">Issuer URL / Entity ID</Label>
                      <Input className="h-8 text-xs font-mono" placeholder="https://accounts.google.com" value={providerDraft.issuerUrl ?? ""}
                        onChange={(e) => setProviderDraft((d) => ({ ...d, issuerUrl: e.target.value || null }))} />
                    </div>
                    {providerDraft.providerType !== "saml" && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Client ID</Label>
                          <Input className="h-8 text-xs font-mono" placeholder="client_id" value={providerDraft.clientId ?? ""}
                            onChange={(e) => setProviderDraft((d) => ({ ...d, clientId: e.target.value || null }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Client Secret</Label>
                          <Input className="h-8 text-xs font-mono" type="password" placeholder={providerMode === "edit" ? "(unchanged)" : "client_secret"}
                            onChange={(e) => setProviderDraft((d) => ({ ...d, clientSecretEncrypted: e.target.value || null }))} />
                        </div>
                      </>
                    )}
                    {providerDraft.providerType === "saml" && (
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs">SAML Metadata URL</Label>
                        <Input className="h-8 text-xs font-mono" placeholder="https://idp.example.com/metadata.xml" value={providerDraft.metadataUrl ?? ""}
                          onChange={(e) => setProviderDraft((d) => ({ ...d, metadataUrl: e.target.value || null }))} />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Login button text</Label>
                      <Input className="h-8 text-xs" placeholder="Sign in with University" value={providerDraft.loginButtonText ?? ""}
                        onChange={(e) => setProviderDraft((d) => ({ ...d, loginButtonText: e.target.value || null }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Login button logo URL</Label>
                      <Input className="h-8 text-xs font-mono" placeholder="https://…/logo.png" value={providerDraft.loginButtonLogoUrl ?? ""}
                        onChange={(e) => setProviderDraft((d) => ({ ...d, loginButtonLogoUrl: e.target.value || null }))} />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="accent-primary rounded" checked={providerDraft.isActive ?? true}
                          onChange={(e) => setProviderDraft((d) => ({ ...d, isActive: e.target.checked }))} />
                        <span className="text-xs font-medium text-foreground">Provider active</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveProvider} disabled={savingProvider}>
                      {savingProvider ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                      {providerMode === "create" ? "Create Provider" : "Save Changes"}
                    </Button>
                    {providerMode === "edit" && selectedProvider && (
                      <Button size="sm" variant="outline" onClick={() => testProvider(selectedProvider.id)} disabled={testingProvider}>
                        {testingProvider ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Wifi className="h-3.5 w-3.5 mr-1.5" />}
                        Test Connection
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => { setProviderMode("list"); setProviderDraft({}); }}>Cancel</Button>
                  </div>

                  {testResult && providerMode === "edit" && (
                    <div className={`rounded-lg border px-3 py-2.5 text-xs ${testResult.reachable ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>
                      {testResult.reachable ? "✓ Provider reachable and discovery valid" : `✗ Unreachable${testResult.error ? `: ${testResult.error}` : ""}`}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ── DOMAINS ──────────────────────────────────────────────────────────── */}
          {activeTab === "domains" && (
            <motion.div key="domains" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <SectionHeader icon={Globe} title="Domain Mappings" subtitle="Map email domains to SSO providers for auto-discovery" />

              {/* Add domain form */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-xs font-medium text-foreground">Add domain</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input className="h-8 text-xs font-mono" placeholder="uni.edu" value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value.toLowerCase())} />
                  <select className="rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    value={newDomainProviderId} onChange={(e) => setNewDomainProviderId(e.target.value)}>
                    <option value="">No specific provider</option>
                    {providers.map((p) => <option key={p.id} value={p.id}>{p.providerName}</option>)}
                  </select>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-primary rounded" checked={newDomainRequired} onChange={(e) => setNewDomainRequired(e.target.checked)} />
                    <span className="text-xs text-foreground">SSO required</span>
                  </label>
                </div>
                <Button size="sm" onClick={addDomain} disabled={addingDomain || !newDomain.trim()}>
                  {addingDomain ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                  Add Domain
                </Button>
              </div>

              {/* Domain list */}
              {domains.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-8 text-center">
                  <Globe className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No domains mapped yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {domains.map((d) => (
                    <div key={d.id} className="rounded-lg border border-border bg-card px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <code className="text-xs font-mono font-medium text-foreground">@{d.domain}</code>
                        {d.ssoRequired && <Badge variant="destructive" className="text-[10px]">Required</Badge>}
                        {d.isVerified
                          ? <Badge variant="default" className="text-[10px] bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Verified</Badge>
                          : <Badge variant="outline" className="text-[10px]">Unverified</Badge>
                        }
                        {d.identityProviderId && (
                          <span className="text-[10px] text-muted-foreground hidden sm:block">
                            → {providers.find((p) => p.id === d.identityProviderId)?.providerName ?? "Unknown provider"}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!d.isVerified && (
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => verifyDomain(d.id)}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Verify
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => deleteDomain(d.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  In production, domain verification requires a DNS TXT record lookup. The "Verify" button currently auto-approves for development. Add DNS verification logic in <code className="font-mono">routes/sso.ts</code>.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── ROLE MAPPINGS ────────────────────────────────────────────────────── */}
          {activeTab === "roles" && (
            <motion.div key="roles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <SectionHeader icon={GitBranch} title="Role Mapping Rules" subtitle="Map IdP claim values to platform roles" />

              {/* Provider selector */}
              <div className="flex items-center gap-2">
                <Label className="text-xs shrink-0">Provider:</Label>
                <select className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={roleMappingProviderId}
                  onChange={(e) => { setRoleMappingProviderId(e.target.value); loadRoleMappings(e.target.value); }}
                >
                  <option value="">Select provider…</option>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.providerName}</option>)}
                </select>
              </div>

              {roleMappingProviderId && (
                <>
                  {/* Add rule */}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <p className="text-xs font-medium text-foreground">Add mapping rule</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Claim key</Label>
                        <Input className="h-7 text-xs font-mono" placeholder="groups" value={newRuleKey} onChange={(e) => setNewRuleKey(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Claim value</Label>
                        <Input className="h-7 text-xs font-mono" placeholder="faculty" value={newRuleValue} onChange={(e) => setNewRuleValue(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Platform role</Label>
                        <select className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          value={newRuleRole} onChange={(e) => setNewRuleRole(e.target.value)}>
                          {["founder", "investor", "mentor", "member"].map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <Button size="sm" onClick={addRuleMapping} disabled={addingRule || !newRuleKey || !newRuleValue}>
                      {addingRule ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                      Add Rule
                    </Button>
                  </div>

                  {/* Rule list */}
                  {roleMappings.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-8 text-center">
                      <GitBranch className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No rules yet. First match wins.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {roleMappings.map((r) => (
                        <div key={r.id} className="rounded-lg border border-border bg-card px-3 py-2.5 flex items-center gap-3">
                          <div className="flex items-center gap-2 font-mono text-xs flex-1 min-w-0">
                            <span className="text-muted-foreground">if</span>
                            <code className="rounded bg-secondary px-1 py-0.5">{r.claimKey}</code>
                            <span className="text-muted-foreground">==</span>
                            <code className="rounded bg-secondary px-1 py-0.5">{r.claimValue}</code>
                            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <Badge variant="outline" className="text-[10px] capitalize">{r.mappedRole}</Badge>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {!r.isActive && <Badge variant="secondary" className="text-[10px]">Disabled</Badge>}
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-destructive" onClick={() => deleteRuleMapping(r.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Rules are evaluated in priority order (lower = first). The first matching rule wins.
                      Use the <code className="font-mono">groups</code> claim for group-based mapping (e.g. Google Workspace, Okta) or <code className="font-mono">department</code> for LDAP-style attributes.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── AUDIT LOG ────────────────────────────────────────────────────────── */}
          {activeTab === "audit" && (
            <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <SectionHeader icon={ClipboardList} title="SSO Audit Log" subtitle="Immutable record of all authentication events" />
                <Button size="sm" variant="outline" onClick={loadAuditLogs} disabled={auditLoading}>
                  {auditLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                  Refresh
                </Button>
              </div>

              {/* Stats row */}
              {auditStats && (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Total", value: auditStats.total, color: "text-foreground" },
                    { label: "Success", value: auditStats.successes, color: "text-emerald-500" },
                    { label: "Failures", value: auditStats.failures, color: "text-destructive" },
                    { label: "Provisioned", value: auditStats.provisions, color: "text-primary" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-border bg-card p-3 text-center">
                      <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Event type filter */}
              <div className="flex gap-2 flex-wrap">
                {["", "login_success", "login_failure", "jit_provision", "config_change"].map((f) => (
                  <button key={f} onClick={() => { setAuditFilter(f); }}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${auditFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    {f ? EVENT_LABELS[f] ?? f : "All events"}
                  </button>
                ))}
              </div>

              {/* Log entries */}
              {auditLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : auditLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-10 text-center">
                  <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No audit events yet</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="rounded-lg border border-border bg-card px-3 py-2.5 flex items-start gap-2.5">
                      <OutcomeIcon outcome={log.outcome} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-foreground">{EVENT_LABELS[log.eventType] ?? log.eventType}</span>
                          {log.email && <code className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">{log.email}</code>}
                          {log.errorCode && <Badge variant="destructive" className="text-[10px]">{log.errorCode}</Badge>}
                        </div>
                        {log.errorMessage && <p className="text-[10px] text-destructive mt-0.5 truncate">{log.errorMessage}</p>}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(log.createdAt).toLocaleString()}
                          {log.ipAddress && ` · ${log.ipAddress}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
