import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users,
  Target,
  Lightbulb,
  Rocket,
  Building,
  DollarSign,
  Code,
  Palette,
  Megaphone,
  BarChart3,
  Briefcase,
  Heart,
  Star,
  TrendingUp,
  Award,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Save,
  RefreshCw,
  Upload,
  FileText,
  Image,
  Video,
  Link,
  MapPin,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Settings,
  HelpCircle,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  ThumbsUp,
  MessageSquare,
  Handshake,
  Flag,
  Compass,
  Navigation,
  Zap,
  Sparkles,
  Crown,
  Gem,
  Trophy,
  Gift,
  Diamond,
  UserPlus,
  UserCheck,
  BookOpen,
  GraduationCap,
  Shield,
  Lock,
  Unlock,
  Globe,
  Wifi,
  WifiOff,
  Download,
  Share2,
  Copy,
  Edit,
  Trash2,
  Archive,
  FolderOpen,
  Folder,
  File,
  FilePlus,
  FolderPlus,
  Grid3X3,
  List,
  Maximize2,
  Minimize2,
  Fullscreen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FounderProfile {
  personal: {
    name: string;
    email: string;
    avatar?: string;
    location?: string;
    timezone?: string;
    languages: string[];
    bio: string;
  };
  professional: {
    experience: string;
    industry: string;
    role: string;
    company?: string;
    linkedin?: string;
    website?: string;
    portfolio?: string;
    resume?: string;
  };
  startup: {
    name: string;
    description: string;
    stage: 'idea' | 'pre-seed' | 'seed' | 'series-a' | 'growth';
    category: string;
    targetMarket: string;
    problem: string;
    solution: string;
    traction: string;
    teamSize: number;
    funding: string;
    timeline: string;
  };
  skills: {
    technical: string[];
    business: string[];
    design: string[];
    other: string[];
  };
  preferences: {
    coFounderType: string[];
    commitmentLevel: string;
    location: string[];
    industry: string[];
    stage: string[];
    skills: string[];
    workStyle: string;
    communication: string;
    goals: string[];
  };
  media: {
    logo?: string;
    images: string[];
    videos: string[];
    documents: string[];
    presentations: string[];
  };
}

interface FounderOnboardingProps {
  onComplete: (profile: FounderProfile) => void;
  onSkip: () => void;
  initialData?: Partial<FounderProfile>;
}

