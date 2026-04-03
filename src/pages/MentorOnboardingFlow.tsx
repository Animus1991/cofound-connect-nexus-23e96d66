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
import { ScrollArea } from "@//components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GraduationCap,
  Star,
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
  VideoOff,
  VideoCamera,
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
  RepeatOne,
  Shuffle,
  Radio,
  RadioOff,
  Bell,
  BellOff,
  BellRing,
  BellRingOff,
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
  Clock12
  Timer,
  TimerReset,
  TimerOff,
  Stopwatch,
  StopwatchOff,
  AlarmClock,
  AlarmClockOff,
  Hourglass,
  HourglassEmpty,
  HourglassFull,
  TimerStart,
  TimerPause,
  TimerReset as TimerResetIcon,
  TimerEnd,
  TimerEnd as TimerEndIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MentorProfile {
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
    twitter?: string;
    title?: string;
    company?: string;
  };
  professional: {
    experience: string;
    industry: string[];
    expertise: string[];
    currentRole: string;
    previousRoles: string[];
    achievements: string[];
    education: string[];
    certifications: string[];
    publications?: string[];
    patents?: string[];
    speakingEngagements?: string[];
  };
  mentorship: {
    mentorshipStyle: string;
    areas: string[];
    experienceLevel: string;
    menteesCount: number;
    successStories: string[];
    mentorshipApproach: string;
    timeCommitment: string;
    compensation: string;
    availability: string;
  };
  skills: {
    technical: string[];
    business: string[];
    design: string[];
    industry: string[];
    soft: string[];
  };
  preferences: {
    menteeTypes: string[];
    industries: string[];
    stages: string[];
    commitmentLevels: string[];
    communicationMethods: string[];
    mentorshipFormat: string[];
    availability: string[];
    compensation: string[];
    values: string[];
  };
  availability: {
    hoursPerMonth: string;
    responseTime: string;
    flexibleSchedule: boolean;
    maxMentees: number;
    currentMentees: number;
    currentCommitments: string[];
    preferredDays: string[];
    preferredTimes: string[];
  };
  media: {
    avatar?: string;
    images: string[];
    videos: string[];
    documents: string[];
    presentations: string[];
    testimonials: string[];
  };
}

interface MentorOnboardingProps {
  onComplete: (profile: MentorProfile) => void;
  onSkip: () => void;
  initialData?: Partial<MentorProfile>;
}

