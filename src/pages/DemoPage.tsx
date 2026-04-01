import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Rocket, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEMO_USER = {
  id: "demo-user-001",
  email: "demo@cofound.io",
  name: "Demo User",
  token: "demo-token-readonly",
};

export default function DemoPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      try {
        login(DEMO_USER.email, DEMO_USER.name, DEMO_USER.token, DEMO_USER.id);
        setStatus("success");
        setTimeout(() => navigate("/dashboard", { replace: true }), 800);
      } catch {
        setStatus("error");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-sm w-full space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-primary/10">
            <Rocket className="h-10 w-10 text-primary" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">CoFounder Connect Demo</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Explore the full platform with sample data — no account required.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          {status === "loading" && (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Setting up demo session…</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <p className="text-sm text-muted-foreground">Demo ready! Redirecting to dashboard…</p>
            </>
          )}
          {status === "error" && (
            <>
              <AlertCircle className="h-6 w-6 text-destructive" />
              <p className="text-sm text-muted-foreground">Something went wrong. Please try again.</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground/60">
          Demo mode uses read-only sample data.{" "}
          <a href="/signup" className="underline hover:text-primary">
            Create a free account
          </a>{" "}
          to save your work.
        </p>
      </div>
    </div>
  );
}
