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
  Target,
  Heart,
  Star,
  Zap,
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
  Sparkles,
  Crown,
  Gem,
  Trophy,
  Gift,
  Diamond,
  UserPlus,
  UserCheck,
  BookOpen,
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
  Rocket,
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
  Phone,
  PhoneOff,
  Mail,
  MailOpen,
  Send,
  Paperclip,
  Bookmark,
  HeartHandshake,
  Users2,
  UserCircle,
  UserCheck2,
  UserX2,
  ZapOff,
  Battery,
  BatteryCharging,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
  Activity,
  ActivitySquare,
  Square,
  CheckSquare,
  Video,
  VideoOff,
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  Rewind,
  FastForward,
  Repeat,
  Radio,
  RadioOff,
  Bell,
  BellOff,
  BellRing,
  Calendar,
  CalendarCheck,
  CalendarX,
  Clock,
  Clock1,
  Clock2,
  Clock3,
  Clock4,
  Clock5,
  Clock6,
  Clock7,
  Clock8,
  Clock9,
  Clock10,
  Clock11,
  Clock12,
  Timer,
  TimerReset,
  TimerOff,
  Stopwatch,
  StopwatchOff,
  AlarmClock,
  AlarmClockOff,
  Hourglass,
  TimerStart,
  TimerPause,
  TimerEnd,
  GraduationCap,
  Lightbulb,
  Building,
  DollarSign,
  Code,
  Palette,
  Megaphone,
  BarChart3,
  Briefcase,
  Eye,
  EyeOff,
  Settings,
  HelpCircle,
  MapPin,
  Flag as FlagIcon,
  Compass as CompassIcon,
  Navigation as NavigationIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PreferencesProfile {
  personal: {
    name: string;
    email: string;
    avatar?: string;
    bio: string;
  };
  values: {
    coreValues: string[];
    workLifeBalance: string;
    riskTolerance: string;
    growthMindset: string;
    ethicalPriorities: string[];
    culturalFit: string[];
  };
  goals: {
    shortTermGoals: string[];
    longTermGoals: string[];
    careerGoals: string[];
    personalGoals: string[];
    businessGoals: string[];
    financialGoals: string[];
    timeline: string;
    milestones: string[];
  };
  preferences: {
    workEnvironment: string[];
    teamSize: string;
    companyStage: string[];
    industry: string[];
    location: string[];
    remoteWork: string;
    workStyle: string;
    communicationStyle: string;
    decisionMaking: string;
    leadership: string;
    collaboration: string;
  };
  dealbreakers: {
    redFlags: string[];
    nonNegotiables: string[];
    warningSigns: string[];
    concerns: string[];
  };
  compatibility: {
    personalityTypes: string[];
    communicationStyles: string[];
    workingStyles: string[];
    conflictResolution: string[];
    feedbackStyle: string[];
    motivation: string[];
  };
}

interface PreferencesOnboardingProps {
  onComplete: (profile: PreferencesProfile) => void;
  onSkip: () => void;
  initialData?: Partial<PreferencesProfile>;
}