export default function FounderOnboarding({ 
  onComplete, 
  onSkip, 
  initialData 
}: FounderOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<FounderProfile>({
    personal: {
      name: '',
      email: '',
      avatar: '',
      location: '',
      timezone: '',
      languages: [],
      bio: ''
    },
    professional: {
      experience: '',
      industry: '',
      role: '',
      company: '',
      linkedin: '',
      website: '',
      portfolio: '',
      resume: ''
    },
    startup: {
      name: '',
      description: '',
      stage: 'idea',
      category: '',
      targetMarket: '',
      problem: '',
      solution: '',
      traction: '',
      teamSize: 1,
      funding: '',
      timeline: ''
    },
    skills: {
      technical: [],
      business: [],
      design: [],
      other: []
    },
    preferences: {
      coFounderType: [],
      commitmentLevel: '',
      location: [],
      industry: [],
      stage: [],
      skills: [],
      workStyle: '',
      communication: '',
      goals: []
    },
    media: {
      images: [],
      videos: [],
      documents: [],
      presentations: []
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const onboardingSteps = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Tell us about yourself',
      icon: <UserPlus className="w-5 h-5" />,
      progress: 20
    },
    {
      id: 'professional',
      title: 'Professional Background',
      description: 'Your experience and expertise',
      icon: <Briefcase className="w-5 h-5" />,
      progress: 40
    },
    {
      id: 'startup',
      title: 'Startup Details',
      description: 'Your venture and vision',
      icon: <Rocket className="w-5 h-5" />,
      progress: 60
    },
    {
      id: 'skills',
      title: 'Skills & Expertise',
      description: 'What you bring to the table',
      icon: <Code className="w-5 h-5" />,
      progress: 75
    },
    {
      id: 'preferences',
      title: 'Co-founder Preferences',
      description: 'What you\'re looking for',
      icon: <Users className="w-5 h-5" />,
      progress: 90
    },
    {
      id: 'media',
      title: 'Media & Portfolio',
      description: 'Showcase your work',
      icon: <Image className="w-5 h-5" />,
      progress: 100
    }
  ];

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 
    'Manufacturing', 'Real Estate', 'Transportation', 'Energy', 'Agriculture',
    'Media & Entertainment', 'Travel & Hospitality', 'Non-profit', 'Government', 'Other'
  ];

  const experienceLevels = [
    'Entry Level (0-2 years)', 'Mid Level (3-5 years)', 
    'Senior Level (6-10 years)', 'Executive Level (10+ years)'
  ];

  const startupStages = [
    { value: 'idea', label: 'Idea Stage', description: 'Just the concept' },
    { value: 'pre-seed', label: 'Pre-seed', description: 'Early development' },
    { value: 'seed', label: 'Seed Stage', description: 'Initial funding' },
    { value: 'series-a', label: 'Series A', description: 'Growth stage' },
    { value: 'growth', label: 'Growth', description: 'Scaling up' }
  ];

  const technicalSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust',
    'React', 'Vue', 'Angular', 'Node.js', 'Django', 'Rails', 'Spring',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD',
    'Machine Learning', 'AI', 'Data Science', 'Blockchain', 'IoT'
  ];

  const businessSkills = [
    'Business Strategy', 'Marketing', 'Sales', 'Finance', 'Accounting',
    'Product Management', 'Project Management', 'Operations', 'HR',
    'Fundraising', 'Investment Analysis', 'M&A', 'Partnerships',
    'Growth Hacking', 'SEO', 'SEM', 'Content Marketing', 'Social Media'
  ];

  const designSkills = [
    'UI/UX Design', 'Product Design', 'Graphic Design', 'Web Design',
    'Mobile Design', 'Figma', 'Sketch', 'Adobe Creative Suite',
    'User Research', 'Prototyping', 'Wireframing', 'Design Systems'
  ];

  const coFounderTypes = [
    'Technical Co-founder', 'Business Co-founder', 'Design Co-founder',
    'Marketing Co-founder', 'Operations Co-founder', 'Finance Co-founder'
  ];

  const commitmentLevels = [
    'Full-time (40+ hours/week)', 'Part-time (20-30 hours/week)',
    'Flexible (10-20 hours/week)', 'Advisory role (5-10 hours/week)'
  ];

  const workStyles = [
    'Remote-first', 'Hybrid', 'In-office', 'Flexible', 'Structured', 'Autonomous'
  ];

  const communicationStyles = [
    'Formal', 'Casual', 'Direct', 'Diplomatic', 'Detailed', 'Concise'
  ];

  useEffect(() => {
    if (initialData) {
      setProfile(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const validateStep = (stepId: string): boolean => {
    const errors: Record<string, string> = {};

    switch (stepId) {
      case 'personal':
        if (!profile.personal.name.trim()) errors.name = 'Name is required';
        if (!profile.personal.email.trim()) errors.email = 'Email is required';
        if (!profile.personal.bio.trim()) errors.bio = 'Bio is required';
        break;
      case 'professional':
        if (!profile.professional.experience) errors.experience = 'Experience level is required';
        if (!profile.professional.industry) errors.industry = 'Industry is required';
        if (!profile.professional.role) errors.role = 'Role is required';
        break;
      case 'startup':
        if (!profile.startup.name.trim()) errors.startupName = 'Startup name is required';
        if (!profile.startup.description.trim()) errors.startupDescription = 'Description is required';
        if (!profile.startup.category) errors.category = 'Category is required';
        if (!profile.startup.problem.trim()) errors.problem = 'Problem statement is required';
        if (!profile.startup.solution.trim()) errors.solution = 'Solution is required';
        break;
      case 'skills':
        if (profile.skills.technical.length === 0 && 
            profile.skills.business.length === 0 && 
            profile.skills.design.length === 0 && 
            profile.skills.other.length === 0) {
          errors.skills = 'At least one skill is required';
        }
        break;
      case 'preferences':
        if (profile.preferences.coFounderType.length === 0) {
          errors.coFounderType = 'Select at least one co-founder type';
        }
        if (!profile.preferences.commitmentLevel) {
          errors.commitmentLevel = 'Commitment level is required';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(onboardingSteps[currentStep].id)) {
      if (currentStep < onboardingSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      onComplete(profile);
      setIsSaving(false);
      toast({
        title: "Profile completed",
        description: "Your founder profile has been saved successfully."
      });
    }, 1000);
  };

  const handleSkillToggle = (category: keyof typeof profile.skills, skill: string) => {
    setProfile(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].includes(skill)
          ? prev.skills[category].filter(s => s !== skill)
          : [...prev.skills[category], skill]
      }
    }));
  };

  const renderStepContent = () => {
    const currentStepData = onboardingSteps[currentStep];

    switch (currentStepData.id) {
      case 'personal':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Personal Information</h2>
              <p className="text-muted-foreground">Tell us about yourself to help others get to know you</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Full Name *</label>
                  <Input
                    value={profile.personal.name}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      personal: { ...prev.personal, name: e.target.value }
                    }))}
                    placeholder="Enter your full name"
                    className={validationErrors.name ? 'border-red-500' : ''}
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-red-500">{validationErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Email *</label>
                  <Input
                    value={profile.personal.email}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      personal: { ...prev.personal, email: e.target.value }
                    }))}
                    placeholder="your.email@example.com"
                    type="email"
                    className={validationErrors.email ? 'border-red-500' : ''}
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-500">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Location</label>
                  <Input
                    value={profile.personal.location}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      personal: { ...prev.personal, location: e.target.value }
                    }))}
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Timezone</label>
                  <Select
                    value={profile.personal.timezone}
                    onValueChange={(value) => setProfile(prev => ({
                      ...prev,
                      personal: { ...prev.personal, timezone: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="CST">Central Time</SelectItem>
                      <SelectItem value="MST">Mountain Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Bio *</label>
                  <Textarea
                    value={profile.personal.bio}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      personal: { ...prev.personal, bio: e.target.value }
                    }))}
                    placeholder="Tell us about yourself, your background, and what drives you..."
                    rows={6}
                    className={validationErrors.bio ? 'border-red-500' : ''}
                  />
                  {validationErrors.bio && (
                    <p className="text-sm text-red-500">{validationErrors.bio}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese'].map(lang => (
                      <Badge
                        key={lang}
                        variant={profile.personal.languages.includes(lang) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setProfile(prev => ({
                            ...prev,
                            personal: {
                              ...prev.personal,
                              languages: prev.personal.languages.includes(lang)
                                ? prev.personal.languages.filter(l => l !== lang)
                                : [...prev.personal.languages, lang]
                            }
                          }));
                        }}
                      >
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Profile Picture</label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'professional':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Professional Background</h2>
              <p className="text-muted-foreground">Share your experience and professional journey</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Experience Level *</label>
                  <Select
                    value={profile.professional.experience}
                    onValueChange={(value) => setProfile(prev => ({
                      ...prev,
                      professional: { ...prev.professional, experience: value }
                    }))}
                  >
                    <SelectTrigger className={validationErrors.experience ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.experience && (
                    <p className="text-sm text-red-500">{validationErrors.experience}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Industry *</label>
                  <Select
                    value={profile.professional.industry}
                    onValueChange={(value) => setProfile(prev => ({
                      ...prev,
                      professional: { ...prev.professional, industry: value }
                    }))}
                  >
                    <SelectTrigger className={validationErrors.industry ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.industry && (
                    <p className="text-sm text-red-500">{validationErrors.industry}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Current Role *</label>
                  <Input
                    value={profile.professional.role}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      professional: { ...prev.professional, role: e.target.value }
                    }))}
                    placeholder="e.g., Software Engineer, Product Manager"
                    className={validationErrors.role ? 'border-red-500' : ''}
                  />
                  {validationErrors.role && (
                    <p className="text-sm text-red-500">{validationErrors.role}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Company</label>
                  <Input
                    value={profile.professional.company}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      professional: { ...prev.professional, company: e.target.value }
                    }))}
                    placeholder="Current or previous company"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">LinkedIn Profile</label>
                  <Input
                    value={profile.professional.linkedin}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      professional: { ...prev.professional, linkedin: e.target.value }
                    }))}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Personal Website</label>
                  <Input
                    value={profile.professional.website}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      professional: { ...prev.professional, website: e.target.value }
                    }))}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Portfolio</label>
                  <Input
                    value={profile.professional.portfolio}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      professional: { ...prev.professional, portfolio: e.target.value }
                    }))}
                    placeholder="Link to your portfolio"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Resume/CV</label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <FileText className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Upload resume</p>
                    <p className="text-xs text-muted-foreground">PDF, DOC up to 5MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'startup':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Startup Details</h2>
              <p className="text-muted-foreground">Tell us about your venture and vision</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Startup Name *</label>
                  <Input
                    value={profile.startup.name}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      startup: { ...prev.startup, name: e.target.value }
                    }))}
                    placeholder="Your startup name"
                    className={validationErrors.startupName ? 'border-red-500' : ''}
                  />
                  {validationErrors.startupName && (
                    <p className="text-sm text-red-500">{validationErrors.startupName}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Stage *</label>
                  <Select
                    value={profile.startup.stage}
                    onValueChange={(value) => setProfile(prev => ({
                      ...prev,
                      startup: { ...prev.startup, stage: value as any }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {startupStages.map(stage => (
                        <SelectItem key={stage.value} value={stage.value}>
                          <div>
                            <div className="font-medium">{stage.label}</div>
                            <div className="text-sm text-muted-foreground">{stage.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Description *</label>
                <Textarea
                  value={profile.startup.description}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    startup: { ...prev.startup, description: e.target.value }
                  }))}
                  placeholder="Describe your startup in a few sentences..."
                  rows={3}
                  className={validationErrors.startupDescription ? 'border-red-500' : ''}
                />
                {validationErrors.startupDescription && (
                  <p className="text-sm text-red-500">{validationErrors.startupDescription}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Category *</label>
                  <Select
                    value={profile.startup.category}
                    onValueChange={(value) => setProfile(prev => ({
                      ...prev,
                      startup: { ...prev.startup, category: value }
                    }))}
                  >
                    <SelectTrigger className={validationErrors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.category && (
                    <p className="text-sm text-red-500">{validationErrors.category}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Target Market</label>
                  <Input
                    value={profile.startup.targetMarket}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      startup: { ...prev.startup, targetMarket: e.target.value }
                    }))}
                    placeholder="Who are your customers?"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Problem Statement *</label>
                  <Textarea
                    value={profile.startup.problem}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      startup: { ...prev.startup, problem: e.target.value }
                    }))}
                    placeholder="What problem are you solving?"
                    rows={3}
                    className={validationErrors.problem ? 'border-red-500' : ''}
                  />
                  {validationErrors.problem && (
                    <p className="text-sm text-red-500">{validationErrors.problem}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Solution *</label>
                  <Textarea
                    value={profile.startup.solution}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      startup: { ...prev.startup, solution: e.target.value }
                    }))}
                    placeholder="How are you solving this problem?"
                    rows={3}
                    className={validationErrors.solution ? 'border-red-500' : ''}
                  />
                  {validationErrors.solution && (
                    <p className="text-sm text-red-500">{validationErrors.solution}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Traction</label>
                  <Textarea
                    value={profile.startup.traction}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      startup: { ...prev.startup, traction: e.target.value }
                    }))}
                    placeholder="What progress have you made?"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Team Size</label>
                  <Input
                    type="number"
                    value={profile.startup.teamSize}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      startup: { ...prev.startup, teamSize: parseInt(e.target.value) || 1 }
                    }))}
                    placeholder="Number of team members"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Funding</label>
                  <Input
                    value={profile.startup.funding}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      startup: { ...prev.startup, funding: e.target.value }
                    }))}
                    placeholder="Current funding status"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Skills & Expertise</h2>
              <p className="text-muted-foreground">What skills and expertise do you bring?</p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {technicalSkills.map(skill => (
                    <Badge
                      key={skill}
                      variant={profile.skills.technical.includes(skill) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleSkillToggle('technical', skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Business Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {businessSkills.map(skill => (
                    <Badge
                      key={skill}
                      variant={profile.skills.business.includes(skill) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleSkillToggle('business', skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Design Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {designSkills.map(skill => (
                    <Badge
                      key={skill}
                      variant={profile.skills.design.includes(skill) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleSkillToggle('design', skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Other Skills</h3>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Add a custom skill"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const skill = e.currentTarget.value.trim();
                        if (!profile.skills.other.includes(skill)) {
                          setProfile(prev => ({
                            ...prev,
                            skills: {
                              ...prev.skills,
                              other: [...prev.skills.other, skill]
                            }
                          }));
                        }
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.skills.other.map(skill => (
                    <Badge
                      key={skill}
                      variant="default"
                      className="cursor-pointer"
                      onClick={() => handleSkillToggle('other', skill)}
                    >
                      {skill}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>

              {validationErrors.skills && (
                <p className="text-sm text-red-500">{validationErrors.skills}</p>
              )}
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Co-founder Preferences</h2>
              <p className="text-muted-foreground">What are you looking for in a co-founder?</p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Co-founder Type *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {coFounderTypes.map(type => (
                    <label
                      key={type}
                      className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={profile.preferences.coFounderType.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setProfile(prev => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                coFounderType: [...prev.preferences.coFounderType, type]
                              }
                            }));
                          } else {
                            setProfile(prev => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                coFounderType: prev.preferences.coFounderType.filter(t => t !== type)
                              }
                            }));
                          }
                        }}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
                {validationErrors.coFounderType && (
                  <p className="text-sm text-red-500">{validationErrors.coFounderType}</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Commitment Level *</h3>
                <Select
                  value={profile.preferences.commitmentLevel}
                  onValueChange={(value) => setProfile(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, commitmentLevel: value }
                  }))}
                >
                  <SelectTrigger className={validationErrors.commitmentLevel ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select commitment level" />
                  </SelectTrigger>
                  <SelectContent>
                    {commitmentLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.commitmentLevel && (
                  <p className="text-sm text-red-500">{validationErrors.commitmentLevel}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Location Preference</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Remote', 'On-site', 'Hybrid', 'Flexible'].map(location => (
                      <Badge
                        key={location}
                        variant={profile.preferences.location.includes(location) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setProfile(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              location: prev.preferences.location.includes(location)
                                ? prev.preferences.location.filter(l => l !== location)
                                : [...prev.preferences.location, location]
                            }
                          }));
                        }}
                      >
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Work Style</h3>
                  <Select
                    value={profile.preferences.workStyle}
                    onValueChange={(value) => setProfile(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, workStyle: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select work style" />
                    </SelectTrigger>
                    <SelectContent>
                      {workStyles.map(style => (
                        <SelectItem key={style} value={style}>{style}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Communication Style</h3>
                  <Select
                    value={profile.preferences.communication}
                    onValueChange={(value) => setProfile(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, communication: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select communication style" />
                    </SelectTrigger>
                    <SelectContent>
                      {communicationStyles.map(style => (
                        <SelectItem key={style} value={style}>{style}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Goals</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Build MVP', 'Scale Product', 'Raise Funding', 'Enter New Market', 'Build Team'].map(goal => (
                      <Badge
                        key={goal}
                        variant={profile.preferences.goals.includes(goal) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setProfile(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              goals: prev.preferences.goals.includes(goal)
                                ? prev.preferences.goals.filter(g => g !== goal)
                                : [...prev.preferences.goals, goal]
                            }
                          }));
                        }}
                      >
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Media & Portfolio</h2>
              <p className="text-muted-foreground">Showcase your work and build credibility</p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Startup Logo</h3>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload your startup logo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Product Screenshots</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Image className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Screenshot {i}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Demo Video</h3>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Video className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload demo video</p>
                  <p className="text-xs text-muted-foreground">MP4, MOV up to 100MB</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Documents</h3>
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <FileText className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Pitch Deck</p>
                  </div>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <FileText className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Business Plan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Founder Onboarding</h1>
                <p className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {onboardingSteps.length}: {onboardingSteps[currentStep].title}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={onSkip}>
                Skip for Now
              </Button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <div className="w-32 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${onboardingSteps[currentStep].progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{onboardingSteps[currentStep].progress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {onboardingSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= currentStep ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  {index < onboardingSteps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 ${
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-8 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                // Save progress
                toast({
                  title: "Progress saved",
                  description: "Your onboarding progress has been saved."
                });
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Progress
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : currentStep === onboardingSteps.length - 1 ? (
                <>
                  Complete
                  <CheckCircle className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
