import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Heart,
  Zap,
  MessageSquare,
  Brain,
  Gauge,
  Users,
  Target,
  Shield,
} from "lucide-react";

interface WorkStyleData {
  missionOrientation: string;
  riskTolerance: string;
  communicationStyle: string;
  decisionMakingStyle: string;
  speedVsStability: string;
  soloVsCollaborative: string;
}

interface ValuesData {
  primaryGoal: string;
  secondaryGoals: string[];
  dealBreakers: string;
}

const MISSION_OPTIONS = [
  { value: "impact", label: "Impact-Driven", description: "Solving meaningful problems matters most" },
  { value: "growth", label: "Growth-Focused", description: "Building something big and scalable" },
  { value: "profit", label: "Profit-Oriented", description: "Financial success is the primary goal" },
  { value: "balanced", label: "Balanced", description: "Mix of impact, growth, and sustainability" },
];

const RISK_OPTIONS = [
  { value: "high", label: "High Risk Tolerance", description: "Comfortable with uncertainty and big bets" },
  { value: "moderate", label: "Moderate Risk", description: "Calculated risks with backup plans" },
  { value: "low", label: "Low Risk", description: "Prefer stability and proven approaches" },
];

const COMMUNICATION_OPTIONS = [
  { value: "async", label: "Async-First", description: "Prefer written communication, flexible timing" },
  { value: "sync", label: "Sync-Heavy", description: "Regular meetings and real-time discussions" },
  { value: "hybrid", label: "Hybrid", description: "Mix of async and sync based on needs" },
];

const DECISION_OPTIONS = [
  { value: "data", label: "Data-Driven", description: "Decisions backed by metrics and research" },
  { value: "intuition", label: "Intuition-Led", description: "Trust gut feelings and experience" },
  { value: "consensus", label: "Consensus-Based", description: "Collaborative decision-making" },
  { value: "mixed", label: "Context-Dependent", description: "Adapt approach based on situation" },
];

const SPEED_OPTIONS = [
  { value: "speed", label: "Move Fast", description: "Ship quickly, iterate later" },
  { value: "stability", label: "Build Solid", description: "Take time to get it right" },
  { value: "balanced", label: "Balanced", description: "Fast where possible, careful where needed" },
];

const COLLABORATION_OPTIONS = [
  { value: "solo", label: "Independent", description: "Work best with autonomy" },
  { value: "collaborative", label: "Collaborative", description: "Thrive in team environments" },
  { value: "flexible", label: "Flexible", description: "Adapt to what the task requires" },
];

const GOAL_OPTIONS = [
  { value: "build_product", label: "Build a Product", icon: Target },
  { value: "find_cofounder", label: "Find a Co-Founder", icon: Users },
  { value: "learn_grow", label: "Learn & Grow", icon: Brain },
  { value: "network", label: "Expand Network", icon: MessageSquare },
  { value: "get_funded", label: "Get Funded", icon: Zap },
  { value: "find_mentor", label: "Find a Mentor", icon: Heart },
];

