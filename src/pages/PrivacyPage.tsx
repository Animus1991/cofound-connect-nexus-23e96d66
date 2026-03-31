import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
        <h1 className="font-display text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-muted-foreground">Last updated: March 2026</p>

        <div className="mt-8 space-y-6 text-foreground/90">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p className="mt-2">
              We collect information you provide when registering (name, email, profile data),
              usage data, and cookies necessary for the platform to function.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">2. How We Use Your Data</h2>
            <p className="mt-2">
              We use your data to provide matching services, improve the platform, communicate with you,
              and ensure security. We do not sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">3. Data Sharing</h2>
            <p className="mt-2">
              Profile information you choose to make public is visible to other users. We may share
              data with service providers under strict confidentiality agreements.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">4. Your Rights</h2>
            <p className="mt-2">
              You have the right to access, correct, or delete your data. You can manage your
              privacy settings in your account.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">5. Contact</h2>
            <p className="mt-2">
              For privacy-related inquiries, contact us at privacy@cofounderbay.com.
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