export default function MentorOnboarding({ 
  onComplete, 
  onSkip, 
  initialData 
}: MentorOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<MentorProfile>({
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
      twitter: '',
      title: '',
      company: ''
    },
    professional: {
      experience: '',
      industry: [],
      expertise: [],
      currentRole: '',
      previousRoles: [],
      achievements: [],
      education: [],
      certifications: [],
      publications: [],
      patents: [],
      speakingEngagements: []
    },
    mentorship: {
      mentorshipStyle: '',
      areas: [],
      experienceLevel: '',
      menteesCount: 0,
      successStories: [],
      mentorshipApproach: '',
      timeCommitment: '',
      compensation: '',
      availability: ''
    },
    skills: {
      technical: [],
      business: [],
      design: [],
      industry: [],
      soft: []
    },
    preferences: {
      menteeTypes: [],
      industries: [],
      stages: [],
      commitmentLevels: [],
      communicationMethods: [],
      mentorshipFormat: [],
      availability: [],
      compensation: [],
      values: []
    },
    availability: {
      hoursPerMonth: "20",
      responseTime: '24-48 hours',
      flexibleSchedule: true,
      maxMentees: 5,
      currentMentees: 0,
      currentCommitments: [],
      preferredDays: ['Monday', 'Wednesday', 'Friday'],
      preferredTimes: ['10:00 AM - 12:00 PM', '2:00 PM - 4:00 PM', '6:00 PM - 8:00 PM']
    },
    media: {
      images: [],
      videos: [],
      documents: [],
      presentations: [],
      testimonials: []
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
      progress: 14
    },
    {
      id: 'professional',
      title: 'Professional Background',
      description: 'Your experience and expertise',
      icon: <Briefcase className="w-5 h-5" />,
      progress: 28
    },
    {
      id: 'skills',
      title: 'Skills & Expertise',
      description: 'What you bring to mentorship',
      icon: <Star className="w-5 h-5" />,
      progress: 42
    },
    {
      id: 'mentorship',
      title: 'Mentorship Approach',
      description: 'How you mentor and guide others',
      icon: <GraduationCap className="w-5 h-5" />,
      progress: 57
    },
    {
      id: 'preferences',
      title: 'Mentor Preferences',
      description: 'What you\'re looking for in mentees',
      icon: <Users className="w-5 h-5" />,
      progress: 71
    },
    {
      id: 'availability',
      title: 'Availability & Schedule',
      description: 'Your time and availability',
      icon: <Clock className="w-5 h-5" />,
      progress: 85
    },
    {
      id: 'media',
      title: 'Portfolio & Media',
      description: 'Showcase your expertise',
      icon: <Image className="w-5 h-5" />,
      progress: 100
    }
  ];

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 
    'Manufacturing', 'Real Estate', 'Transportation', 'Energy', 'Agriculture',
    'Media & Entertainment', 'Travel & Hospitality', 'Non-profit', 'Government', 'Consulting', 'Legal', 'Other'
  ];

  const experienceLevels = [
    'Early Career (0-5 years)', 'Mid Career (5-10 years)', 
    'Senior Level (10-15 years)', 'Executive Level (15+ years)', 'Retired Expert'
  ];

  const mentorshipStyles = [
    'Hands-on Guidance', 'Strategic Advisory', 'Career Coaching', 'Technical Mentorship',
    'Business Consulting', 'Industry Expertise', 'Startup Guidance', 'Skill Development'
  ];

  const mentorshipAreas = [
    'Product Management', 'Engineering Leadership', 'Business Strategy', 'Marketing & Growth',
    'Sales & Business Development', 'Fundraising & Investment', 'Operations & Scaling', 'Team Building',
    'Career Development', 'Leadership', 'Entrepreneurship', 'Innovation',
    'Design & UX', 'Data Science', 'AI & Machine Learning', 'Blockchain', 'Cybersecurity'
  ];

  const menteeTypes = [
    'Early-stage Founders', 'Growth-stage Founders', 'Technical Co-founders', 'Business Co-founders',
    'Design Co-founders', 'Product Managers', 'Engineers', 'Marketing Professionals',
    'Students', 'Career Changers', 'Executives', 'Team Leads'
  ];

  const startupStages = [
    { value: 'pre-seed', label: 'Pre-seed', description: 'Idea/early development' },
    { value: 'seed', label: 'Seed', description: 'Initial funding' },
    { value: 'series-a', label: 'Series A', description: 'Growth stage' },
    { value: 'series-b', label: 'Series B', description: 'Scaling stage' },
    { value: 'growth', label: 'Growth', description: 'Mature business' }
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

  const softSkills = [
    'Communication', 'Leadership', 'Problem Solving', 'Critical Thinking',
    'Empathy', 'Patience', 'Mentoring', 'Coaching', 'Facilitation',
    'Public Speaking', 'Writing', 'Presentation', 'Negotiation', 'Networking'
  ];

  const commitmentLevels = [
    '5-10 hours/month', '10-20 hours/month', '20-40 hours/month',
    '40+ hours/month', 'Flexible/As needed'
  ];

  const communicationMethods = [
    'Video Calls', 'Phone Calls', 'Email', 'Messaging Apps', 'In-person Meetings',
    'Slack/Discord', 'Zoom', 'Google Meet', 'Microsoft Teams'
  ];

  const mentorshipFormats = [
    'One-on-One Sessions', 'Group Mentorship', 'Office Hours', 'Workshops',
    'Mastermind Groups', 'Advisory Board', 'Guest Lectures', 'Panel Discussions'
  ];

  const coreValues = [
    'Empowerment', 'Growth Mindset', 'Integrity', 'Accountability',
    'Collaboration', 'Innovation', 'Excellence', 'Diversity',
    'Sustainability', 'Social Impact', 'Ethical Leadership'
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
        if (!profile.personal.title.trim()) errors.title = 'Professional title is required';
        break;
      case 'professional':
        if (!profile.professional.experience) errors.experience = 'Experience level is required';
        if (profile.professional.industry.length === 0) errors.industry = 'At least one industry is required';
        if (!profile.professional.currentRole.trim()) errors.currentRole = 'Current role is required';
        break;
      case 'skills':
        if (profile.skills.technical.length === 0 && 
            profile.skills.business.length === 0 && 
            profile.skills.design.length === 0 && 
            profile.skills.industry.length === 0 && 
            profile.skills.soft.length === 0) {
          errors.skills = 'At least one skill is required';
        }
        break;
      case 'mentorship':
        if (!profile.mentorship.mentorshipStyle) errors.mentorshipStyle = 'Mentorship style is required';
        if (profile.mentorship.areas.length === 0) errors.areas = 'At least one mentorship area is required';
        if (!profile.mentorship.experienceLevel) errors.experienceLevel = 'Experience level is required';
        break;
      case 'preferences':
        if (profile.preferences.menteeTypes.length === 0) {
          errors.menteeTypes = 'Select at least one mentee type';
        }
        if (profile.preferences.commitmentLevels.length === 0) {
          errors.commitmentLevels = 'Select at least one commitment level';
        }
        break;
      case 'availability':
        if (parseInt(profile.availability.hoursPerMonth) < 5) {
          errors.hoursPerMonth = 'Must be available at least 5 hours per month';
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
        description: "Your mentor profile has been saved successfully."
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

  const handleIndustryToggle = (industry: string) => {
    setProfile(prev => ({
      ...prev,
      professional: {
        ...prev.professional,
        industry: prev.professional.industry.includes(industry)
          ? prev.professional.industry.filter(i => i !== industry)
          : [...prev.professional.industry, industry]
      }
    }));
  };

  const handleExpertiseToggle = (expertise: string) => {
    setProfile(prev => ({
      ...prev,
      professional: {
        ...prev.professional,
        expertise: prev.professional.expertise.includes(expertise)
          ? prev.professional.expertise.filter(e => e !== expertise)
          : [...prev.professional.expertise, expertise]
      }
    }));
  };

  const handleMenteeTypeToggle = (type: string) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        menteeTypes: prev.preferences.menteeTypes.includes(type)
          ? prev.preferences.menteeTypes.filter(t => t !== type)
          : [...prev.preferences.menteeTypes, type]
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
            <p className="text-muted-foreground">Tell us about yourself to help potential mentees get to know you</p>
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
                <label className="text-sm font-medium mb-1 block">Professional Title *</label>
                <Input
                  value={profile.personal.title}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    personal: { ...prev.personal, title: e.target.value }
                  }))}
                  placeholder="e.g., Senior Software Engineer, VP of Product"
                  className={validationErrors.title ? 'border-red-500' : ''}
                />
                {validationErrors.title && (
                  <p className="text-sm text-red-500">{validationErrors.title}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Company</label>
                <Input
                  value={profile.personal.company}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    personal: { ...prev.personal, company: e.target.value }
                  }))}
                  placeholder="Current company or organization"
                />
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
                  placeholder="Tell us about yourself, your background, and what drives you as a mentor..."
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
                    value={profile.personal.linkedin}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      personal: { ...prev.personal, linkedin: e.target.value }
                    }))}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Website</label>
                  <Input
                    value={profile.personal.website}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      personal: { ...prev.personal, website: e.target.value }
                    }))}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Portfolio</label>
                  <Input
                    value={profile.personal.portfolio}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      personal: { ...prev.personal, portfolio: e.target.value }
                    }))}
                    placeholder="Link to your portfolio"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Twitter</label>
                  <Input
                    value={profile.personal.twitter}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      personal: { ...prev.personal, twitter: e.target.value }
                    }))}
                    placeholder="@yourhandle"
                  />
                </div>
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
        );

      case 'professional':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Professional Background</h2>
              <p className="text-muted-foreground">Share your experience and professional expertise</p>
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
                  <label className="text-sm font-medium mb-1 block">Industries *</label>
                  <div className="flex flex-wrap gap-2">
                    {industries.map(industry => (
                      <Badge
                        key={industry}
                        variant={profile.professional.industry.includes(industry) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleIndustryToggle(industry)}
                      >
                        {industry}
                      </Badge>
                    ))}
                  </div>
                  {validationErrors.industry && (
                    <p className="text-sm text-red-500">{validationErrors.industry}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Current Role *</label>
                  <Input
                    value={profile.professional.currentRole}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      professional: { ...prev.professional, currentRole: e.target.value }
                    }))}
                    placeholder="e.g., Senior Software Engineer, VP of Product"
                    className={validationErrors.currentRole ? 'border-red-500' : ''}
                  />
                  {validationErrors.currentRole && (
                    <p className="text-sm text-red-500">{validationErrors.currentRole}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Expertise Areas</label>
                  <div className="flex flex-wrap gap-2">
                    {mentorshipAreas.map(area => (
                      <Badge
                        key={area}
                        variant={profile.professional.expertise.includes(area) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleExpertiseToggle(area)}
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Previous Roles</label>
                  <Textarea
                    value={profile.professional.previousRoles.join('\n')}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      professional: { 
                        ...prev.professional, 
                        previousRoles: e.target.value.split('\n').filter(s => s.trim())
                      }
                    }))}
                    placeholder="List your previous roles..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Key Achievements</label>
                  <Textarea
                    value={profile.professional.achievements?.join('\n')}
                    onChange={(e) => setProfile(prev => ({
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
                    value={profile.professional.education?.join('\n')}
                    onChange={(e) => setProfile(prev => ({
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
                    value={profile.professional.certifications?.join('\n')}
                    onChange={(e) => setProfile(prev => ({
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

                <div>
                  <label className="text-sm font-medium mb-1 block">Publications</label>
                  <Textarea
                    value={profile.professional.publications?.join('\n')}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      professional: { 
                        ...prev.professional, 
                        publications: e.target.value.split('\n').filter(s => s.trim())
                      }
                    }))}
                    placeholder="List your publications..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Patents</label>
                  <Textarea
                    value={profile.professional.patents?.join('\n')}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      professional: { 
                        ...prev.professional, 
                        patents: e.target.value.split('\n').filter(s => s.trim())
                      }
                    }))}
                    placeholder="List your patents..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Speaking Engagements</label>
                  <Textarea
                    value={profile.professional.speakingEngagements?.join('\n')}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      professional: { 
                        ...prev.professional, 
                        speakingEngagements: e.target.value.split('\n').filter(s => s.trim())
                      }
                    }))}
                    placeholder="List your speaking engagements..."
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
              <p className="text-muted-foreground">What skills and expertise do you bring to mentorship?</p>
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
                <h3 className="text-lg font-semibold mb-4">Industry Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {industries.map(industry => (
                    <Badge
                      key={industry}
                      variant={profile.skills.industry.includes(industry) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleSkillToggle('industry', industry)}
                    >
                      {industry}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Soft Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {softSkills.map(skill => (
                    <Badge
                      key={skill}
                      variant={profile.skills.soft.includes(skill) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleSkillToggle('soft', skill)}
                    >
                      {skill}
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

      case 'mentorship':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Mentorship Approach</h2>
              <p className="text-muted-foreground">How you mentor and guide others to success</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-1 block">Mentorship Style *</label>
                <Select
                  value={profile.mentorship.mentorshipStyle}
                  onValueChange={(value) => setProfile(prev => ({
                    ...prev,
                    mentorship: { ...prev.mentorship, mentorshipStyle: value }
                  }))}
                >
                  <SelectTrigger className={validationErrors.mentorshipStyle ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select your mentorship style" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentorshipStyles.map(style => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.mentorshipStyle && (
                  <p className="text-sm text-red-500">{validationErrors.mentorshipStyle}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Mentorship Areas *</label>
                <div className="flex flex-wrap gap-2">
                  {mentorshipAreas.map(area => (
                    <Badge
                      key={area}
                      variant={profile.mentorship.areas.includes(area) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setProfile(prev => ({
                          ...prev,
                          mentorship: {
                            ...prev.mentorship,
                            areas: prev.mentorship.areas.includes(area)
                              ? prev.mentorship.areas.filter(a => a !== area)
                              : [...prev.mentorship.areas, area]
                          }
                        }));
                      }}
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
                {validationErrors.areas && (
                  <p className="text-sm text-red-500">{validationErrors.areas}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Experience Level *</label>
                <Select
                  value={profile.mentorship.experienceLevel}
                  onValueChange={(value) => setProfile(prev => ({
                    ...prev,
                    mentorship: { ...prev.mentorship, experienceLevel: value }
                  }))}
                >
                  <SelectTrigger className={validationErrors.experienceLevel ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.experienceLevel && (
                  <p className="text-sm text-red-500">{validationErrors.experienceLevel}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Mentees Count</label>
                  <Input
                    type="number"
                    value={profile.mentorship.menteesCount}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      mentorship: { ...prev.mentorship, menteesCount: parseInt(e.target.value) || 0 }
                    }))}
                    placeholder="Number of mentees"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Time Commitment</label>
                  <Select
                    value={profile.mentorship.timeCommitment}
                    onValueChange={(value) => setProfile(prev => ({
                      ...prev,
                      mentorship: { ...prev.mentorship, timeCommitment: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time commitment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5-10 hours/month">5-10 hours/month</SelectItem>
                      <SelectItem value="10-20 hours/month">10-20 hours/month</SelectItem>
                      <SelectItem value="20-40 hours/month">20-40 hours/month</SelectItem>
                      <SelectItem value="40+ hours/month">40+ hours/month</SelectItem>
                      <SelectItem value="Flexible/As needed">Flexible/As needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Compensation</label>
                  <Select
                    value={profile.mentorship.compensation}
                    onValueChange={(value) => setProfile(prev => ({
                      ...prev,
                      mentorship: { ...prev.mentorship, compensation: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select compensation preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Volunteer">Volunteer</SelectItem>
                      <SelectItem value="Equity">Equity-based</SelectItem>
                      <SelectItem value="Hourly Rate">Hourly Rate</SelectItem>
                      <SelectItem value="Monthly Retainer">Monthly Retainer</SelectItem>
                      <SelectItem value="Project-based">Project-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Availability</label>
                  <Select
                    value={profile.mentorship.availability}
                    onValueChange={(value) => setProfile(prev => ({
                      ...prev,
                      mentorship: { ...prev.mentorship, availability: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Immediate">Immediate availability</SelectItem>
                      <SelectItem value="1-2 weeks">1-2 weeks notice</SelectItem>
                      <SelectItem value="1 month">1 month notice</SelectItem>
                      <SelectItem value="Flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Success Stories</label>
                <Textarea
                  value={profile.mentorship.successStories.join('\n')}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    mentorship: { 
                      ...prev.mentorship, 
                      successStories: e.target.value.split('\n').filter(s => s.trim())
                    }
                  }))}
                  placeholder="Share your mentorship success stories..."
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Mentorship Approach</label>
                <Textarea
                  value={profile.mentorship.mentorshipApproach}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    mentorship: { ...prev.mentorship, mentorshipApproach: e.target.value }
                  }))}
                  placeholder="Describe your approach to mentoring and guiding others..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Mentor Preferences</h2>
              <p className="text-muted-foreground">What you're looking for in mentees and mentorship relationships</p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Mentee Types *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {menteeTypes.map(type => (
                    <label
                      key={type}
                      className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={profile.preferences.menteeTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setProfile(prev => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                menteeTypes: [...prev.preferences.menteeTypes, type]
                              }
                            }));
                          } else {
                            setProfile(prev => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                menteeTypes: prev.preferences.menteeTypes.filter(t => t !== type)
                              }
                            }));
                          }
                        }}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
                {validationErrors.menteeTypes && (
                  <p className="text-sm text-red-500">{validationErrors.menteeTypes}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Industries *</h3>
                  <div className="flex flex-wrap gap-2">
                    {industries.map(industry => (
                      <Badge
                        key={industry}
                        variant={profile.preferences.industries.includes(industry) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setProfile(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              industries: prev.preferences.industries.includes(industry)
                                ? prev.preferences.industries.filter(i => i !== industry)
                                : [...prev.preferences.industries, industry]
                            }
                          }));
                        }}
                      >
                        {industry}
                      </Badge>
                    ))}
                  </div>
                  {validationErrors.industries && (
                    <p className="text style="color: red; font-size: 0.875rem; line-height: 1.25rem; margin-top: 0.25rem;">{validationErrors.industries}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Startup Stages *</h3>
                  <div className="flex flex-wrap gap-2">
                    {startupStages.map(stage => (
                      <Badge
                        key={stage.value}
                        variant={profile.preferences.stages.includes(stage.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setProfile(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              stages: prev.preferences.stages.includes(stage.value)
                                ? prev.preferences.stages.filter(s => s !== stage.value)
                                : [...prev.preferences.stages, stage.value]
                            }
                          }));
                        }}
                      >
                        <div>
                          <div className="font-medium">{stage.label}</div>
                          <div className="text-xs text-muted-foreground">{stage.description}</div>
                        </div>
                      </Badge>
                    ))}
                  </div>
                  {validationErrors.stages && (
                    <p className="text-sm text-red-500">{validationErrors.stages}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Commitment Levels *</h3>
                  <div className="flex flex-wrap gap-2">
                    {commitmentLevels.map(level => (
                      <Badge
                        key={level}
                        variant={profile.preferences.commitmentLevels.includes(level) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setProfile(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              commitmentLevels: prev.preferences.commitmentLevels.includes(level)
                                ? prev.preferences.commitmentLevels.filter(l => l !== level)
                                : [...prev.preferences.commitmentLevels, level]
                            }
                          }));
                        }}
                      >
                        {level}
                      </Badge>
                    ))}
                  </div>
                  {validationErrors.commitmentLevels && (
                    <p className="text-sm text-red-500">{validationErrors.commitmentLevels}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Communication Methods *</h3>
                  <div className="flex flex-wrap gap-2">
                    {communicationMethods.map(method => (
                      <Badge
                        key={method}
                        variant={profile.preferences.communicationMethods.includes(method) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setProfile(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              communicationMethods: prev.preferences.communicationMethods.includes(method)
                                ? prev.preferences.communicationMethods.filter(m => m !== method)
                                : [...prev.preferences.communicationMethods, method]
                            }
                          }));
                        }}
                      >
                        {method}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Mentorship Format *</h3>
                  <div className="flex flex-wrap gap-2">
                    {mentorshipFormats.map(format => (
                      <Badge
                        key={format}
                        variant={profile.preferences.mentorshipFormat.includes(format) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setProfile(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              mentorshipFormat: prev.preferences.mentorshipFormat.includes(format)
                                ? prev.preferences.mentorshipFormat.filter(f => f !== format)
                                : [...prev.preferences.mentorshipFormat, format]
                            }
                          }));
                        }}
                      >
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Availability *</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Immediate', '1-2 weeks', '1 month', 'Flexible'].map(availability => (
                      <Badge
                        key={availability}
                        variant={profile.preferences.availability.includes(availability) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setProfile(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              availability: prev.preferences.availability.includes(availability)
                                ? prev.preferences.availability.filter(a => a !== availability)
                                : [...prev.preferences.availability, availability]
                            }
                          }));
                        }}
                      >
                        {availability}
                      </Badge>
                    ))}
                  </div>
                  {validationErrors.availability && (
                    <p className="text-sm text-red-500">{validationErrors.availability}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Compensation *</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Volunteer', 'Equity-based', 'Hourly Rate', 'Monthly Retainer', 'Project-based'].map(compensation => (
                      <Badge
                        key={compensation}
                        variant={profile.preferences.compensation.includes(compensation) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setProfile(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              compensation: prev.preferences.compensation.includes(compensation)
                                ? prev.preferences.compensation.filter(c => c !== compensation)
                                : [...prev.preferences.compensation, compensation]
                            }
                          }));
                        }}
                      >
                        {compensation}
                      </Badge>
                    ))}
                  </div>
                  {validationErrors.compensation && (
                    <p className="text-sm text-red-500">{validationErrors.compensation}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Core Values</h3>
                  <div className="flex flex-wrap gap-2">
                    {coreValues.map(value => (
                      <Badge
                        key={value}
                        variant={profile.preferences.values.includes(value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setProfile(prev => ({
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
              </div>
            </div>
          </div>
        );

      case 'availability':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Availability & Schedule</h2>
              <p className="text-muted-foreground">Your time availability and scheduling preferences</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium mb-1 block">Hours Per Month *</label>
                <div className="flex items-center space-x-4">
                  <Input
                    type="range"
                    min="5"
                    max="80"
                    value={profile.availability.hoursPerMonth}
                    onChange={(e) => setProfile(prev => ({
                    ...prev,
                    availability: { ...prev.availability, hoursPerMonth: e.target.value }
                  }))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-16">
                    {profile.availability.hoursPerMonth} hours/month
                  </span>
                </div>
                {validationErrors.hoursPerMonth && (
                  <p className="text-sm text-red-500">{validationErrors.hoursPerMonth}</p>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium mb-1 block">Response Time *</label>
                <Select
                  value={profile.availability.responseTime}
                  onValueChange={(value) => setProfile(prev => ({
                    ...prev,
                    availability: { ...prev.availability, responseTime: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select response time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Within 24 hours">Within 24 hours</SelectItem>
                    <SelectItem value="24-48 hours">24-48 hours</SelectItem>
                    <SelectItem value="3-5 days">3-5 days</SelectItem>
                    <SelectItem value="1 week">1 week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium mb-1 block">Max Mentees *</label>
                <Input
                  type="number"
                  value={profile.availability.maxMentees}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    availability: { ...prev.availability, maxMentees: parseInt(e.target.value) || 5 }
                  }))}
                  placeholder="Maximum concurrent mentees"
                />
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="flexibleSchedule"
                  checked={profile.availability.flexibleSchedule}
                  onCheckedChange={(checked) => setProfile(prev => ({
                    ...prev,
                    availability: { ...prev.availability, flexibleSchedule: checked }
                  }))}
                />
                <label htmlFor="flexibleSchedule" className="text-sm font-medium">
                  Flexible schedule preferred
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium mb-1 block">Current Mentees</label>
                <span className="text-sm font-medium">{profile.availability.currentMentees}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Preferred Days</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <Badge
                        key={day}
                        variant={profile.availability.preferredDays.includes(day) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setProfile(prev => ({
                            ...prev,
                            availability: {
                              ...prev.availability,
                              preferredDays: prev.availability.preferredDays.includes(day)
                                ? prev.availability.preferredDays.filter(d => d !== day)
                                : [...prev.availability.preferredDays, day]
                            }
                          }));
                        }}
                      >
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Preferred Times</h3>
                  <div className="space-y-2">
                    {profile.availability.preferredTimes.map((time, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          checked={profile.availability.preferredTimes.includes(time)}
                          onCheckedChange={(checked) => {
                            setProfile(prev => ({
                              ...prev,
                              availability: {
                                ...prev.availability,
                                preferredTimes: prev.availability.preferredTimes.includes(time)
                                  ? prev.availability.preferredTimes.filter(t => t !== time)
                                  : [...prev.availability.preferredTimes, time]
                              }
                            }));
                          }}
                        />
                        <span className="text-sm">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Current Commitments</label>
                <Textarea
                  value={profile.availability.currentCommitments.join('\n')}
                  onChange={(e) => setProfile(prev => ({
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
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Portfolio & Media</h2>
              <p className="text-muted-foreground">Showcase your expertise and build credibility</p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload your professional photo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Testimonials</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>{`M${i}`}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">Mentee {i}</h4>
                          <p className="text-sm text-muted-foreground">Startup Founder</p>
                          <p className="text-xs text-muted-foreground">Mentored by {i} months ago</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-italic">
                      "Mentor was instrumental in helping us refine our product strategy and secure our first round of funding. Their guidance was invaluable and we're now on track for Series A."
                    </p>
                  </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Media Gallery</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                      <Image className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Media {i}</p>
                    </div>
                  ))}
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
                    <p className="text-sm text-muted-foreground">Certifications</p>
                  </div>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <FileText className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Speaking Materials</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Presentations</h3>
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <FileText className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Workshop Materials</p>
                  </div>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <FileText className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Case Studies</p>
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
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Mentor Onboarding</h1>
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
    </div>
  );
}
