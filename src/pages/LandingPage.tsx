import { motion, type Easing, AnimatePresence } from "framer-motion";
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
  Moon,
  Sun,
  Sparkles,
  CheckCircle2,
  Globe,
  Star,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import heroBg from "@/assets/hero-bg.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: "easeOut" as Easing },
  }),
};

const inView = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as Easing } },
};

const STATS = [
  { label: "Founders", value: "12K+", icon: Rocket },
  { label: "Investors", value: "3.2K+", icon: Target },
  { label: "Mentors", value: "1.8K+", icon: Lightbulb },
  { label: "Matches made", value: "47K+", icon: Sparkles },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-Powered Matching",
    description: "7-dimension compatibility engine scores every profile on skills, stage, commitment, location, and work style.",
    badge: "Core",
  },
  {
    icon: Search,
    title: "Startup Discovery",
    description: "Advanced filters by sector, traction, funding stage, team size, and equity structure.",
    badge: "Explore",
  },
  {
    icon: MessageSquare,
    title: "Structured Intros",
    description: "Intent-based intro requests, proposal templates, and collaborative workspaces — not just DMs.",
    badge: "Collaborate",
  },
  {
    icon: TrendingUp,
    title: "Milestones Tracker",
    description: "Set, track, and celebrate venture milestones. Keep your team aligned and momentum visible.",
    badge: "Track",
  },
  {
    icon: Lightbulb,
    title: "Mentor Network",
    description: "Book sessions with vetted mentors. Get feedback, navigate fundraising, and grow faster.",
    badge: "Learn",
  },
  {
    icon: Globe,
    title: "Communities",
    description: "Join topic communities, ask questions, share updates, and build authentic relationships.",
    badge: "Connect",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create your profile",
    desc: "Tell us your role, skills, stage, and what you're building. Takes under 3 minutes.",
  },
  {
    num: "02",
    title: "Get matched instantly",
    desc: "Our engine runs across 7 dimensions and surfaces your top 10 compatibility matches daily.",
  },
  {
    num: "03",
    title: "Connect & build",
    desc: "Send structured intro requests, join communities, find mentors, and start building together.",
  },
];

