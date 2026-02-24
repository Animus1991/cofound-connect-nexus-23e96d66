import { motion, type Easing } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  MessageSquare,
  Rocket,
  TrendingUp,
  Shield,
  ArrowRight,
  Zap,
  Target,
  Lightbulb,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as Easing },
  }),
};

const features = [
  {
    icon: Users,
    title: "Smart Co-founder Matching",
    description:
      "AI-powered compatibility scoring based on skills, stage, location, and commitment preferences.",
  },
  {
    icon: Search,
    title: "Startup Discovery",
    description:
      "Advanced filters by sector, traction, funding stage, and team composition.",
  },
  {
    icon: MessageSquare,
    title: "Structured Collaboration",
    description:
      "Intro requests, structured proposals, shared workspaces — not just chat.",
  },
  {
    icon: TrendingUp,
    title: "Investor Pipeline",
    description:
      "Deal flow management, watchlists, and pipeline tracking for angels and VCs.",
  },
  {
    icon: Lightbulb,
    title: "Mentoring & Learning",
    description:
      "Connect with mentors, book sessions, and access curated startup courses.",
  },
  {
    icon: Shield,
    title: "Verified Profiles",
    description:
      "Trust tiers, verification badges, and anti-spam protections built in.",
  },
];

const roles = [
  { label: "Founders", count: "12K+", icon: Rocket },
  { label: "Investors", count: "3.2K+", icon: Target },
  { label: "Mentors", count: "1.8K+", icon: Lightbulb },
  { label: "Professionals", count: "8.5K+", icon: Zap },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Rocket className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              CoFounderBay
            </span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#roles" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Who it's for
            </a>
            <a href="#cta" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Get Started
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="hero" size="sm">
                Join Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-hero-gradient opacity-80" />
        <div className="container relative z-10 mx-auto px-4 py-24">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
                <Zap className="h-3.5 w-3.5" />
                The startup social network
              </span>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
              className="font-display text-5xl font-bold leading-tight tracking-tight text-foreground md:text-7xl"
            >
              Find your perfect{" "}
              <span className="text-gradient-primary">co-founder</span>
              <br />
              Build something{" "}
              <span className="text-gradient-accent">extraordinary</span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
              className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
            >
              CoFounderBay connects founders, investors, mentors, and
              professionals through smart matching, structured collaboration,
              and a thriving startup community.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link to="/signup">
                <Button variant="hero" size="lg" className="gap-2 text-base px-8 py-6">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/discover">
                <Button variant="hero-outline" size="lg" className="text-base px-8 py-6">
                  Explore Startups
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={4}
              className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4"
            >
              {roles.map((role) => (
                <div
                  key={role.label}
                  className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm"
                >
                  <role.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                  <p className="font-display text-2xl font-bold text-foreground">
                    {role.count}
                  </p>
                  <p className="text-sm text-muted-foreground">{role.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              Everything you need to{" "}
              <span className="text-gradient-primary">launch & grow</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              From finding your co-founder to closing your first round —
              CoFounderBay is your startup command center.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group rounded-2xl border border-border/50 bg-card-gradient p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-glow"
              >
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="border-t border-border/50 py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              Built for the{" "}
              <span className="text-gradient-accent">entire ecosystem</span>
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                role: "Founders",
                desc: "Find co-founders with the exact skills, commitment, and vision you need. Create intent cards, get matched, and start building together.",
                icon: Rocket,
              },
              {
                role: "Investors",
                desc: "Discover startups with advanced filters. Manage your deal flow pipeline, watchlists, and intro requests — all in one place.",
                icon: Target,
              },
              {
                role: "Mentors & Advisors",
                desc: "Share your expertise, manage bookings, and build your reputation in the startup community.",
                icon: Lightbulb,
              },
              {
                role: "Professionals",
                desc: "Find startup opportunities — full-time, freelance, or equity-based. Showcase your portfolio and get discovered.",
                icon: Zap,
              },
            ].map((item, i) => (
              <motion.div
                key={item.role}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-5 rounded-2xl border border-border/50 bg-card-gradient p-8"
              >
                <div className="shrink-0">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 font-display text-2xl font-semibold text-foreground">
                    {item.role}
                  </h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="border-t border-border/50 py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card-gradient p-12 text-center md:p-20"
          >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
            <div className="relative z-10">
              <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">
                Ready to find your{" "}
                <span className="text-gradient-primary">co-founder</span>?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Join thousands of founders, investors, and professionals already
                building the future on CoFounderBay.
              </p>
              <div className="mt-8">
                <Link to="/signup">
                  <Button variant="hero" size="lg" className="gap-2 text-base px-10 py-6">
                    Create Your Profile
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Rocket className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">
                CoFounderBay
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 CoFounderBay. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
