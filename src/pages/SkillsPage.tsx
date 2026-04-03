import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { api, Skill, UserSkill, SkillCategory } from "@/lib/api";
import {
  ArrowLeft,
  Plus,
  X,
  Search,
  Code,
  Briefcase,
  Palette,
  Megaphone,
  Settings,
  Users,
  Globe,
  Star,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const PROFICIENCY_LEVELS = [
  { value: "beginner", label: "Beginner", color: "bg-slate-100 text-slate-700" },
  { value: "intermediate", label: "Intermediate", color: "bg-blue-100 text-blue-700" },
  { value: "advanced", label: "Advanced", color: "bg-purple-100 text-purple-700" },
  { value: "expert", label: "Expert", color: "bg-amber-100 text-amber-700" },
];

const PRIORITY_LEVELS = [
  { value: "primary", label: "Primary", description: "Core skill you want to highlight" },
  { value: "secondary", label: "Secondary", description: "Supporting skill" },
  { value: "tertiary", label: "Tertiary", description: "Additional skill" },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  technical: Code,
  business: Briefcase,
  design: Palette,
  marketing: Megaphone,
  operations: Settings,
  leadership: Users,
  domain: Globe,
};

export default function SkillsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [skillsByCategory, setSkillsByCategory] = useState<Record<string, Skill[]>>({});
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [mySkills, setMySkills] = useState<UserSkill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [skillsRes, categoriesRes, mySkillsRes] = await Promise.all([
        api.taxonomy.getSkills(),
        api.taxonomy.getSkillCategories(),
        api.taxonomy.getMySkills(),
      ]);
      setAllSkills(skillsRes.skills);
      setSkillsByCategory(skillsRes.byCategory);
      setCategories(categoriesRes.categories);
      setMySkills(mySkillsRes.skills);
    } catch (err) {
      toast({ title: "Error loading skills", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSkill = async (skill: Skill) => {
    if (mySkills.some((s) => s.skillId === skill.id)) {
      toast({ title: "Skill already added", variant: "destructive" });
      return;
    }

    const newSkill: UserSkill = {
      id: crypto.randomUUID(),
      skillId: skill.id,
      proficiency: "intermediate",
      yearsExperience: null,
      priority: "secondary",
      isActive: true,
      skillName: skill.name,
      skillCategory: skill.category,
    };

    setMySkills((prev) => [...prev, newSkill]);

    try {
      await api.taxonomy.addMySkill({
        skillId: skill.id,
        proficiency: "intermediate",
        priority: "secondary",
      });
      toast({ title: `Added ${skill.name}` });
    } catch {
      setMySkills((prev) => prev.filter((s) => s.skillId !== skill.id));
      toast({ title: "Failed to add skill", variant: "destructive" });
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    const removed = mySkills.find((s) => s.skillId === skillId);
    setMySkills((prev) => prev.filter((s) => s.skillId !== skillId));

    try {
      await api.taxonomy.removeMySkill(skillId);
      toast({ title: `Removed ${removed?.skillName}` });
    } catch {
      if (removed) setMySkills((prev) => [...prev, removed]);
      toast({ title: "Failed to remove skill", variant: "destructive" });
    }
  };

  const handleUpdateSkill = (skillId: string, field: "proficiency" | "priority", value: string) => {
    setMySkills((prev) =>
      prev.map((s) => (s.skillId === skillId ? { ...s, [field]: value } : s))
    );
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await api.taxonomy.updateMySkills(
        mySkills.map((s) => ({
          skillId: s.skillId,
          proficiency: s.proficiency,
          priority: s.priority,
          yearsExperience: s.yearsExperience ?? undefined,
        }))
      );
      toast({ title: "Skills saved successfully" });
    } catch {
      toast({ title: "Failed to save skills", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filteredSkills = allSkills.filter((skill) => {
    const matchesSearch = !searchQuery || skill.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || skill.category === activeCategory;
    const notAlreadyAdded = !mySkills.some((s) => s.skillId === skill.id);
    return matchesSearch && matchesCategory && notAlreadyAdded;
  });

  const primarySkills = mySkills.filter((s) => s.priority === "primary");
  const secondarySkills = mySkills.filter((s) => s.priority === "secondary");
  const tertiarySkills = mySkills.filter((s) => s.priority === "tertiary");

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
              <h1 className="text-2xl font-bold">Manage Skills</h1>
              <p className="text-muted-foreground">Add and organize your professional skills</p>
            </div>
          </div>
          <Button onClick={handleSaveAll} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Left: My Skills */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  My Skills ({mySkills.length})
                </CardTitle>
                <CardDescription>
                  Organize your skills by priority. Primary skills appear first on your profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Skills */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Primary Skills</h3>
                  {primarySkills.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No primary skills yet</p>
                  ) : (
                    <div className="space-y-2">
                      {primarySkills.map((skill) => (
                        <SkillRow
                          key={skill.skillId}
                          skill={skill}
                          onRemove={() => handleRemoveSkill(skill.skillId)}
                          onUpdate={(field, value) => handleUpdateSkill(skill.skillId, field, value)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Secondary Skills */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Secondary Skills</h3>
                  {secondarySkills.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No secondary skills yet</p>
                  ) : (
                    <div className="space-y-2">
                      {secondarySkills.map((skill) => (
                        <SkillRow
                          key={skill.skillId}
                          skill={skill}
                          onRemove={() => handleRemoveSkill(skill.skillId)}
                          onUpdate={(field, value) => handleUpdateSkill(skill.skillId, field, value)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Tertiary Skills */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Additional Skills</h3>
                  {tertiarySkills.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No additional skills yet</p>
                  ) : (
                    <div className="space-y-2">
                      {tertiarySkills.map((skill) => (
                        <SkillRow
                          key={skill.skillId}
                          skill={skill}
                          onRemove={() => handleRemoveSkill(skill.skillId)}
                          onUpdate={(field, value) => handleUpdateSkill(skill.skillId, field, value)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Add Skills */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Add Skills</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                  <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    {categories.map((cat) => {
                      const Icon = CATEGORY_ICONS[cat.id] || Globe;
                      return (
                        <TabsTrigger key={cat.id} value={cat.id} className="text-xs gap-1">
                          <Icon className="h-3 w-3" />
                          {cat.name}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  <div className="max-h-[400px] overflow-y-auto space-y-1">
                    {filteredSkills.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {searchQuery ? "No matching skills found" : "All skills in this category have been added"}
                      </p>
                    ) : (
                      filteredSkills.map((skill) => {
                        const Icon = CATEGORY_ICONS[skill.category] || Globe;
                        return (
                          <button
                            key={skill.id}
                            onClick={() => handleAddSkill(skill)}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{skill.name}</span>
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        );
                      })
                    )}
                  </div>
                </Tabs>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">Tips for your skills</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Add 3-5 primary skills that define your expertise</li>
                  <li>• Be honest about proficiency levels</li>
                  <li>• Include both technical and soft skills</li>
                  <li>• Update skills as you grow</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function SkillRow({
  skill,
  onRemove,
  onUpdate,
}: {
  skill: UserSkill;
  onRemove: () => void;
  onUpdate: (field: "proficiency" | "priority", value: string) => void;
}) {
  const Icon = CATEGORY_ICONS[skill.skillCategory] || Globe;
  const proficiency = PROFICIENCY_LEVELS.find((p) => p.value === skill.proficiency);

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border bg-card">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm font-medium flex-1 truncate">{skill.skillName}</span>

      <Select value={skill.proficiency} onValueChange={(v) => onUpdate("proficiency", v)}>
        <SelectTrigger className="w-[120px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PROFICIENCY_LEVELS.map((level) => (
            <SelectItem key={level.value} value={level.value}>
              {level.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={skill.priority} onValueChange={(v) => onUpdate("priority", v)}>
        <SelectTrigger className="w-[100px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRIORITY_LEVELS.map((level) => (
            <SelectItem key={level.value} value={level.value}>
              {level.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