const TESTIMONIALS = [
  {
    quote: "Found my technical co-founder in under 2 weeks. The compatibility score nailed it — we've been building for 8 months now.",
    name: "Alex C.",
    role: "Founder · SaaS",
    initials: "AC",
  },
  {
    quote: "As an angel investor I finally have a place to discover early-stage founders before they're on everyone's radar.",
    name: "Maria S.",
    role: "Angel Investor",
    initials: "MS",
  },
  {
    quote: "The mentor booking feature is seamless. I've done 40+ sessions and the quality of founders here is exceptional.",
    name: "Dr. James O.",
    role: "Mentor · Growth & GTM",
    initials: "JO",
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Rocket className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">CoFound</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {[["#features","Features"],["#how","How it works"],["#roles","For who"],["#testimonials","Stories"]].map(([href, label]) => (
              <a key={href} href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="relative h-9 w-9 overflow-hidden" aria-label="Toggle theme">
              <AnimatePresence mode="wait" initial={false}>
                {theme === "dark" ? (
                  <motion.div key="sun" initial={{ rotate: -90, scale: 0, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} exit={{ rotate: 90, scale: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="absolute inset-0 flex items-center justify-center">
                    <Sun className="h-4 w-4 text-accent" />
                  </motion.div>
                ) : (
                  <motion.div key="moon" initial={{ rotate: 90, scale: 0, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} exit={{ rotate: -90, scale: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="absolute inset-0 flex items-center justify-center">
                    <Moon className="h-4 w-4 text-primary" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/demo">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-1.5 border-primary/40 text-primary hover:bg-primary/10">
                <Zap className="h-3.5 w-3.5" /> Demo
              </Button>
            </Link>
            <Link to="/signup"><Button variant="hero" size="sm">Join Free</Button></Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="absolute inset-0 bg-hero-gradient opacity-90" />

        {/* ambient blobs */}
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-accent/8 blur-3xl pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 py-24">
          <div className="mx-auto max-w-4xl text-center">

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                The startup social network — free to join
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              </span>
            </motion.div>

            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="font-display text-5xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl md:text-7xl"
            >
              Find your perfect{" "}
              <span className="text-gradient-primary">co-founder</span>
              <br />
              <span className="text-gradient-accent">build something great</span>
            </motion.h1>

            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
            >
              AI-powered matching connects founders, investors, mentors, and developers
              through compatibility scoring, structured intros, and a thriving community.
            </motion.p>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
              className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link to="/signup">
                <Button variant="hero" size="lg" className="gap-2 px-8 py-6 text-base font-semibold">
                  Start for free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="hero-outline" size="lg" className="gap-2 px-8 py-6 text-base">
                  <Zap className="h-4 w-4" /> Live demo
                </Button>
              </Link>
            </motion.div>

            {/* Social proof avatars */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
              className="mt-8 flex items-center justify-center gap-3"
            >
              <div className="flex -space-x-2">
                {["AC","MS","JO","LP","RK"].map((init) => (
                  <div key={init} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary/20 text-[10px] font-semibold text-primary">
                    {init}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Join <span className="font-semibold text-foreground">25,000+</span> founders already building
              </p>
            </motion.div>

            {/* Stats grid */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}
              className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {STATS.map((s) => (
                <div key={s.label} className="rounded-2xl border border-border/50 bg-card/60 px-4 py-5 backdrop-blur-sm text-center">
                  <s.icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                  <p className="font-display text-2xl font-bold text-foreground tabular-nums">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trusted by strip ───────────────────────────────────────── */}
      <div className="border-y border-border/40 bg-secondary/20 py-5">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs font-medium text-muted-foreground">
            <span className="text-[11px] uppercase tracking-widest opacity-60">Backed by ecosystems from</span>
            {["Y Combinator alumni","Techstars","500 Startups","EU Horizon","Google for Startups"].map((name) => (
              <span key={name} className="font-semibold text-foreground/70">{name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section id="how" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={inView} className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">How it works</p>
            <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              From profile to{" "}
              <span className="text-gradient-primary">co-founder</span>{" "}
              in days
            </h2>
          </motion.div>

          <div className="relative grid gap-6 md:grid-cols-3">
            <div className="absolute left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] top-8 hidden h-px bg-border/60 md:block" />
            {STEPS.map((step, i) => (
              <motion.div key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative z-10 rounded-2xl border border-border/50 bg-card p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-lg font-display font-bold text-primary">
                  {step.num}
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" className="border-t border-border/50 py-24">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={inView} className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Features</p>
            <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              Everything to{" "}
              <span className="text-gradient-primary">launch & scale</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              From your first match to your Series A — CoFounderBay is your startup command center.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group relative rounded-2xl border border-border/50 bg-card-gradient p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-glow overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/3 group-hover:to-transparent transition-all duration-500" />
                <div className="relative">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="inline-flex rounded-xl bg-primary/10 p-3 group-hover:bg-primary/15 transition-colors">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{f.badge}</span>
                  </div>
                  <h3 className="mb-2 font-display text-base font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For who ────────────────────────────────────────────────── */}
      <section id="roles" className="border-t border-border/50 py-24">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={inView} className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">Built for everyone</p>
            <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              The entire startup{" "}
              <span className="text-gradient-accent">ecosystem</span>
            </h2>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              { role: "Founders", color: "border-primary/30 hover:border-primary/60", iconBg: "bg-primary/10", textColor: "text-primary",
                desc: "Find co-founders with the exact skills, commitment, and vision you need. Get compatibility-scored matches daily.", icon: Rocket,
                perks: ["AI compatibility scoring","Intent-based intros","Co-founder equity templates"] },
              { role: "Investors", color: "border-accent/30 hover:border-accent/60", iconBg: "bg-accent/10", textColor: "text-accent",
                desc: "Discover pre-seed and seed deals before they hit your inbox. Filter by traction, sector, team composition.", icon: Target,
                perks: ["Advanced deal filters","Pipeline management","Warm intro requests"] },
              { role: "Mentors & Advisors", color: "border-blue-500/30 hover:border-blue-500/60", iconBg: "bg-blue-500/10", textColor: "text-blue-500",
                desc: "Share expertise, book paid sessions, and build reputation across the global founder community.", icon: Lightbulb,
                perks: ["Calendar booking","Session notes","Badge & reputation system"] },
              { role: "Developers & Pros", color: "border-green-500/30 hover:border-green-500/60", iconBg: "bg-green-500/10", textColor: "text-green-600",
                desc: "Find equity-based or paid startup roles. Showcase your portfolio and get discovered by the right teams.", icon: Zap,
                perks: ["Equity opportunity board","Portfolio showcase","Skill-matched discovery"] },
            ].map((item, i) => (
              <motion.div key={item.role}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-2xl border-2 ${item.color} bg-card-gradient p-7 transition-all duration-300`}
              >
                <div className={`mb-4 inline-flex rounded-xl ${item.iconBg} p-3`}>
                  <item.icon className={`h-6 w-6 ${item.textColor}`} />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">{item.role}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{item.desc}</p>
                <ul className="space-y-1.5">
                  {item.perks.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${item.textColor}`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────── */}
      <section id="testimonials" className="border-t border-border/50 py-24 bg-secondary/10">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={inView} className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Social proof</p>
            <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              Loved by <span className="text-gradient-primary">builders</span>
            </h2>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border/50 bg-card p-6"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-accent text-accent" />)}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section id="cta" className="border-t border-border/50 py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card-gradient p-12 text-center md:p-20"
          >
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/8 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary mb-6">
                <Sparkles className="h-3 w-3" /> Free forever, no credit card needed
              </span>
              <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">
                Ready to find your{" "}
                <span className="text-gradient-primary">co-founder</span>?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Join thousands of builders already on CoFounderBay. Your next co-founder, investor, or mentor is one match away.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/signup">
                  <Button variant="hero" size="lg" className="gap-2 px-10 py-6 text-base font-semibold">
                    Create free profile <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/discover">
                  <Button variant="hero-outline" size="lg" className="px-8 py-6 text-base">
                    Browse founders
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-14">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                  <Rocket className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="font-display text-lg font-bold text-foreground">CoFound</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The global platform for founders, investors, mentors, and builders.
              </p>
            </div>
            {[
              { heading: "Product", links: [["Features","#features"],["How it works","#how"],["Communities","/communities"],["Milestones","/milestones"]] },
              { heading: "Company", links: [["About","#"],["Blog","#"],["Careers","#"],["Contact","#"]] },
              { heading: "Legal", links: [["Privacy Policy","/privacy"],["Terms of Service","/terms"],["Cookie Policy","#"]] },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">{col.heading}</h4>
                <ul className="space-y-2">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      {href.startsWith("/") ? (
                        <Link to={href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{label}</Link>
                      ) : (
                        <a href={href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 sm:flex-row">
            <p className="text-xs text-muted-foreground">© 2026 CoFounderBay. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">Made with ❤️ for the global startup community</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
