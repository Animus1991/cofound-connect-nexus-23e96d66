import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Briefcase,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Check,
  Rocket,
  Target,
  Users,
  Sparkles,
  Heart,
  Zap,
  Globe,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { label: "Profile", icon: User },
  { label: "Preferences", icon: Target },
  { label: "Connections", icon: Users },
];

const skillOptions = [
  "React", "Node.js", "Python", "AI/ML", "UI/UX", "Product Management",
  "Marketing", "Sales", "Finance", "Data Science", "DevOps", "Mobile Dev",
  "Blockchain", "Cloud", "Cybersecurity", "Growth Hacking",
];

const interestOptions = [
  "SaaS", "Fintech", "HealthTech", "EdTech", "E-commerce", "AI",
  "CleanTech", "Social Impact", "Gaming", "IoT", "Marketplace", "B2B",
];

const stageOptions = [
  { value: "idea", label: "Idea Stage", desc: "I have an idea but haven't started building" },
  { value: "mvp", label: "Building MVP", desc: "Working on the first version of my product" },
  { value: "traction", label: "Early Traction", desc: "Have users/customers and growing" },
  { value: "seed", label: "Seed / Funded", desc: "Raised funding and scaling the team" },
];

const commitmentOptions = [
  { value: "full-time", label: "Full-time", icon: Rocket },
  { value: "part-time", label: "Part-time", icon: Clock },
  { value: "weekends", label: "Weekends only", icon: Heart },
  { value: "flexible", label: "Flexible", icon: Sparkles },
];

const suggestedPeople = [
  { id: "1", name: "Alex Chen", initials: "AC", role: "AI Engineer", match: 94, skills: ["AI/ML", "Python"] },
  { id: "2", name: "Maria Santos", initials: "MS", role: "Product Designer", match: 89, skills: ["UI/UX", "Figma"] },
  { id: "3", name: "James Okafor", initials: "JO", role: "Growth Lead", match: 86, skills: ["Marketing", "SaaS"] },
  { id: "4", name: "Lena Müller", initials: "LM", role: "Full-Stack Dev", match: 82, skills: ["React", "Node.js"] },
  { id: "5", name: "Ravi Patel", initials: "RP", role: "Finance & Ops", match: 78, skills: ["Finance", "B2B"] },
  { id: "6", name: "Sophie Kim", initials: "SK", role: "Data Scientist", match: 75, skills: ["Data Science", "AI"] },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1: Profile
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Step 2: Preferences
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [stage, setStage] = useState("");
  const [commitment, setCommitment] = useState("");

  // Step 3: Connections
  const [connectedIds, setConnectedIds] = useState<string[]>([]);

  const progress = ((step + 1) / STEPS.length) * 100;

  const toggleSkill = (s: string) =>
    setSelectedSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const toggleInterest = (s: string) =>
    setSelectedInterests((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const toggleConnect = (id: string) =>
    setConnectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const canNext =
    step === 0 ? name.trim().length > 0 :
    step === 1 ? selectedInterests.length > 0 :
    true;

  const handleFinish = () => navigate("/dashboard");

  return (
    <div className="min-h-screen bg-hero-gradient flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <Rocket className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">CoFound</span>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </header>

      {/* Progress */}
      <div className="px-4 sm:px-8 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-2">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2 flex-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i < step ? "bg-primary text-primary-foreground" :
                  i === step ? "bg-primary/20 text-primary border border-primary/50" :
                  "bg-secondary text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${i < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-1.5 mb-6" />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-8 pb-8 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    Let's set up your profile
                  </h1>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Tell the community who you are and what you bring to the table.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-1.5 text-xs">
                        <User className="h-3 w-3" /> Full Name *
                      </Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="flex items-center gap-1.5 text-xs">
                        <MapPin className="h-3 w-3" /> Location
                      </Label>
                      <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Athens, Greece" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="headline" className="flex items-center gap-1.5 text-xs">
                      <Briefcase className="h-3 w-3" /> Headline
                    </Label>
                    <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Full-stack developer & aspiring founder" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="flex items-center gap-1.5 text-xs">
                      <Globe className="h-3 w-3" /> Short Bio
                    </Label>
                    <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about your background, experience, and what you're passionate about..." rows={3} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs">Select your skills</Label>
                  <div className="flex flex-wrap gap-2">
                    {skillOptions.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleSkill(s)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                          selectedSkills.includes(s)
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {selectedSkills.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">{selectedSkills.length} selected</p>
                  )}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    What are you looking for?
                  </h1>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Help us match you with the right people and opportunities.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs">Industries you're interested in *</Label>
                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleInterest(s)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                          selectedInterests.includes(s)
                            ? "bg-accent text-accent-foreground shadow-sm"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs">Startup stage</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {stageOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setStage(opt.value)}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          stage === opt.value
                            ? "border-primary bg-primary/10"
                            : "border-border/50 bg-card-gradient hover:border-border"
                        }`}
                      >
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs">Your availability</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {commitmentOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setCommitment(opt.value)}
                        className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                          commitment === opt.value
                            ? "border-primary bg-primary/10"
                            : "border-border/50 bg-card-gradient hover:border-border"
                        }`}
                      >
                        <opt.icon className={`h-4 w-4 ${commitment === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-sm font-medium text-foreground">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    Make your first connections
                  </h1>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Based on your profile, here are people you might want to connect with.
                  </p>
                </div>

                <div className="space-y-3">
                  {suggestedPeople.map((person) => {
                    const isConnected = connectedIds.includes(person.id);
                    return (
                      <motion.div
                        key={person.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between rounded-xl border border-border/50 bg-card-gradient p-3 sm:p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                            <span className="text-xs font-semibold text-primary">{person.initials}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{person.name}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">{person.role}</span>
                              <div className="flex gap-1">
                                {person.skills.map((s) => (
                                  <span key={s} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">{s}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary hidden sm:inline-flex">
                            {person.match}% match
                          </Badge>
                          <Button
                            size="sm"
                            variant={isConnected ? "secondary" : "default"}
                            onClick={() => toggleConnect(person.id)}
                            className="text-xs h-8"
                          >
                            {isConnected ? (
                              <><Check className="h-3 w-3 mr-1" /> Connected</>
                            ) : (
                              <><Zap className="h-3 w-3 mr-1" /> Connect</>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {connectedIds.length > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    🎉 You've connected with {connectedIds.length} {connectedIds.length === 1 ? "person" : "people"}!
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="sticky bottom-0 border-t border-border/50 bg-background/80 backdrop-blur-md px-4 sm:px-8 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              variant="hero"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="gap-1.5"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="hero" onClick={handleFinish} className="gap-1.5">
              <Sparkles className="h-4 w-4" /> Get Started
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
