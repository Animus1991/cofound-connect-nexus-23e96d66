import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Users,
  MapPin,
  Clock,
  Briefcase,
  Target,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

interface MatchPreferences {
  lookingForRoles: string[];
  preferredSkills: string[];
  preferredIndustries: string[];
  preferredStage: string;
  preferredCommitment: string;
  preferredLocation: string;
  remoteOk: boolean;
  matchingEnabled: boolean;
}

const ROLES = [
  { id: "founder", label: "Founder", description: "Someone building a startup" },
  { id: "cofounder", label: "Co-Founder", description: "Looking to join a founding team" },
  { id: "mentor", label: "Mentor", description: "Experienced guide" },
  { id: "advisor", label: "Advisor", description: "Strategic advisor" },
  { id: "investor", label: "Investor", description: "Angel or VC" },
  { id: "operator", label: "Operator", description: "Experienced startup operator" },
];

const STAGES = [
  { value: "any", label: "Any Stage" },
  { value: "idea", label: "Idea Stage" },
  { value: "mvp", label: "MVP / Prototype" },
  { value: "early_traction", label: "Early Traction" },
  { value: "growth", label: "Growth Stage" },
  { value: "scale", label: "Scale Stage" },
];

const COMMITMENTS = [
  { value: "any", label: "Any Commitment" },
  { value: "full_time", label: "Full-Time" },
  { value: "part_time", label: "Part-Time" },
  { value: "flexible", label: "Flexible" },
  { value: "weekends", label: "Weekends Only" },
];

const LOCATIONS = [
  { value: "any", label: "Anywhere" },
  { value: "local", label: "Local Only" },
  { value: "regional", label: "Same Region" },
  { value: "country", label: "Same Country" },
  { value: "remote", label: "Remote Only" },
];

export default function MatchPreferencesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [preferences, setPreferences] = useState<MatchPreferences>({
    lookingForRoles: ["cofounder"],
    preferredSkills: [],
    preferredIndustries: [],
    preferredStage: "any",
    preferredCommitment: "any",
    preferredLocation: "any",
    remoteOk: true,
    matchingEnabled: true,
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      setLoading(true);
      try {
        const res = await api.getMatchPreferences();
        if (res) {
          setPreferences({
            lookingForRoles: res.lookingForRoles || ["cofounder"],
            preferredSkills: res.preferredSkills || [],
            preferredIndustries: res.preferredIndustries || [],
            preferredStage: res.preferredStage || "any",
            preferredCommitment: res.preferredCommitment || "any",
            preferredLocation: res.preferredLocation || "any",
            remoteOk: res.remoteOk ?? true,
            matchingEnabled: true,
          });
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateMatchPreferences(preferences);
      toast({ title: "Match preferences saved" });
    } catch {
      toast({ title: "Failed to save preferences", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (roleId: string) => {
    setPreferences((prev) => ({
      ...prev,
      lookingForRoles: prev.lookingForRoles.includes(roleId)
        ? prev.lookingForRoles.filter((r) => r !== roleId)
        : [...prev.lookingForRoles, roleId],
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/matches")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Match Preferences</h1>
              <p className="text-muted-foreground">Configure who you want to be matched with</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Save Preferences
          </Button>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Left: Main Preferences */}
          <div className="space-y-6">
            {/* Matching Toggle */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {preferences.matchingEnabled ? (
                      <Eye className="h-5 w-5 text-green-600" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-medium">Matching Visibility</div>
                      <div className="text-sm text-muted-foreground">
                        {preferences.matchingEnabled
                          ? "You appear in match suggestions"
                          : "You're hidden from match suggestions"}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.matchingEnabled}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({ ...prev, matchingEnabled: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Looking For Roles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Who Are You Looking For?
                </CardTitle>
                <CardDescription>
                  Select the types of people you want to connect with
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {ROLES.map((role) => {
                    const isSelected = preferences.lookingForRoles.includes(role.id);
                    return (
                      <label
                        key={role.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRole(role.id)}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="font-medium text-sm">{role.label}</div>
                          <div className="text-xs text-muted-foreground">{role.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Stage & Commitment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Stage & Commitment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preferred Startup Stage</Label>
                    <Select
                      value={preferences.preferredStage}
                      onValueChange={(v) => setPreferences((prev) => ({ ...prev, preferredStage: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Commitment</Label>
                    <Select
                      value={preferences.preferredCommitment}
                      onValueChange={(v) => setPreferences((prev) => ({ ...prev, preferredCommitment: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMITMENTS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Location Preference</Label>
                  <Select
                    value={preferences.preferredLocation}
                    onValueChange={(v) => setPreferences((prev) => ({ ...prev, preferredLocation: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc.value} value={loc.value}>
                          {loc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium text-sm">Open to Remote</div>
                    <div className="text-xs text-muted-foreground">
                      Include people who work remotely
                    </div>
                  </div>
                  <Switch
                    checked={preferences.remoteOk}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({ ...prev, remoteOk: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Summary & Tips */}
          <div className="space-y-4">
            {/* Current Preferences Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Your Match Criteria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Looking for:</div>
                  <div className="flex flex-wrap gap-1">
                    {preferences.lookingForRoles.length === 0 ? (
                      <span className="text-sm text-muted-foreground italic">No roles selected</span>
                    ) : (
                      preferences.lookingForRoles.map((roleId) => {
                        const role = ROLES.find((r) => r.id === roleId);
                        return (
                          <Badge key={roleId} variant="secondary">
                            {role?.label || roleId}
                          </Badge>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Stage:</div>
                  <Badge variant="outline">
                    {STAGES.find((s) => s.value === preferences.preferredStage)?.label || "Any"}
                  </Badge>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Commitment:</div>
                  <Badge variant="outline">
                    {COMMITMENTS.find((c) => c.value === preferences.preferredCommitment)?.label || "Any"}
                  </Badge>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Location:</div>
                  <div className="flex gap-1">
                    <Badge variant="outline">
                      {LOCATIONS.find((l) => l.value === preferences.preferredLocation)?.label || "Anywhere"}
                    </Badge>
                    {preferences.remoteOk && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Remote OK
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">Matching Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Broader criteria = more matches</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Complete your profile to improve match quality</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Update your work style for better compatibility scores</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Check matches regularly - new users join daily</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/skills")}>
                <Briefcase className="h-4 w-4 mr-2" />
                Manage Skills
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/work-style")}>
                <Clock className="h-4 w-4 mr-2" />
                Update Work Style
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/profile")}>
                <Users className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
