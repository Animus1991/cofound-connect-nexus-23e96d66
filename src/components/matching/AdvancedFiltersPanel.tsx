import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Filter,
  Search,
  X,
  RotateCcw,
  Save,
  MapPin,
  Briefcase,
  Users,
  Star,
  Target,
  TrendingUp,
  Clock,
  DollarSign,
  Globe,
  Building,
  Heart,
  Zap,
  ChevronDown,
  ChevronUp,
  Settings,
  SlidersHorizontal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdvancedFilters {
  // Basic Filters
  searchQuery: string;
  location: string[];
  remoteOnly: boolean;
  
  // Experience & Stage
  experienceLevel: string[];
  startupStage: string[];
  industryFocus: string[];
  
  // Skills & Expertise
  requiredSkills: string[];
  preferredSkills: string[];
  skillLevel: number[];
  
  // Compatibility & Match
  minCompatibilityScore: number;
  matchType: string[];
  relationshipGoals: string[];
  
  // Commitment & Availability
  timeCommitment: string[];
  availability: string[];
  responseTime: string[];
  
  // Professional Background
  companyType: string[];
  companySize: string[];
  fundingStage: string[];
  
  // Personal Preferences
  workStyle: string[];
  communicationStyle: string[];
  timezone: string[];
  languages: string[];
  
  // Advanced
  hasPortfolio: boolean;
  isVerified: boolean;
  responseRate: number;
  lastActive: string;
}

const DEFAULT_FILTERS: AdvancedFilters = {
  searchQuery: '',
  location: [],
  remoteOnly: false,
  experienceLevel: [],
  startupStage: [],
  industryFocus: [],
  requiredSkills: [],
  preferredSkills: [],
  skillLevel: [0, 10],
  minCompatibilityScore: 70,
  matchType: [],
  relationshipGoals: [],
  timeCommitment: [],
  availability: [],
  responseTime: [],
  companyType: [],
  companySize: [],
  fundingStage: [],
  workStyle: [],
  communicationStyle: [],
  timezone: [],
  languages: [],
  hasPortfolio: false,
  isVerified: false,
  responseRate: 0,
  lastActive: ''
};

interface AdvancedFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AdvancedFilters) => void;
  initialFilters?: Partial<AdvancedFilters>;
}

const FILTER_OPTIONS = {
  experienceLevel: ['Entry Level (0-2 years)', 'Mid Level (3-5 years)', 'Senior Level (6-10 years)', 'Executive Level (10+ years)'],
  startupStage: ['Idea', 'Pre-seed', 'Seed', 'Series A', 'Series B+', 'Established'],
  industryFocus: ['SaaS', 'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'AI/ML', 'Blockchain', 'IoT', 'CleanTech', 'Social Impact'],
  matchType: ['Co-founder', 'Technical Co-founder', 'Business Co-founder', 'Mentor', 'Advisor', 'Investor', 'Collaborator'],
  relationshipGoals: ['Build MVP', 'Scale Product', 'Raise Funding', 'Enter New Market', 'Acquire Users', 'Strategic Partnership'],
  timeCommitment: ['Full-time', 'Part-time', 'Advisory', 'Project-based', 'Weekends only'],
  availability: ['Immediate', '1-2 weeks', '1 month', '2-3 months', '3+ months'],
  responseTime: ['Within hours', 'Same day', '1-2 days', '3-5 days', '1 week+'],
  companyType: ['Startup', 'Scale-up', 'Enterprise', 'Non-profit', 'Government', 'Academic'],
  companySize: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
  fundingStage: ['Bootstrapped', 'Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Profitable'],
  workStyle: ['Remote-first', 'Hybrid', 'In-office', 'Flexible', 'Structured', 'Autonomous'],
  communicationStyle: ['Formal', 'Casual', 'Direct', 'Diplomatic', 'Detailed', 'Concise'],
  timezone: ['PST', 'MST', 'CST', 'EST', 'GMT', 'CET', 'IST', 'JST', 'AEST'],
  languages: ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese', 'Russian', 'Arabic'],
  lastActive: ['Today', 'This week', 'This month', 'Last 3 months', 'Last 6 months', 'Last year']
};

const SKILL_OPTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'C#', 'Go', 'Rust',
  'Product Management', 'Marketing', 'Sales', 'Business Development', 'Finance', 'Accounting', 'Legal',
  'UI/UX Design', 'Graphic Design', 'Product Design', 'User Research', 'Data Analysis', 'Data Science',
  'Machine Learning', 'AI', 'Blockchain', 'DevOps', 'Cloud Computing', 'Cybersecurity', 'Mobile Development'
];

