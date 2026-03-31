import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket, ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Rocket className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">CoFounderBay</span>
          </Link>
          <Link to="/signup">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="mt-2 text-muted-foreground">Last updated: March 2026</p>

        <div className="mt-8 space-y-6 text-foreground/90">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By accessing or using CoFounderBay, you agree to be bound by these Terms of Service.
              If you do not agree, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">2. Description of Service</h2>
            <p className="mt-2">
              CoFounderBay is a platform that connects founders, investors, mentors, and professionals
              in the startup ecosystem. We provide matching, messaging, and collaboration tools.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">3. User Accounts</h2>
            <p className="mt-2">
              You must provide accurate information when creating your account. You are responsible
              for maintaining the confidentiality of your credentials.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">4. User Conduct</h2>
            <p className="mt-2">
              You agree not to use the service for any unlawful purpose or in any way that could
              damage, disable, or impair the platform. Professional and respectful conduct is expected.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">5. Contact</h2>
            <p className="mt-2">
              For questions about these terms, contact us at legal@cofounderbay.com.
            </p>
          </section>
        </div>

        <div className="mt-12">
          <Link to="/signup">
            <Button variant="hero" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Sign up
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
