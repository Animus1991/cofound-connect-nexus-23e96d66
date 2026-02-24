import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, Mail, Lock, User, ArrowRight } from "lucide-react";

const roleOptions = [
  { value: "founder", label: "Founder / Co-founder" },
  { value: "investor", label: "Investor" },
  { value: "professional", label: "Professional / Freelancer" },
  { value: "mentor", label: "Mentor / Advisor" },
];

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const toggleRole = (value: string) => {
    setSelectedRoles((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Visual */}
      <div className="hidden bg-hero-gradient lg:flex lg:w-1/2 lg:items-center lg:justify-center">
        <div className="max-w-md px-8 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 animate-pulse-glow">
            <Rocket className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground">
            Start your journey
          </h2>
          <p className="mt-4 text-muted-foreground">
            Create your signal-rich profile and get matched with the right
            people for your startup journey.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-10 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Rocket className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              CoFounderBay
            </span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-foreground">
            Create your account
          </h1>
          <p className="mt-2 text-muted-foreground">
            Join the startup ecosystem in under 2 minutes.
          </p>

          <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Jane Doe"
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@startup.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <Label>I am a... (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2">
                {roleOptions.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => toggleRole(role.value)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                      selectedRoles.includes(role.value)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="hero" className="w-full gap-2" size="lg">
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
