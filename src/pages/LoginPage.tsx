import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Rocket, Mail, Lock, ArrowRight, Eye, EyeOff, Loader2,
  Building2, ShieldCheck, AlertTriangle, ChevronLeft, KeyRound,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { api } from "@/lib/api";
import {
  discoverSsoForEmail, buildSsoInitiateUrl, providerTypeLabel, providerTypeIconUrl,
  debounce, type SsoDiscoveryResult, type SsoProvider,
} from "@/lib/ssoDiscovery";

// ── SSO error message map ─────────────────────────────────────────────────────
const SSO_ERROR_MESSAGES: Record<string, string> = {
  state_expired: "Your SSO session expired. Please try again.",
  provider_inactive: "This SSO provider is currently inactive. Contact your organization admin.",
  provider_misconfigured: "SSO provider configuration error. Contact your organization admin.",
  token_exchange_failed: "SSO authentication failed during token exchange. Please retry.",
  missing_identity: "The identity provider did not return a user identifier. Contact your admin.",
  account_not_found: "No platform account was found for your identity. Auto-provisioning may be disabled.",
  network_error: "Network error contacting the identity provider. Please retry.",
  jit_disabled: "Account auto-creation is disabled for this organization. Contact your admin.",
  user_not_found: "Platform account not found. Contact your organization administrator.",
  invalid_response: "Invalid response from identity provider.",
  access_denied: "Access was denied by the identity provider.",
};

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { tenant, isBrandingActive } = useTenant();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── SSO discovery state ─────────────────────────────────────────────────────
  const [ssoDiscovering, setSsoDiscovering] = useState(false);
  const [ssoResult, setSsoResult] = useState<SsoDiscoveryResult | null>(null);
  // showPasswordForm: true = show email+password form; false = show SSO-only view
  const [showPasswordForm, setShowPasswordForm] = useState(true);

  const oauthBase = import.meta.env.DEV ? "http://localhost:3002" : "";

  // ── Redirect if already authenticated ─────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  // ── URL error params (SSO callback errors + legacy ?error=) ───────────────
  useEffect(() => {
    const urlError = searchParams.get("sso_error") ?? searchParams.get("error");
    if (urlError) {
      setError(SSO_ERROR_MESSAGES[urlError] ?? `Authentication error: ${urlError}`);
    }
  }, [searchParams]);

  // ── Debounced SSO discovery ─────────────────────────────────────────────────
  const debouncedDiscover = useRef(
    debounce(async (emailVal: string) => {
      if (!emailVal.includes("@") || !emailVal.split("@")[1]?.includes(".")) {
        setSsoResult(null);
        setShowPasswordForm(true);
        setSsoDiscovering(false);
        return;
      }
      setSsoDiscovering(true);
      const result = await discoverSsoForEmail(emailVal);
      setSsoResult(result);
      // If SSO is required, switch to SSO-only view automatically
      if (result.ssoRequired && result.ssoAvailable) {
        setShowPasswordForm(false);
      } else {
        setShowPasswordForm(true);
      }
      setSsoDiscovering(false);
    }, 600),
  ).current;

  const handleEmailChange = useCallback((val: string) => {
    setEmail(val);
    setSsoResult(null);
    if (val.length > 5) debouncedDiscover(val);
    else { setShowPasswordForm(true); setSsoDiscovering(false); }
  }, [debouncedDiscover]);

  // ── Standard login submit ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.auth.login({ email, password });
      login(res.user.email, res.user.name, res.token, res.user.id, res.refreshToken);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = (err as { error?: string })?.error ?? "Unable to sign in. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── SSO login initiation ───────────────────────────────────────────────────
  const handleSsoLogin = (provider: SsoProvider) => {
    if (!ssoResult?.tenantId) return;
    const url = buildSsoInitiateUrl(ssoResult.tenantId, provider.id, "/dashboard");
    window.location.href = url;
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Form */}
      <div className="flex w-full flex-col justify-center px-6 sm:px-8 lg:w-1/2 lg:px-20 relative z-10">
        <div className="absolute inset-0 bg-cover bg-center opacity-10 lg:hidden" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="absolute inset-0 bg-background/90 lg:hidden" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm relative z-10"
        >
          {/* Brand header */}
          <Link to="/" className="mb-10 flex items-center gap-2 group">
            {isBrandingActive && tenant?.branding?.logoUrl ? (
              <img src={tenant.branding.logoUrl} alt={tenant.branding.logoAltText ?? tenant.displayName ?? "Logo"} className="h-8 w-auto max-w-[140px] object-contain" />
            ) : (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary transition-transform duration-300 group-hover:scale-110">
                  <Rocket className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-display text-xl font-bold text-foreground">
                  {isBrandingActive && tenant?.displayName ? tenant.displayName : "CoFounder Connect"}
                </span>
              </>
            )}
          </Link>

          {/* SSO-only view (when SSO is required for this domain) */}
          <AnimatePresence mode="wait">
            {!showPasswordForm && ssoResult?.ssoRequired ? (
              <motion.div
                key="sso-only"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* SSO context banner */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {ssoResult.tenantName ?? "Your Organization"} SSO
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your email domain <strong className="text-foreground">@{ssoResult.domain}</strong> requires Single Sign-On. Password login is disabled for this account.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-sso">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email-sso"
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className="pl-10 bg-secondary/30"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Provider buttons */}
                <div className="space-y-2">
                  {ssoResult.providers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSsoLogin(p)}
                      className="w-full flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-secondary/60 hover:shadow-sm active:scale-[0.99]"
                    >
                      {p.loginButtonLogoUrl || providerTypeIconUrl(p.providerType) ? (
                        <img src={p.loginButtonLogoUrl ?? providerTypeIconUrl(p.providerType)!} alt="" className="h-5 w-5 object-contain rounded" />
                      ) : (
                        <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                      )}
                      <span className="flex-1 text-left">{p.loginButtonText ?? `Continue with ${p.providerName}`}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}

                <button
                  onClick={() => { setShowPasswordForm(true); setSsoResult(null); setEmail(""); }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Use a different account
                </button>
              </motion.div>

            ) : (
              <motion.div
                key="standard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="font-display text-3xl font-bold text-foreground">Welcome back</h1>
                <p className="mt-2 text-muted-foreground">Log in to your account to continue building.</p>

                {/* SSO optional banner */}
                <AnimatePresence>
                  {ssoResult?.ssoAvailable && !ssoResult.ssoRequired && ssoResult.providers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-2 overflow-hidden"
                    >
                      <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-xs font-medium text-foreground">
                            {ssoResult.tenantName ?? "Your Organization"} SSO available
                          </span>
                          <Badge variant="secondary" className="text-[10px] ml-auto">Recommended</Badge>
                        </div>
                        <div className="space-y-1.5">
                          {ssoResult.providers.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => handleSsoLogin(p)}
                              className="w-full flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-card hover:shadow-sm"
                            >
                              {p.loginButtonLogoUrl || providerTypeIconUrl(p.providerType) ? (
                                <img src={p.loginButtonLogoUrl ?? providerTypeIconUrl(p.providerType)!} alt="" className="h-4 w-4 object-contain rounded" />
                              ) : (
                                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                              )}
                              <span className="flex-1 text-left text-xs">{p.loginButtonText ?? `Continue with ${p.providerName}`}</span>
                              <span className="text-[10px] text-muted-foreground">{providerTypeLabel(p.providerType)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/40" /></div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-background px-2 text-muted-foreground">or sign in with password</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@startup.com"
                        className="pl-10 pr-10 transition-shadow focus-visible:shadow-glow"
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        autoFocus
                      />
                      {ssoDiscovering && (
                        <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="pl-10 pr-10 transition-shadow focus-visible:shadow-glow"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5"
                    >
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-xs text-destructive">{error}</p>
                    </motion.div>
                  )}

                  <div className="flex items-center justify-end">
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline transition-colors">
                      Forgot password?
                    </Link>
                  </div>

                  <Button variant="hero" className="w-full gap-2 group" size="lg" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <><KeyRound className="h-4 w-4" /> Log in <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
                    )}
                  </Button>
                </form>

                {/* OAuth social login */}
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-background px-2 text-muted-foreground">or continue with</span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <a href={`${oauthBase}/api/auth/google`} className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                      <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      Google
                    </a>
                    <a href={`${oauthBase}/api/auth/github`} className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                      GitHub
                    </a>
                  </div>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/signup" className="font-medium text-primary hover:underline">Sign up free</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right - Visual (Alliance-inspired full-bleed image) */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/50 to-primary/20" />
        <div className="relative z-10 flex h-full items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-md px-8 text-center"
          >
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 backdrop-blur-sm animate-pulse-glow">
              <Rocket className="h-10 w-10 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Your next co-founder is waiting
            </h2>
            <p className="mt-4 text-muted-foreground">
              Join a thriving community of founders, investors, and startup
              professionals.
            </p>
            <div className="mt-8 flex items-center justify-center gap-6">
              {[
                { label: "Founders", count: "12K+" },
                { label: "Matches", count: "50K+" },
                { label: "Startups", count: "8K+" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-xl font-bold text-primary">{stat.count}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
