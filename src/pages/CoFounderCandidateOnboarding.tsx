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
  UserMinus,
  UserX,
  Rocket,
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
  GraduationCap,
  BookOpen,
  Brain,
  Cpu,
  Database,
  Server,
  Cloud,
  Smartphone,
  Tablet,
  Monitor,
  Headphones,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Mail,
  MailOpen,
  Send,
  Paperclip,
  PaperclipOff,
  Bookmark,
  BookmarkOff,
  HeartHandshake,
  Users2,
  UserCircle,
  UserCheck2,
  UserX2,
  ZapOff,
  Battery,
  BatteryCharging,
  WifiOff as WifiOffIcon,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
  Activity,
  ActivitySquare,
  Square,
  CheckSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CoFounderCandidate {
  personal: {
    name: string;
    email: string;
    avatar?: string;
    location?: string;
    timezone?: string;
    languages: string[];
    bio: string;
    linkedin?: string;
    website?: string;
    portfolio?: string;
    github?: string;
    twitter?: string;
  };
  professional: {
    experience: string;
    industry: string;
    role: string;
    company?: string;
    previousStartups?: string[];
    achievements?: string[];
    education?: string[];
    certifications?: string[];
  };
  skills: {
    technical: string[];
    business: string[];
    design: string[];
    other: string[];
  };
  project: {
    name: string;
    description: string;
    stage: 'idea' | 'pre-seed' | 'seed' | 'series-a' | 'growth';
      category: string;
      targetMarket: string;
      problem: string;
      solution: string;
      traction: string;
      timeline: string;
      budget?: string;
      resources?: string[];
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
    values: string[];
    dealbreakers: string[];
    timeline: string;
  };
  availability: {
    immediateStart: boolean;
    hoursPerWeek: number;
    flexibleSchedule: boolean;
    currentCommitments: string[];
    noticePeriod: string;
  };
  media: {
    avatar?: string;
    images: string[];
    videos: string[];
    documents: string[];
    presentations: string[];
  };
}

interface CoFounderCandidateOnboardingProps {
  onComplete: (candidate: CoFounderCandidate) => void;
  onSkip: () => void;
  initialData?: Partial<CoFounderCandidate>;
}