export default function AdvancedFiltersPanel({ isOpen, onClose, onApplyFilters, initialFilters }: AdvancedFiltersPanelProps) {
  const [filters, setFilters] = useState<AdvancedFilters>({ ...DEFAULT_FILTERS, ...initialFilters });
  const [savedFilters, setSavedFilters] = useState<Array<{ name: string; filters: AdvancedFilters }>>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    experience: false,
    skills: false,
    compatibility: false,
    commitment: false,
    professional: false,
    preferences: false,
    advanced: false
  });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (initialFilters) {
      setFilters({ ...DEFAULT_FILTERS, ...initialFilters });
    }
  }, [initialFilters]);

  const handleFilterChange = (key: keyof AdvancedFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleMultiSelectChange = (key: keyof AdvancedFilters, value: string, checked: boolean) => {
    setFilters(prev => {
      const currentArray = prev[key] as string[];
      if (checked) {
        return { ...prev, [key]: [...currentArray, value] };
      } else {
        return { ...prev, [key]: currentArray.filter(item => item !== value) };
      }
    });
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    toast({
      title: "Filters reset",
      description: "All filters have been reset to default values."
    });
  };

  const applyFilters = () => {
    onApplyFilters(filters);
    onClose();
    toast({
      title: "Filters applied",
      description: "Your advanced filters have been applied to the search results."
    });
  };

  const saveFilterPreset = () => {
    if (!filterName.trim()) {
      toast({
        title: "Filter name required",
        description: "Please enter a name for your filter preset.",
        variant: "destructive"
      });
      return;
    }

    const newPreset = { name: filterName, filters: { ...filters } };
    setSavedFilters(prev => [...prev, newPreset]);
    setShowSaveDialog(false);
    setFilterName('');
    
    toast({
      title: "Filter saved",
      description: `Filter preset "${filterName}" has been saved successfully.`
    });
  };

  const loadFilterPreset = (preset: { name: string; filters: AdvancedFilters }) => {
    setFilters(preset.filters);
    toast({
      title: "Filter loaded",
      description: `Filter preset "${preset.name}" has been loaded.`
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.location.length > 0) count++;
    if (filters.remoteOnly) count++;
    if (filters.experienceLevel.length > 0) count++;
    if (filters.startupStage.length > 0) count++;
    if (filters.industryFocus.length > 0) count++;
    if (filters.requiredSkills.length > 0) count++;
    if (filters.preferredSkills.length > 0) count++;
    if (filters.skillLevel[0] > 0 || filters.skillLevel[1] < 10) count++;
    if (filters.minCompatibilityScore > 70) count++;
    if (filters.matchType.length > 0) count++;
    if (filters.relationshipGoals.length > 0) count++;
    if (filters.timeCommitment.length > 0) count++;
    if (filters.availability.length > 0) count++;
    if (filters.responseTime.length > 0) count++;
    if (filters.companyType.length > 0) count++;
    if (filters.companySize.length > 0) count++;
    if (filters.fundingStage.length > 0) count++;
    if (filters.workStyle.length > 0) count++;
    if (filters.communicationStyle.length > 0) count++;
    if (filters.timezone.length > 0) count++;
    if (filters.languages.length > 0) count++;
    if (filters.hasPortfolio) count++;
    if (filters.isVerified) count++;
    if (filters.responseRate > 0) count++;
    if (filters.lastActive) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <SlidersHorizontal className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Advanced Filters</h2>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">{getActiveFilterCount()} active</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={resetFilters} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)} className="gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Filters */}
            <Card>
              <CardHeader 
                className="pb-3 cursor-pointer"
                onClick={() => toggleSection('basic')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Basic Filters
                  </CardTitle>
                  {expandedSections.basic ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardHeader>
              <AnimatePresence>
                {expandedSections.basic && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="pt-0 space-y-4">
                      <div>
                        <Label htmlFor="search">Search Query</Label>
                        <Input
                          id="search"
                          placeholder="Search by name, skills, or keywords..."
                          value={filters.searchQuery}
                          onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label>Location</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {['San Francisco', 'New York', 'London', 'Remote', 'Austin', 'Seattle', 'Boston', 'Los Angeles'].map(location => (
                            <Badge
                              key={location}
                              variant={filters.location.includes(location) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => handleMultiSelectChange('location', location, !filters.location.includes(location))}
                            >
                              {location}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remote-only"
                          checked={filters.remoteOnly}
                          onCheckedChange={(checked) => handleFilterChange('remoteOnly', checked)}
                        />
                        <Label htmlFor="remote-only">Remote only</Label>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Experience & Stage */}
            <Card>
              <CardHeader 
                className="pb-3 cursor-pointer"
                onClick={() => toggleSection('experience')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Experience & Stage
                  </CardTitle>
                  {expandedSections.experience ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardHeader>
              <AnimatePresence>
                {expandedSections.experience && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="pt-0 space-y-4">
                      <div>
                        <Label>Experience Level</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {FILTER_OPTIONS.experienceLevel.map(level => (
                            <Badge
                              key={level}
                              variant={filters.experienceLevel.includes(level) ? "default" : "outline"}
                              className="cursor-pointer text-xs"
                              onClick={() => handleMultiSelectChange('experienceLevel', level, !filters.experienceLevel.includes(level))}
                            >
                              {level}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Startup Stage</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {FILTER_OPTIONS.startupStage.map(stage => (
                            <Badge
                              key={stage}
                              variant={filters.startupStage.includes(stage) ? "default" : "outline"}
                              className="cursor-pointer text-xs"
                              onClick={() => handleMultiSelectChange('startupStage', stage, !filters.startupStage.includes(stage))}
                            >
                              {stage}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Industry Focus</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {FILTER_OPTIONS.industryFocus.slice(0, 9).map(industry => (
                            <Badge
                              key={industry}
                              variant={filters.industryFocus.includes(industry) ? "default" : "outline"}
                              className="cursor-pointer text-xs"
                              onClick={() => handleMultiSelectChange('industryFocus', industry, !filters.industryFocus.includes(industry))}
                            >
                              {industry}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Skills & Expertise */}
            <Card>
              <CardHeader 
                className="pb-3 cursor-pointer"
                onClick={() => toggleSection('skills')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Skills & Expertise
                  </CardTitle>
                  {expandedSections.skills ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardHeader>
              <AnimatePresence>
                {expandedSections.skills && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="pt-0 space-y-4">
                      <div>
                        <Label>Required Skills</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {SKILL_OPTIONS.slice(0, 12).map(skill => (
                            <Badge
                              key={skill}
                              variant={filters.requiredSkills.includes(skill) ? "default" : "outline"}
                              className="cursor-pointer text-xs"
                              onClick={() => handleMultiSelectChange('requiredSkills', skill, !filters.requiredSkills.includes(skill))}
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Skill Level Range</Label>
                        <div className="mt-2">
                          <Slider
                            value={filters.skillLevel}
                            onValueChange={(value) => handleFilterChange('skillLevel', value)}
                            max={10}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Beginner ({filters.skillLevel[0]})</span>
                            <span>Expert ({filters.skillLevel[1]})</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Compatibility & Match */}
            <Card>
              <CardHeader 
                className="pb-3 cursor-pointer"
                onClick={() => toggleSection('compatibility')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Compatibility & Match
                  </CardTitle>
                  {expandedSections.compatibility ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardHeader>
              <AnimatePresence>
                {expandedSections.compatibility && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="pt-0 space-y-4">
                      <div>
                        <Label>Minimum Compatibility Score: {filters.minCompatibilityScore}%</Label>
                        <Slider
                          value={[filters.minCompatibilityScore]}
                          onValueChange={(value) => handleFilterChange('minCompatibilityScore', value[0])}
                          max={100}
                          step={5}
                          className="w-full mt-2"
                        />
                      </div>

                      <div>
                        <Label>Match Type</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {FILTER_OPTIONS.matchType.map(type => (
                            <Badge
                              key={type}
                              variant={filters.matchType.includes(type) ? "default" : "outline"}
                              className="cursor-pointer text-xs"
                              onClick={() => handleMultiSelectChange('matchType', type, !filters.matchType.includes(type))}
                            >
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Relationship Goals</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {FILTER_OPTIONS.relationshipGoals.map(goal => (
                            <Badge
                              key={goal}
                              variant={filters.relationshipGoals.includes(goal) ? "default" : "outline"}
                              className="cursor-pointer text-xs"
                              onClick={() => handleMultiSelectChange('relationshipGoals', goal, !filters.relationshipGoals.includes(goal))}
                            >
                              {goal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-muted/30">
          <div className="flex items-center space-x-2">
            {savedFilters.length > 0 && (
              <Select onValueChange={(value) => {
                const preset = savedFilters.find(p => p.name === value);
                if (preset) loadFilterPreset(preset);
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Load saved filter" />
                </SelectTrigger>
                <SelectContent>
                  {savedFilters.map(preset => (
                    <SelectItem key={preset.name} value={preset.name}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={applyFilters} className="gap-2">
              <Filter className="w-4 h-4" />
              Apply Filters ({getActiveFilterCount()})
            </Button>
          </div>
        </div>

        {/* Save Filter Dialog */}
        <AnimatePresence>
          {showSaveDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center z-10"
            >
              <Card className="w-96 p-6">
                <h3 className="text-lg font-semibold mb-4">Save Filter Preset</h3>
                <Input
                  placeholder="Enter filter name..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="mb-4"
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveFilterPreset}>
                    Save
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
