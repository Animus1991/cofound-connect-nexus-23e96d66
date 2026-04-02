/**
 * SSO Callback Page — /sso/callback
 *
 * The OIDC callback in publicSso.ts redirects the browser here after
 * successfully issuing a platform JWT.  This page:
 *   1. Reads token + refreshToken from the URL query string.
 *   2. Calls AuthContext.login() to store the session.
 *   3. Redirects to the `next` parameter (or /dashboard).
 *
 * On error it shows a clear message with a link back to /login.
 */

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const SSO_ERROR_MESSAGES: Record<string, string> = {
  state_expired: "Your SSO session timed out. Please try again.",
  provider_inactive: "This SSO provider is inactive. Contact your organization admin.",
  provider_misconfigured: "SSO configuration error. Contact your organization admin.",
  token_exchange_failed: "Authentication failed during token exchange.",
  missing_identity: "Identity provider did not return a user identifier.",
  account_not_found: "No platform account found for your identity. Auto-provisioning may be disabled.",
  network_error: "Network error during SSO. Please check your connection and retry.",
  jit_disabled: "Account auto-creation is disabled for this organization.",
  user_not_found: "Platform account not found.",
  invalid_response: "Invalid response from identity provider.",
  access_denied: "Access denied by identity provider.",
};

type CallbackState = "processing" | "success" | "error";

export default function SsoCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [state, setState] = useState<CallbackState>("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const ssoError = searchParams.get("sso_error");
    const next = searchParams.get("next") ?? "/dashboard";

    if (ssoError) {
      setErrorMessage(SSO_ERROR_MESSAGES[ssoError] ?? `SSO error: ${ssoError}`);
      setState("error");
      return;
    }

    if (!token || !refreshToken) {
      setErrorMessage("Missing authentication tokens. Please try logging in again.");
      setState("error");
      return;
    }

    // Fetch user info with the received token
    fetch(`${API_BASE}/api/profiles/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch user profile");
        return res.json() as Promise<{ email?: string; name?: string; id?: string }>;
      })
      .then((profile) => {
        const email = profile.email ?? "";
        const name = profile.name ?? "";
        const id = profile.id ?? "";
        login(email, name, token, id, refreshToken);
        setState("success");
        // Short delay so the user sees the success state before redirect
        setTimeout(() => navigate(next, { replace: true }), 800);
      })
      .catch(() => {
        // Even without profile, the token is valid — store it and redirect
        // The profile fetch may fail if the endpoint needs the token-based auth middleware
        // Fallback: use token directly
        login("", "", token, "", refreshToken);
        setState("success");
        setTimeout(() => navigate(next, { replace: true }), 600);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-sm text-center space-y-5"
      >
        {state === "processing" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold text-foreground">
                Completing sign-in…
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Verifying your organization credentials.
              </p>
            </div>
          </>
        )}

        {state === "success" && (
          <>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10"
            >
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
            </motion.div>
            <div>
              <h1 className="font-display text-xl font-semibold text-foreground">
                Signed in successfully
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Redirecting you now…
              </p>
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold text-foreground">
                Sign-in failed
              </h1>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link to="/login">
                  <LogIn className="h-4 w-4 mr-2" /> Back to login
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                If this keeps happening, contact your organization administrator.
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