export default function CoFounderCandidateOnboarding({ 
  onComplete, 
  onSkip, 
  initialData 
}: CoFounderCandidateOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [candidate, setCandidate] = useState<CoFounderCandidate>({
    personal: {
      name: '',
      email: '',
      avatar: '',
      location: '',
      timezone: '',
      languages: [],
      bio: '',
      linkedin: '',
      website: '',
      portfolio: '',
      github: '',
      twitter: ''
    },
    professional: {
      experience: '',
      industry: '',
      role: '',
      company: '',
      previousStartups: [],
      achievements: [],
      education: [],
      certifications: []
    },
    skills: {
      technical: [],
      business: [],
      design: [],
      other: []
    },
    project: {
      name: '',
      description: '',
      stage: 'idea',
      category: '',
      targetMarket: '',
      problem: '',
      solution: '',
      traction: '',
      timeline: '',
      budget: '',
      resources: []
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
      values: [],
      dealbreakers: [],
      timeline: ''
    },
    availability: {
      immediateStart: false,
      hoursPerWeek: 40,
      flexibleSchedule: false,
      currentCommitments: [],
      noticePeriod: ''
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
      progress: 15
    },
    {
      id: 'professional',
      title: 'Professional Background',
      description: 'Your experience and expertise',
      icon: <Briefcase className="w-5 h-5" />,
      progress: 30
    },
    {
      id: 'skills',
      title: 'Skills & Expertise',
      description: 'What you bring to the table',
      icon: <Code className="w-5 h-5" />,
      progress: 45
    },
    {
      id: 'project',
      title: 'Project Idea',
      description: 'Your venture concept',
      icon: <Lightbulb className="w-5 h-5" />,
      progress: 60
    },
    {
      id: 'preferences',
      title: 'Co-founder Preferences',
      description: 'What you\'re looking for',
      icon: <Users className="w-5 h-5" />,
      progress: 75
    },
    {
      id: 'availability',
      title: 'Availability & Commitment',
      description: 'Your time and resources',
      icon: <Clock className="w-5 h-5" />,
      progress: 90
    },
    {
      id: 'media',
      title: 'Portfolio & Media',
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

  const projectStages = [
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

  const coreValues = [
    'Innovation', 'Quality', 'Speed', 'Collaboration', 'Transparency',
    'Accountability', 'Customer Focus', 'Growth Mindset', 'Work-Life Balance',
    'Sustainability', 'Social Impact', 'Ethical Business'
  ];

  const dealbreakers = [
    'No equity-only roles', 'Must have funding secured', 'No remote work',
    'Must be in same city', 'No side projects', 'Must have previous startup experience',
    'No advisors-only roles', 'Must be full-time', 'No part-time commitments'
  ];

  useEffect(() => {
    if (initialData) {
      setCandidate(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const validateStep = (stepId: string): boolean => {
    const errors: Record<string, string> = {};

    switch (stepId) {
      case 'personal':
        if (!candidate.personal.name.trim()) errors.name = 'Name is required';
        if (!candidate.personal.email.trim()) errors.email = 'Email is required';
        if (!candidate.personal.bio.trim()) errors.bio = 'Bio is required';
        break;
      case 'professional':
        if (!candidate.professional.experience) errors.experience = 'Experience level is required';
        if (!candidate.professional.industry) errors.industry = 'Industry is required';
        if (!candidate.professional.role) errors.role = 'Role is required';
        break;
      case 'skills':
        if (candidate.skills.technical.length === 0 && 
            candidate.skills.business.length === 0 && 
            candidate.skills.design.length === 0 && 
            candidate.skills.other.length === 0) {
          errors.skills = 'At least one skill is required';
        }
        break;
      case 'project':
        if (!candidate.project.name.trim()) errors.projectName = 'Project name is required';
        if (!candidate.project.description.trim()) errors.projectDescription = 'Description is required';
        if (!candidate.project.category) errors.category = 'Category is required';
        if (!candidate.project.problem.trim()) errors.problem = 'Problem statement is required';
        if (!candidate.project.solution.trim()) errors.solution = 'Solution is required';
        break;
      case 'preferences':
        if (candidate.preferences.coFounderType.length === 0) {
          errors.coFounderType = 'Select at least one co-founder type';
        }
        if (!candidate.preferences.commitmentLevel) {
          errors.commitmentLevel = 'Commitment level is required';
        }
        break;
      case 'availability':
        if (candidate.availability.hoursPerWeek < 5) {
          errors.hoursPerWeek = 'Must be available at least 5 hours per week';
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
      onComplete(candidate);
      setIsSaving(false);
      toast({
        title: "Profile completed",
        description: "Your co-founder candidate profile has been saved successfully."
      });
    }, 1000);
  };

  const handleSkillToggle = (category: keyof typeof candidate.skills, skill: string) => {
    setCandidate(prev => ({
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
              <p className="text-muted-foreground">Tell us about yourself to help potential co-founders get to know you</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Full Name *</label>
                  <Input
                    value={candidate.personal.name}
                    onChange={(e) => setCandidate(prev => ({
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
                    value={candidate.personal.email}
                    onChange={(e) => setCandidate(prev => ({
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
                    value={candidate.personal.location}
                    onChange={(e) => setCandidate(prev => ({
                      ...prev,
                      personal: { ...prev.personal, location: e.target.value }
                    }))}
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Timezone</label>
                  <Select
                    value={candidate.personal.timezone}
                    onValueChange={(value) => setCandidate(prev => ({
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
                    value={candidate.personal.bio}
                    onChange={(e) => setCandidate(prev => ({
                      ...prev,
                      personal: { ...prev.personal, bio: e.target.value }
                    }))}
                    placeholder="Tell us about yourself, your background, and what drives you as a potential co-founder..."
                    rows={6}
                    className={validationErrors.bio ? 'border-red-500' : ''}
                  />
                  {validationErrors.bio && (
                    <p className="text-sm text-red-500">{validationErrors.bio}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">LinkedIn</label>
                    <Input
                      value={candidate.personal.linkedin}
                      onChange={(e) => setCandidate(prev => ({
                        ...prev,
                        personal: { ...prev.personal, linkedin: e.target.value }
                      }))}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Website</label>
                    <Input
                      value={candidate.personal.website}
                      onChange={(e) => setCandidate(prev => ({
                        ...prev,
                        personal: { ...prev.personal, website: e.target.value }
                      }))}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Portfolio</label>
                    <Input
                      value={candidate.personal.portfolio}
                      onChange={(e) => setCandidate(prev => ({
                        ...prev,
                        personal: { ...prev.personal, portfolio: e.target.value }
                      }))}
                      placeholder="Link to your portfolio"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">GitHub</label>
                    <Input
                      value={candidate.personal.github}
                      onChange={(e) => setCandidate(prev => ({
                        ...prev,
                        personal: { ...prev.personal, github: e.target.value }
                      }))}
                      placeholder="https://github.com/username"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese'].map(lang => (
                      <Badge
                        key={lang}
                        variant={candidate.personal.languages.includes(lang) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setCandidate(prev => ({
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
                    value={candidate.professional.experience}
                    onValueChange={(value) => setCandidate(prev => ({
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
                    value={candidate.professional.industry}
                    onValueChange={(value) => setCandidate(prev => ({
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
                    value={candidate.professional.role}
                    onChange={(e) => setCandidate(prev => ({
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
                    value={candidate.professional.company}
                    onChange={(e) => setCandidate(prev => ({
                      ...prev,
                      professional: { ...prev.professional, company: e.target.value }
                    }))}
                    placeholder="Current or previous company"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Previous Startups</label>
                  <Textarea
                    value={candidate.professional.previousStartups?.join('\n')}
                    onChange={(e) => setCandidate(prev => ({
                      ...prev,
                      professional: { 
                        ...prev.professional, 
                        previousStartups: e.target.value.split('\n').filter(s => s.trim())
                      }
                    }))}
                    placeholder="List previous startups you've been involved with..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Key Achievements</label>
                  <Textarea
                    value={candidate.professional.achievements?.join('\n')}
                    onChange={(e) => setCandidate(prev => ({
                      ...prev,
                      professional: { 
                        ...prev.professional, 
                        achievements: e.target.value.split('\n').filter(s => s.trim())
                      }
                    }))}
                    placeholder="List your key professional achievements..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Education</label>
                  <Textarea
                    value={candidate.professional.education?.join('\n')}
                    onChange={(e) => setCandidate(prev => ({
                      ...prev,
                      professional: { 
                        ...prev.professional, 
                        education: e.target.value.split('\n').filter(s => s.trim())
                      }
                    }))}
                    placeholder="List your educational background..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Certifications</label>
                  <Textarea
                    value={candidate.professional.certifications?.join('\n')}
                    onChange={(e) => setCandidate(prev => ({
                      ...prev,
                      professional: { 
                        ...prev.professional, 
                        certifications: e.target.value.split('\n').filter(s => s.trim())
                      }
                    }))}
                    placeholder="List relevant certifications..."
                    rows={3}
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
              <p className="text-muted-foreground">What skills and expertise do you bring to a co-founder relationship?</p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {technicalSkills.map(skill => (
                    <Badge
                      key={skill}
                      variant={candidate.skills.technical.includes(skill) ? 'default' : 'outline'}
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
                      variant={candidate.skills.business.includes(skill) ? 'default' : 'outline'}
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
                      variant={candidate.skills.design.includes(skill) ? 'default' : 'outline'}
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
                        if (!candidate.skills.other.includes(skill)) {
                          setCandidate(prev => ({
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
                  {candidate.skills.other.map(skill => (
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

      case 'project':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Project Idea</h2>
              <p className="text-muted-foreground">Tell us about your venture concept and vision</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Project Name *</label>
                  <Input
                    value={candidate.project.name}
                    onChange={(e) => setCandidate(prev => ({
                      ...prev,
                      project: { ...prev.project, name: e.target.value }
                    }))}
                    placeholder="Your project name"
                    className={validationErrors.projectName ? 'border-red-500' : ''}
                  />
                  {validationErrors.projectName && (
                    <p className="text-sm text-red-500">{validationErrors.projectName}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Stage *</label>
                  <Select
                    value={candidate.project.stage}
                    onValueChange={(value) => setCandidate(prev => ({
                      ...prev,
                      project: { ...prev.project, stage: value as any }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectStages.map(stage => (
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
                  value={candidate.project.description}
                  onChange={(e) => setCandidate(prev => ({
                    ...prev,
                    project: { ...prev.project, description: e.target.value }
                  }))}
                  placeholder="Describe your project in a few sentences..."
                  rows={3}
                  className={validationErrors.projectDescription ? 'border-red-500' : ''}
                />
                {validationErrors.projectDescription && (
                  <p className="text-sm text-red-500">{validationErrors.projectDescription}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Category *</label>
                  <Select
                    value={candidate.project.category}
                    onValueChange={(value) => setCandidate(prev => ({
                      ...prev,
                      project: { ...prev.project, category: value }
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
                    value={candidate.project.targetMarket}
                    onChange={(e) => setCandidate(prev => ({
                      ...prev,
                      project: { ...prev.project, targetMarket: e.target.value }
                    }))}
                    placeholder="Who are your customers?"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Problem Statement *</label>
                  <Textarea
                    value={candidate.project.problem}
                    onChange={(e) => setCandidate(prev => ({
                      ...prev,
                      project: { ...prev.project, problem: e.target.value }
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
                    value={candidate.project.solution}
                    onChange={(e) => setCandidate(prev => ({
                      ...prev,
                      project: { ...prev.project, solution: e.target.value }
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
                    value={candidate.project.traction}
                    onChange={(e) => setCandidate(prev => ({
                      ...prev,
                      project: { ...prev.project, traction: e.target.value }
                    }))}
                    placeholder="What progress have you made?"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Timeline</label>
                  <Input
                    value={candidate.project.timeline}
                    onChange={(e) => setCandidate(prev => ({
                      ...prev,
                      project: { ...prev.project, timeline: e.target.value }
                    }))}
                    placeholder="Expected timeline to MVP"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Budget</label>
                  <Input
                    value={candidate.project.budget}
                    onChange={(e) => setCandidate(prev => ({
                      ...prev,
                      project: { ...prev.project, budget: e.target.value }
                    }))}
                    placeholder="Available budget or funding status"
                  />
                </div>
              </div>
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
                        checked={candidate.preferences.coFounderType.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCandidate(prev => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                coFounderType: [...prev.preferences.coFounderType, type]
                              }
                            }));
                          } else {
                            setCandidate(prev => ({
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
                  value={candidate.preferences.commitmentLevel}
                  onValueChange={(value) => setCandidate(prev => ({
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
                        variant={candidate.preferences.location.includes(location) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setCandidate(prev => ({
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
                    value={candidate.preferences.workStyle}
                    onValueChange={(value) => setCandidate(prev => ({
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
                    value={candidate.preferences.communication}
                    onValueChange={(value) => setCandidate(prev => ({
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
                  <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                  <Input
                    value={candidate.preferences.timeline}
                    onChange={(e) => setCandidate(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, timeline: e.target.value }
                    }))}
                    placeholder="When are you looking to start?"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Core Values</h3>
                <div className="flex flex-wrap gap-2">
                  {coreValues.map(value => (
                    <Badge
                      key={value}
                      variant={candidate.preferences.values.includes(value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setCandidate(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            values: prev.preferences.values.includes(value)
                              ? prev.preferences.values.filter(v => v !== value)
                              : [...prev.preferences.values, value]
                          }
                        }));
                      }}
                    >
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Dealbreakers</h3>
                <div className="flex flex-wrap gap-2">
                  {dealbreakers.map(dealbreaker => (
                    <Badge
                      key={dealbreaker}
                      variant={candidate.preferences.dealbreakers.includes(dealbreaker) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setCandidate(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            dealbreakers: prev.preferences.dealbreakers.includes(dealbreaker)
                              ? prev.preferences.dealbreakers.filter(d => d !== dealbreaker)
                              : [...prev.preferences.dealbreakers, dealbreaker]
                          }
                        }));
                      }}
                    >
                      {dealbreaker}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'availability':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Availability & Commitment</h2>
              <p className="text-muted-foreground">Your time availability and commitment level</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="immediateStart"
                  checked={candidate.availability.immediateStart}
                  onCheckedChange={(checked) => setCandidate(prev => ({
                    ...prev,
                    availability: { ...prev.availability, immediateStart: checked }
                  }))}
                />
                <label htmlFor="immediateStart" className="text-sm font-medium">
                  Available to start immediately
                </label>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Hours Per Week *</label>
                <div className="flex items-center space-x-4">
                  <Input
                    type="range"
                    min="5"
                    max="80"
                    value={candidate.availability.hoursPerWeek}
                    onChange={(e) => setCandidate(prev => ({
                      ...prev,
                      availability: { ...prev.availability, hoursPerWeek: parseInt(e.target.value) || 5 }
                    }))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-20">
                    {candidate.availability.hoursPerWeek} hours
                  </span>
                </div>
                {validationErrors.hoursPerWeek && (
                  <p className="text-sm text-red-500">{validationErrors.hoursPerWeek}</p>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="flexibleSchedule"
                  checked={candidate.availability.flexibleSchedule}
                  onCheckedChange={(checked) => setCandidate(prev => ({
                    ...prev,
                    availability: { ...prev.availability, flexibleSchedule: checked }
                  }))}
                />
                <label htmlFor="flexibleSchedule" className="text-sm font-medium">
                  Flexible schedule preferred
                </label>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Current Commitments</label>
                <Textarea
                  value={candidate.availability.currentCommitments.join('\n')}
                  onChange={(e) => setCandidate(prev => ({
                    ...prev,
                    availability: { 
                      ...prev.availability, 
                      currentCommitments: e.target.value.split('\n').filter(s => s.trim())
                    }
                  }))}
                  placeholder="List current work or personal commitments..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Notice Period</label>
                <Input
                  value={candidate.availability.noticePeriod}
                  onChange={(e) => setCandidate(prev => ({
                    ...prev,
                    availability: { ...prev.availability, noticePeriod: e.target.value }
                  }))}
                  placeholder="e.g., 2 weeks, 1 month, immediate"
                />
              </div>
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Portfolio & Media</h2>
              <p className="text-muted-foreground">Showcase your work and build credibility</p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload your profile picture</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Project Mockups</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Image className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Mockup {i}</p>
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
                    <p className="text-sm text-muted-foreground">Resume/CV</p>
                  </div>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <FileText className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Project Proposal</p>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Co-founder Candidate Onboarding</h1>
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