export default function PreferencesOnboarding({ 
  onComplete, 
  onSkip, 
  initialData 
}: PreferencesOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<PreferencesProfile>({
    personal: {
      name: '',
      email: '',
      avatar: '',
      bio: ''
    },
    values: {
      coreValues: [],
      workLifeBalance: '',
      riskTolerance: '',
      growthMindset: '',
      ethicalPriorities: [],
      culturalFit: []
    },
    goals: {
      shortTermGoals: [],
      longTermGoals: [],
      careerGoals: [],
      personalGoals: [],
      businessGoals: [],
      financialGoals: [],
      timeline: '',
      milestones: []
    },
    preferences: {
      workEnvironment: [],
      teamSize: '',
      companyStage: [],
      industry: [],
      location: [],
      remoteWork: '',
      workStyle: '',
      communicationStyle: '',
      decisionMaking: '',
      leadership: '',
      collaboration: ''
    },
    dealbreakers: {
      redFlags: [],
      nonNegotiables: [],
      warningSigns: [],
      concerns: []
    },
    compatibility: {
      personalityTypes: [],
      communicationStyles: [],
      workingStyles: [],
      conflictResolution: [],
      feedbackStyle: [],
      motivation: []
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const onboardingSteps = [
    {
      id: 'values',
      title: 'Core Values',
      description: 'What matters most to you',
      icon: <Heart className="w-5 h-5" />,
      progress: 20
    },
    {
      id: 'goals',
      title: 'Goals & Aspirations',
      description: 'What you want to achieve',
      icon: <Target className="w-5 h-5" />,
      progress: 40
    },
    {
      id: 'preferences',
      title: 'Work Preferences',
      description: 'Your ideal work environment',
      icon: <Settings className="w-5 h-5" />,
      progress: 60
    },
    {
      id: 'dealbreakers',
      title: 'Dealbreakers',
      description: 'What you won\'t compromise on',
      icon: <FlagIcon className="w-5 h-5" />,
      progress: 80
    },
    {
      id: 'compatibility',
      title: 'Compatibility Factors',
      description: 'How you work with others',
      icon: <Users2 className="w-5 h-5" />,
      progress: 100
    }
  ];

  const coreValuesList = [
    'Innovation', 'Integrity', 'Excellence', 'Collaboration', 'Transparency',
    'Accountability', 'Customer Focus', 'Growth Mindset', 'Work-Life Balance',
    'Sustainability', 'Social Impact', 'Ethical Business', 'Diversity', 'Inclusion',
    'Efficiency', 'Quality', 'Speed', 'Creativity', 'Discipline', 'Flexibility'
  ];

  const ethicalPriorities = [
    'Environmental Responsibility', 'Social Justice', 'Data Privacy', 'Fair Labor',
    'Community Impact', 'Ethical AI', 'Sustainable Practices', 'Transparency',
    'Accountability', 'Inclusive Culture', 'Fair Competition', 'Ethical Sourcing'
  ];

  const workLifeBalanceOptions = [
    'Full focus on work', 'Work-life integration', 'Clear boundaries', 'Flexible hours',
    'Remote-first', 'Office-based', 'Hybrid model', 'Seasonal intensity'
  ];

  const riskToleranceOptions = [
    'Very conservative', 'Conservative', 'Moderate', 'Moderate-high', 'High', 'Very high'
  ];

  const growthMindsetOptions = [
    'Fixed mindset', 'Growth mindset', 'Learning mindset', 'Innovative mindset',
    'Experimental mindset', 'Strategic mindset', 'Execution mindset'
  ];

  const shortTermGoals = [
    'Find co-founder', 'Build MVP', 'Get first customers', 'Secure funding',
    'Hire key team', 'Launch product', 'Achieve product-market fit', 'Scale operations'
  ];

  const longTermGoals = [
    'Build unicorn company', 'Achieve IPO', 'Create industry impact', 'Build lasting legacy',
    'Financial independence', 'Global expansion', 'Multiple successful exits', 'Industry leadership'
  ];

  const careerGoals = [
    'CEO/Founder', 'CTO/Technical Leader', 'CPO/Product Leader', 'CMO/Marketing Leader',
    'Industry expert', 'Thought leader', 'Angel investor', 'Board member'
  ];

  const workEnvironments = [
    'Fast-paced startup', 'Established company', 'Remote-first', 'Hybrid',
    'Innovation lab', 'Corporate innovation', 'Non-profit', 'Government',
    'Consulting', 'Freelance', 'Agency', 'Education'
  ];

  const teamSizes = [
    'Solo', '2-5 people', '6-20 people', '21-50 people', '51-200 people',
    '201-500 people', '500+ people', 'Enterprise'
  ];

  const companyStages = [
    'Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth stage',
    'Mature', 'Public company', 'Non-profit', 'Government'
  ];

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 
    'Manufacturing', 'Real Estate', 'Transportation', 'Energy', 'Agriculture',
    'Media & Entertainment', 'Travel & Hospitality', 'Non-profit', 'Government', 'Other'
  ];

  const locationPreferences = [
    'Local (same city)', 'Remote (anywhere)', 'Hybrid', 'Specific country',
    'Specific region', 'Willing to relocate', 'No preference'
  ];

  const remoteWorkPreferences = [
    'Fully remote', 'Hybrid', 'Office-based', 'Flexible', 'Project-based remote',
    'Seasonal remote', 'Co-working spaces', 'Home office', 'Office optional'
  ];

  const workStyles = [
    'Autonomous', 'Collaborative', 'Structured', 'Flexible', 'Fast-paced',
    'Methodical', 'Creative', 'Analytical', 'Hands-on', 'Strategic'
  ];

  const communicationStyles = [
    'Direct', 'Diplomatic', 'Formal', 'Casual', 'Data-driven', 'Storytelling',
    'Visual', 'Written', 'Verbal', 'Technical', 'Simplified', 'Detailed'
  ];

  const decisionMakingStyles = [
    'Data-driven', 'Intuitive', 'Collaborative', 'Autonomous', 'Risk-averse',
    'Risk-tolerant', 'Quick', 'Deliberate', 'Consensus', 'Authoritative'
  ];

  const leadershipStyles = [
    'Visionary', 'Servant', 'Transformational', 'Transactional', 'Democratic',
    'Autocratic', 'Laissez-faire', 'Situational', 'Coach', 'Mentor'
  ];

  const collaborationStyles = [
    'Leader', 'Supporter', 'Integrator', 'Innovator', 'Executor', 'Analyst',
    'Facilitator', 'Coordinator', 'Specialist', 'Generalist'
  ];

  const redFlags = [
    'Lack of transparency', 'Poor communication', 'Ethical concerns',
    'Micromanagement', 'Toxic culture', 'No work-life balance',
    'Unclear expectations', 'Poor compensation', 'Limited growth',
    'High turnover', 'Legal issues', 'Financial instability'
  ];

  const nonNegotiables = [
    'Equity ownership', 'Decision-making authority', 'Work-life boundaries',
    'Ethical standards', 'Compensation minimum', 'Growth opportunities',
    'Company culture fit', 'Location flexibility', 'Remote work option',
    'Team composition', 'Product vision alignment', 'Values alignment'
  ];

  const warningSigns = [
    'Vague job description', 'High turnover rate', 'Negative reviews',
    'Unclear funding status', 'No clear business model', 'Too good to be true',
    'Pressure to decide quickly', 'No written agreement', 'Unrealistic expectations',
    'Lack of references', 'Poor communication during interviews'
  ];

  const personalityTypes = [
    'Analytical', 'Creative', 'Driver', 'Amiable', 'Introverted', 'Extroverted',
    'Thinker', 'Feeler', 'Judger', 'Perceiver', 'Sensing', 'Intuitive'
  ];

  const conflictResolutionStyles = [
    'Collaborative', 'Competitive', 'Accommodating', 'Avoiding', 'Compromising',
    'Direct confrontation', 'Mediated', 'Written communication', 'Third-party help'
  ];

  const feedbackStyles = [
    'Direct and honest', 'Diplomatic and gentle', 'Data-driven', 'Story-based',
    'Immediate', 'Scheduled', 'Public', 'Private', 'Formal', 'Informal'
  ];

  const motivationTypes = [
    'Intrinsic', 'Extrinsic', 'Achievement-oriented', 'Relationship-oriented',
    'Power-oriented', 'Security-oriented', 'Growth-oriented', 'Recognition-oriented'
  ];

  useEffect(() => {
    if (initialData) {
      setProfile(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const validateStep = (stepId: string): boolean => {
    const errors: Record<string, string> = {};

    switch (stepId) {
      case 'values':
        if (profile.values.coreValues.length === 0) {
          errors.coreValues = 'Select at least one core value';
        }
        if (!profile.values.workLifeBalance) {
          errors.workLifeBalance = 'Work-life balance preference is required';
        }
        if (!profile.values.riskTolerance) {
          errors.riskTolerance = 'Risk tolerance level is required';
        }
        break;
      case 'goals':
        if (profile.goals.shortTermGoals.length === 0 && 
            profile.goals.longTermGoals.length === 0) {
          errors.goals = 'Select at least one goal';
        }
        break;
      case 'preferences':
        if (profile.preferences.workEnvironment.length === 0) {
          errors.workEnvironment = 'Select at least one work environment';
        }
        if (!profile.preferences.teamSize) {
          errors.teamSize = 'Team size preference is required';
        }
        break;
      case 'dealbreakers':
        if (profile.dealbreakers.nonNegotiables.length === 0) {
          errors.nonNegotiables = 'Select at least one non-negotiable';
        }
        break;
      case 'compatibility':
        if (profile.compatibility.personalityTypes.length === 0) {
          errors.personalityTypes = 'Select at least one personality type';
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
        description: "Your preferences profile has been saved successfully."
      });
    }, 1000);
  };

  const handleValueToggle = (category: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [category]: prev.values[category as keyof typeof prev.values].includes(value)
          ? prev.values[category as keyof typeof prev.values].filter(v => v !== value)
          : [...prev.values[category as keyof typeof prev.values], value]
      }
    }));
  };

  const handleGoalToggle = (category: string, goal: string) => {
    setProfile(prev => ({
      ...prev,
      goals: {
        ...prev.goals,
        [category]: prev.goals[category as keyof typeof prev.goals].includes(goal)
          ? prev.goals[category as keyof typeof prev.goals].filter(g => g !== goal)
          : [...prev.goals[category as keyof typeof prev.goals], goal]
      }
    }));
  };

  const handlePreferenceToggle = (category: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [category]: prev.preferences[category as keyof typeof prev.preferences].includes(value)
          ? prev.preferences[category as keyof typeof prev.preferences].filter(v => v !== value)
          : [...prev.preferences[category as keyof typeof prev.preferences], value]
      }
    }));
  };

  const handleDealbreakerToggle = (category: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      dealbreakers: {
        ...prev.dealbreakers,
        [category]: prev.dealbreakers[category as keyof typeof prev.dealbreakers].includes(value)
          ? prev.dealbreakers[category as keyof typeof prev.dealbreakers].filter(v => v !== value)
          : [...prev.dealbreakers[category as keyof typeof prev.dealbreakers], value]
      }
    }));
  };

  const handleCompatibilityToggle = (category: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      compatibility: {
        ...prev.compatibility,
        [category]: prev.compatibility[category as keyof typeof prev.compatibility].includes(value)
          ? prev.compatibility[category as keyof typeof prev.compatibility].filter(v => v !== value)
          : [...prev.compatibility[category as keyof typeof prev.compatibility], value]
      }
    }));
  };

  const renderStepContent = () => {
    const currentStepData = onboardingSteps[currentStep];

    switch (currentStepData.id) {
      case 'values':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Core Values</h2>
              <p className="text-muted-foreground">What matters most to you in work and life?</p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Core Values *</h3>
                <div className="flex flex-wrap gap-2">
                  {coreValuesList.map(value => (
                    <Badge
                      key={value}
                      variant={profile.values.coreValues.includes(value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleValueToggle('coreValues', value)}
                    >
                      {value}
                    </Badge>
                  ))}
                </div>
                {validationErrors.coreValues && (
                  <p className="text-sm text-red-500">{validationErrors.coreValues}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Work-Life Balance *</label>
                  <Select
                    value={profile.values.workLifeBalance}
                    onValueChange={(value) => setProfile(prev => ({
                      ...prev,
                      values: { ...prev.values, workLifeBalance: value }
                    }))}
                  >
                    <SelectTrigger className={validationErrors.workLifeBalance ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select work-life balance" />
                    </SelectTrigger>
                    <SelectContent>
                      {workLifeBalanceOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.workLifeBalance && (
                    <p className="text-sm text-red-500">{validationErrors.workLifeBalance}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Risk Tolerance *</label>
                  <Select
                    value={profile.values.riskTolerance}
                    onValueChange={(value) => setProfile(prev => ({
                      ...prev,
                      values: { ...prev.values, riskTolerance: value }
                    }))}
                  >
                    <SelectTrigger className={validationErrors.riskTolerance ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select risk tolerance" />
                    </SelectTrigger>
                    <SelectContent>
                      {riskToleranceOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.riskTolerance && (
                    <p className="text-sm text-red-500">{validationErrors.riskTolerance}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Growth Mindset</label>
                  <Select
                    value={profile.values.growthMindset}
                    onValueChange={(value) => setProfile(prev => ({
                      ...prev,
                      values: { ...prev.values, growthMindset: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select growth mindset" />
                    </SelectTrigger>
                    <SelectContent>
                      {growthMindsetOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Ethical Priorities</label>
                  <div className="flex flex-wrap gap-2">
                    {ethicalPriorities.map(priority => (
                      <Badge
                        key={priority}
                        variant={profile.values.ethicalPriorities.includes(priority) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleValueToggle('ethicalPriorities', priority)}
                      >
                        {priority}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Cultural Fit Preferences</label>
                <div className="flex flex-wrap gap-2">
                  {['Innovation-driven', 'Results-oriented', 'People-first', 'Process-driven', 'Customer-obsessed', 'Data-driven'].map(culture => (
                    <Badge
                      key={culture}
                      variant={profile.values.culturalFit.includes(culture) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleValueToggle('culturalFit', culture)}
                    >
                      {culture}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Goals & Aspirations</h2>
              <p className="text-muted-foreground">What do you want to achieve in your career and life?</p>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Short-term Goals (1-2 years)</h3>
                  <div className="flex flex-wrap gap-2">
                    {shortTermGoals.map(goal => (
                      <Badge
                        key={goal}
                        variant={profile.goals.shortTermGoals.includes(goal) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleGoalToggle('shortTermGoals', goal)}
                      >
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Long-term Goals (5+ years)</h3>
                  <div className="flex flex-wrap gap-2">
                    {longTermGoals.map(goal => (
                      <Badge
                        key={goal}
                        variant={profile.goals.longTermGoals.includes(goal) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleGoalToggle('longTermGoals', goal)}
                      >
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Career Goals</h3>
                  <div className="flex flex-wrap gap-2">
                    {careerGoals.map(goal => (
                      <Badge
                        key={goal}
                        variant={profile.goals.careerGoals.includes(goal) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleGoalToggle('careerGoals', goal)}
                      >
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Personal Goals</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Work-life balance', 'Financial freedom', 'Personal growth', 'Family time', 'Health & wellness', 'Travel', 'Learning', 'Community impact'].map(goal => (
                      <Badge
                        key={goal}
                        variant={profile.goals.personalGoals.includes(goal) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleGoalToggle('personalGoals', goal)}
                      >
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Business Goals</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Revenue growth', 'Market expansion', 'Product innovation', 'Team building', 'Customer satisfaction', 'Operational efficiency', 'Brand recognition', 'Industry leadership'].map(goal => (
                      <Badge
                        key={goal}
                        variant={profile.goals.businessGoals.includes(goal) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleGoalToggle('businessGoals', goal)}
                      >
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Financial Goals</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Financial independence', 'Early retirement', 'Wealth building', 'Passive income', 'High salary', 'Equity ownership', 'Business ownership', 'Investment portfolio'].map(goal => (
                      <Badge
                        key={goal}
                        variant={profile.goals.financialGoals.includes(goal) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleGoalToggle('financialGoals', goal)}
                      >
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Timeline</label>
                <Textarea
                  value={profile.goals.timeline}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    goals: { ...prev.goals, timeline: e.target.value }
                  }))}
                  placeholder="Describe your timeline for achieving these goals..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Key Milestones</label>
                <Textarea
                  value={profile.goals.milestones.join('\n')}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    goals: { 
                      ...prev.goals, 
                      milestones: e.target.value.split('\n').filter(s => s.trim())
                    }
                  }))}
                  placeholder="List key milestones you want to achieve..."
                  rows={3}
                />
              </div>

              {validationErrors.goals && (
                <p className="text-sm text-red-500">{validationErrors.goals}</p>
              )}
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Work Preferences</h2>
              <p className="text-muted-foreground">What does your ideal work environment look like?</p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Work Environment *</h3>
                <div className="flex flex-wrap gap-2">
                  {workEnvironments.map(env => (
                    <Badge
                      key={env}
                      variant={profile.preferences.workEnvironment.includes(env) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handlePreferenceToggle('workEnvironment', env)}
                    >
                      {env}
                    </Badge>
                  ))}
                </div>
                {validationErrors.workEnvironment && (
                  <p className="text-sm text-red-500">{validationErrors.workEnvironment}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Team Size *</label>
                  <Select
                    value={profile.preferences.teamSize}
                    onValueChange={(value) => setProfile(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, teamSize: value }
                    }))}
                  >
                    <SelectTrigger className={validationErrors.teamSize ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamSizes.map(size => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.teamSize && (
                    <p className="text-sm text-red-500">{validationErrors.teamSize}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Remote Work</label>
                  <Select
                    value={profile.preferences.remoteWork}
                    onValueChange={(value) => setProfile(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, remoteWork: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select remote work preference" />
                    </SelectTrigger>
                    <SelectContent>
                      {remoteWorkPreferences.map(preference => (
                        <SelectItem key={preference} value={preference}>{preference}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Company Stage</h3>
                  <div className="flex flex-wrap gap-2">
                    {companyStages.map(stage => (
                      <Badge
                        key={stage}
                        variant={profile.preferences.companyStage.includes(stage) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handlePreferenceToggle('companyStage', stage)}
                      >
                        {stage}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Industry</h3>
                  <div className="flex flex-wrap gap-2">
                    {industries.map(industry => (
                      <Badge
                        key={industry}
                        variant={profile.preferences.industry.includes(industry) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handlePreferenceToggle('industry', industry)}
                      >
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Location</h3>
                  <div className="flex flex-wrap gap-2">
                    {locationPreferences.map(location => (
                      <Badge
                        key={location}
                        variant={profile.preferences.location.includes(location) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handlePreferenceToggle('location', location)}
                      >
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Work Style</h3>
                  <div className="flex flex-wrap gap-2">
                    {workStyles.map(style => (
                      <Badge
                        key={style}
                        variant={profile.preferences.workStyle.includes(style) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handlePreferenceToggle('workStyle', style)}
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Communication Style</h3>
                  <div className="flex flex-wrap gap-2">
                    {communicationStyles.map(style => (
                      <Badge
                        key={style}
                        variant={profile.preferences.communicationStyle.includes(style) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handlePreferenceToggle('communicationStyle', style)}
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Decision Making</h3>
                  <div className="flex flex-wrap gap-2">
                    {decisionMakingStyles.map(style => (
                      <Badge
                        key={style}
                        variant={profile.preferences.decisionMaking.includes(style) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handlePreferenceToggle('decisionMaking', style)}
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Leadership Style</h3>
                  <div className="flex flex-wrap gap-2">
                    {leadershipStyles.map(style => (
                      <Badge
                        key={style}
                        variant={profile.preferences.leadership.includes(style) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handlePreferenceToggle('leadership', style)}
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Collaboration Style</h3>
                  <div className="flex flex-wrap gap-2">
                    {collaborationStyles.map(style => (
                      <Badge
                        key={style}
                        variant={profile.preferences.collaboration.includes(style) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handlePreferenceToggle('collaboration', style)}
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'dealbreakers':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Dealbreakers</h2>
              <p className="text-muted-foreground">What you absolutely won't compromise on</p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Red Flags</h3>
                <div className="flex flex-wrap gap-2">
                  {redFlags.map(flag => (
                    <Badge
                      key={flag}
                      variant={profile.dealbreakers.redFlags.includes(flag) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleDealbreakerToggle('redFlags', flag)}
                    >
                      {flag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Non-Negotiables *</h3>
                <div className="flex flex-wrap gap-2">
                  {nonNegotiables.map(item => (
                    <Badge
                      key={item}
                      variant={profile.dealbreakers.nonNegotiables.includes(item) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleDealbreakerToggle('nonNegotiables', item)}
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
                {validationErrors.nonNegotiables && (
                  <p className="text-sm text-red-500">{validationErrors.nonNegotiables}</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Warning Signs</h3>
                <div className="flex flex-wrap gap-2">
                  {warningSigns.map(sign => (
                    <Badge
                      key={sign}
                      variant={profile.dealbreakers.warningSigns.includes(sign) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleDealbreakerToggle('warningSigns', sign)}
                    >
                      {sign}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Other Concerns</label>
                <Textarea
                  value={profile.dealbreakers.concerns.join('\n')}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    dealbreakers: { 
                      ...prev.dealbreakers, 
                      concerns: e.target.value.split('\n').filter(s => s.trim())
                    }
                  }))}
                  placeholder="List any other concerns or dealbreakers..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 'compatibility':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Compatibility Factors</h2>
              <p className="text-muted-foreground">How you work best with others</p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Personality Types *</h3>
                <div className="flex flex-wrap gap-2">
                  {personalityTypes.map(type => (
                    <Badge
                      key={type}
                      variant={profile.compatibility.personalityTypes.includes(type) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleCompatibilityToggle('personalityTypes', type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
                {validationErrors.personalityTypes && (
                  <p className="text-sm text-red-500">{validationErrors.personalityTypes}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Communication Styles</h3>
                  <div className="flex flex-wrap gap-2">
                    {communicationStyles.map(style => (
                      <Badge
                        key={style}
                        variant={profile.compatibility.communicationStyles.includes(style) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleCompatibilityToggle('communicationStyles', style)}
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Working Styles</h3>
                  <div className="flex flex-wrap gap-2">
                    {workStyles.map(style => (
                      <Badge
                        key={style}
                        variant={profile.compatibility.workingStyles.includes(style) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleCompatibilityToggle('workingStyles', style)}
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Conflict Resolution</h3>
                  <div className="flex flex-wrap gap-2">
                    {conflictResolutionStyles.map(style => (
                      <Badge
                        key={style}
                        variant={profile.compatibility.conflictResolution.includes(style) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleCompatibilityToggle('conflictResolution', style)}
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Feedback Style</h3>
                  <div className="flex flex-wrap gap-2">
                    {feedbackStyles.map(style => (
                      <Badge
                        key={style}
                        variant={profile.compatibility.feedbackStyle.includes(style) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleCompatibilityToggle('feedbackStyle', style)}
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Motivation Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {motivationTypes.map(type => (
                      <Badge
                        key={type}
                        variant={profile.compatibility.motivation.includes(type) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleCompatibilityToggle('motivation', type)}
                      >
                        {type}
                      </Badge>
                    ))}
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Preferences & Values</h1>
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
                  description: "Your preferences have been saved."
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