export default function WorkStylePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [workStyle, setWorkStyle] = useState<WorkStyleData>({
    missionOrientation: "balanced",
    riskTolerance: "moderate",
    communicationStyle: "hybrid",
    decisionMakingStyle: "mixed",
    speedVsStability: "balanced",
    soloVsCollaborative: "flexible",
  });

  const [values, setValues] = useState<ValuesData>({
    primaryGoal: "build_product",
    secondaryGoals: [],
    dealBreakers: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profile = await api.getProfile();
        // Parse workStyle and valuesAndGoals from profile if they exist
        // These are stored as JSON strings in the profile
        if (profile.workStyle) {
          try {
            const parsed = typeof profile.workStyle === "string" 
              ? JSON.parse(profile.workStyle) 
              : profile.workStyle;
            setWorkStyle((prev) => ({ ...prev, ...parsed }));
          } catch { /* use defaults */ }
        }
        if (profile.valuesAndGoals) {
          try {
            const parsed = typeof profile.valuesAndGoals === "string"
              ? JSON.parse(profile.valuesAndGoals)
              : profile.valuesAndGoals;
            setValues((prev) => ({ ...prev, ...parsed }));
          } catch { /* use defaults */ }
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({
        workStyle: JSON.stringify(workStyle),
        valuesAndGoals: JSON.stringify(values),
      } as any);
      toast({ title: "Work style saved successfully" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateWorkStyle = (key: keyof WorkStyleData, value: string) => {
    setWorkStyle((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSecondaryGoal = (goal: string) => {
    setValues((prev) => ({
      ...prev,
      secondaryGoals: prev.secondaryGoals.includes(goal)
        ? prev.secondaryGoals.filter((g) => g !== goal)
        : [...prev.secondaryGoals, goal],
    }));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Work Style & Values</h1>
              <p className="text-muted-foreground">Help us find compatible co-founders and mentors</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Work Style */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" />
                  Work Style Preferences
                </CardTitle>
                <CardDescription>
                  How you prefer to work. This helps match you with compatible collaborators.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mission Orientation */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Mission Orientation</Label>
                  <RadioGroup
                    value={workStyle.missionOrientation}
                    onValueChange={(v) => updateWorkStyle("missionOrientation", v)}
                    className="grid gap-2"
                  >
                    {MISSION_OPTIONS.map((opt) => (
                      <Label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          workStyle.missionOrientation === opt.value
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value={opt.value} className="mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.description}</div>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                {/* Risk Tolerance */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Risk Tolerance</Label>
                  <RadioGroup
                    value={workStyle.riskTolerance}
                    onValueChange={(v) => updateWorkStyle("riskTolerance", v)}
                    className="grid gap-2"
                  >
                    {RISK_OPTIONS.map((opt) => (
                      <Label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          workStyle.riskTolerance === opt.value
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value={opt.value} className="mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.description}</div>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                {/* Communication Style */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Communication Style</Label>
                  <RadioGroup
                    value={workStyle.communicationStyle}
                    onValueChange={(v) => updateWorkStyle("communicationStyle", v)}
                    className="grid gap-2"
                  >
                    {COMMUNICATION_OPTIONS.map((opt) => (
                      <Label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          workStyle.communicationStyle === opt.value
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value={opt.value} className="mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.description}</div>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: More Preferences + Values */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Decision Making & Pace
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Decision Making */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Decision Making Style</Label>
                  <RadioGroup
                    value={workStyle.decisionMakingStyle}
                    onValueChange={(v) => updateWorkStyle("decisionMakingStyle", v)}
                    className="grid gap-2"
                  >
                    {DECISION_OPTIONS.map((opt) => (
                      <Label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          workStyle.decisionMakingStyle === opt.value
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value={opt.value} className="mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.description}</div>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                {/* Speed vs Stability */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Speed vs Stability</Label>
                  <RadioGroup
                    value={workStyle.speedVsStability}
                    onValueChange={(v) => updateWorkStyle("speedVsStability", v)}
                    className="grid gap-2"
                  >
                    {SPEED_OPTIONS.map((opt) => (
                      <Label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          workStyle.speedVsStability === opt.value
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value={opt.value} className="mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.description}</div>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                {/* Solo vs Collaborative */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Work Environment</Label>
                  <RadioGroup
                    value={workStyle.soloVsCollaborative}
                    onValueChange={(v) => updateWorkStyle("soloVsCollaborative", v)}
                    className="grid gap-2"
                  >
                    {COLLABORATION_OPTIONS.map((opt) => (
                      <Label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          workStyle.soloVsCollaborative === opt.value
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value={opt.value} className="mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.description}</div>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Goals & Priorities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Primary Goal</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {GOAL_OPTIONS.map((goal) => {
                      const Icon = goal.icon;
                      const isSelected = values.primaryGoal === goal.value;
                      return (
                        <button
                          key={goal.value}
                          onClick={() => setValues((prev) => ({ ...prev, primaryGoal: goal.value }))}
                          className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                            isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="text-sm">{goal.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Deal Breakers (Optional)</Label>
                  <Textarea
                    placeholder="What would make a collaboration not work for you? E.g., 'No remote work', 'Must have technical co-founder'..."
                    value={values.dealBreakers}
                    onChange={(e) => setValues((prev) => ({ ...prev, dealBreakers: e.target.value }))}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
