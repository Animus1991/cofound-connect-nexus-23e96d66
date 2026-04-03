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
  Code,
  Palette,
  Briefcase,
  BarChart3,
  Megaphone,
  Users,
  Target,
  Lightbulb,
  Rocket,
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
  Bell,
  BellOff,
  BellRing,
  Calendar,
  CalendarCheck,
  CalendarX,
  Clock,
  Timer,
  TimerReset,
  TimerOff,
  Stopwatch,
  AlarmClock,
  AlarmClockOff,
  Hourglass,
  TimerStart,
  TimerPause,
  TimerEnd,
  GraduationCap,
  Building,
  DollarSign,
  Eye,
  EyeOff,
  Settings,
  HelpCircle,
  MapPin,
  Flag as FlagIcon,
  Compass as CompassIcon,
  Navigation as NavigationIcon,
  FileText,
  Image,
  Upload,
  Link,
  GitBranch,
  Terminal,
  Package,
  Layers,
  Box,
  Archive,
  Database as DatabaseIcon,
  Cloud as CloudIcon,
  Server as ServerIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Headphones as HeadphonesIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Video as VideoIcon,
  VideoOff as VideoOffIcon,
  Camera as CameraIcon,
  CameraOff as CameraOffIcon,
  Volume2 as Volume2Icon,
  VolumeX as VolumeXIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  SkipForward as SkipForwardIcon,
  Rewind as RewindIcon,
  FastForward as FastForwardIcon,
  Repeat as RepeatIcon,
  Radio as RadioIcon,
  Bell as BellIcon,
  BellOff as BellOffIcon,
  BellRing as BellRingIcon,
  Calendar as CalendarIcon,
  CalendarCheck as CalendarCheckIcon,
  CalendarX as CalendarXIcon,
  Clock as ClockIcon,
  Timer as TimerIcon,
  TimerReset as TimerResetIcon,
  TimerOff as TimerOffIcon,
  Stopwatch as StopwatchIcon,
  AlarmClock as AlarmClockIcon,
  AlarmClockOff as AlarmClockOffIcon,
  Hourglass as HourglassIcon,
  TimerStart as TimerStartIcon,
  TimerPause as TimerPauseIcon,
  TimerEnd as TimerEndIcon,
  FileText as FileTextIcon,
  Image as ImageIcon,
  Upload as UploadIcon,
  Link as LinkIcon,
  GitBranch as GitBranchIcon,
  Terminal as TerminalIcon,
  Package as PackageIcon,
  Layers as LayersIcon,
  Box as BoxIcon,
  Archive as ArchiveIcon,
  Database as DatabaseIcon,
  Cloud as CloudIcon,
  Server as ServerIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Headphones as HeadphonesIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Video as VideoIcon,
  VideoOff as VideoOffIcon,
  Camera as CameraIcon,
  CameraOff as CameraOffIcon,
  Volume2 as Volume2Icon,
  VolumeX as VolumeXIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  SkipForward as SkipForwardIcon,
  Rewind as RewindIcon,
  FastForward as FastForwardIcon,
  Repeat as RepeatIcon,
  Radio as RadioIcon,
  Bell as BellIcon,
  BellOff as BellOffIcon,
  BellRing as BellRingIcon,
  Calendar as CalendarIcon,
  CalendarCheck as CalendarCheckIcon,
  CalendarX as CalendarXIcon,
  Clock as ClockIcon,
  Timer as TimerIcon,
  TimerReset as TimerResetIcon,
  TimerOff as TimerOffIcon,
  Stopwatch as StopwatchIcon,
  AlarmClock as AlarmClockIcon,
  AlarmClockOff as AlarmClockOffIcon,
  Hourglass as HourglassIcon,
  TimerStart as TimerStartIcon,
  TimerPause as TimerPauseIcon,
  TimerEnd as TimerEndIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'business' | 'design' | 'marketing' | 'sales' | 'operations' | 'leadership' | 'other';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  description: string;
  tags: string[];
  experience: string;
  certifications?: string[];
  projects?: string[];
  tools: string[];
  proficiency: number; // 1-100
  yearsOfExperience: number;
  lastUsed?: string;
  isPrimary?: boolean;
  isLearning?: boolean;
}

interface SkillsProfile {
  personal: {
    name: string;
    email: string;
    avatar?: string;
    bio: string;
  };
  skills: {
    technical: Skill[];
    business: Skill[];
    design: Skill[];
    marketing: Skill[];
    sales: Skill[];
    operations: Skill[];
    leadership: Skill[];
    other: Skill[];
  };
  skillGap: {
    desiredSkills: string[];
    learningPlan: string[];
    timeline: string;
    resources: string[];
  };
  endorsements: {
    skills: string[];
    endorsements: Array<{
      skill: string;
      endorser: string;
      relationship: string;
      message: string;
      date: string;
    }>;
  };
}

interface SkillsSelectionProps {
  onComplete: (profile: SkillsProfile) => void;
  onSkip: () => void;
  initialData?: Partial<SkillsProfile>;
}

export default function SkillsSelection({ 
  onComplete, 
  onSkip, 
  initialData 
}: SkillsSelectionProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<SkillsProfile>({
    personal: {
      name: '',
      email: '',
      avatar: '',
      bio: ''
    },
    skills: {
      technical: [],
      business: [],
      design: [],
      marketing: [],
      sales: [],
      operations: [],
      leadership: [],
      other: []
    },
    skillGap: {
      desiredSkills: [],
      learningPlan: [],
      timeline: '',
      resources: []
    },
    endorsements: {
      skills: [],
      endorsements: []
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState<Partial<Skill>>({
    name: '',
    category: 'other',
    level: 'beginner',
    description: '',
    tags: [],
    experience: '',
    tools: [],
    proficiency: 50,
    yearsOfExperience: 0
  });
  const { toast } = useToast();

  const onboardingSteps = [
    {
      id: 'skills-assessment',
      title: 'Skills Assessment',
      description: 'Tell us about your skills and expertise',
      icon: <Brain className="w-5 h-5" />,
      progress: 25
    },
    {
      id: 'skill-categories',
      title: 'Skill Categories',
      description: 'Select your skills across different areas',
      icon: <Grid3X3 className="w-5 h-5" />,
      progress: 50
    },
    {
      id: 'proficiency-levels',
      title: 'Proficiency Levels',
      description: 'Rate your skill levels and experience',
      icon: <TrendingUp className="w-5 h-5" />,
      progress: 75
    },
    {
      id: 'skill-gaps',
      title: 'Learning Goals',
      description: 'What skills do you want to develop?',
      icon: <Lightbulb className="w-5 h-5" />,
      progress: 100
    }
  ];

  const technicalSkills = [
    { name: 'JavaScript', level: 'intermediate', description: 'Modern web development', tags: ['frontend', 'web', 'react'], tools: ['VS Code', 'Chrome DevTools'], proficiency: 75 },
    { name: 'TypeScript', level: 'intermediate', description: 'Type-safe JavaScript', tags: ['frontend', 'web', 'types'], tools: ['VS Code', 'TSC'], proficiency: 70 },
    { name: 'React', level: 'advanced', description: 'Component-based UI library', tags: ['frontend', 'web', 'ui'], tools: ['VS Code', 'React DevTools'], proficiency: 85 },
    { name: 'Node.js', level: 'intermediate', description: 'JavaScript runtime', tags: ['backend', 'server', 'api'], tools: ['VS Code', 'Node'], proficiency: 70 },
    { name: 'Python', level: 'intermediate', description: 'General purpose programming', tags: ['backend', 'data', 'ai'], tools: ['PyCharm', 'Python'], proficiency: 65 },
    { name: 'Java', level: 'beginner', description: 'Enterprise applications', tags: ['backend', 'enterprise', 'android'], tools: ['IntelliJ IDEA', 'JDK'], proficiency: 40 },
    { name: 'Go', level: 'beginner', description: 'Systems programming', tags: ['backend', 'systems', 'cloud'], tools: ['GoLand', 'Go'], proficiency: 30 },
    { name: 'Rust', level: 'beginner', description: 'Systems programming', tags: ['backend', 'systems', 'performance'], tools: ['Rust Analyzer', 'Cargo'], proficiency: 25 },
    { name: 'Docker', level: 'intermediate', description: 'Containerization', tags: ['devops', 'infrastructure', 'deployment'], tools: ['Docker Desktop', 'Docker Compose'], proficiency: 65 },
    { name: 'Kubernetes', level: 'beginner', description: 'Container orchestration', tags: ['devops', 'infrastructure', 'scaling'], tools: ['kubectl', 'k9s'], proficiency: 35 },
    { name: 'AWS', level: 'intermediate', description: 'Cloud computing platform', tags: ['cloud', 'infrastructure', 'devops'], tools: ['AWS Console', 'CLI'], proficiency: 60 },
    { name: 'PostgreSQL', level: 'intermediate', description: 'Relational database', tags: ['database', 'backend', 'sql'], tools: ['pgAdmin', 'psql'], proficiency: 70 },
    { name: 'MongoDB', level: 'beginner', description: 'NoSQL database', tags: ['database', 'backend', 'nosql'], tools: ['MongoDB Compass', 'mongosh'], proficiency: 45 },
    { name: 'Redis', level: 'intermediate', description: 'In-memory data store', tags: ['database', 'cache', 'performance'], tools: ['Redis CLI', 'RedisInsight'], proficiency: 55 },
    { name: 'GraphQL', level: 'intermediate', description: 'Query language for APIs', tags: ['api', 'backend', 'frontend'], tools: ['GraphQL Playground', 'Apollo'], proficiency: 60 },
    { name: 'REST APIs', level: 'advanced', description: 'RESTful API design', tags: ['api', 'backend', 'integration'], tools: ['Postman', 'Swagger'], proficiency: 80 },
    { name: 'Git', level: 'advanced', description: 'Version control system', tags: ['development', 'collaboration', 'versioning'], tools: ['Git', 'GitHub', 'GitLab'], proficiency: 85 },
    { name: 'CI/CD', level: 'intermediate', description: 'Continuous integration/deployment', tags: ['devops', 'automation', 'deployment'], tools: ['GitHub Actions', 'Jenkins'], proficiency: 60 },
    { name: 'Testing', level: 'intermediate', description: 'Software testing', tags: ['quality', 'testing', 'automation'], tools: ['Jest', 'Cypress', 'Selenium'], proficiency: 65 },
    { name: 'Security', level: 'beginner', description: 'Application security', tags: ['security', 'backend', 'compliance'], tools: ['OWASP ZAP', 'Burp Suite'], proficiency: 40 }
  ];

  const businessSkills = [
    { name: 'Business Strategy', level: 'intermediate', description: 'Strategic planning and execution', tags: ['strategy', 'planning', 'execution'], tools: ['SWOT Analysis', 'Business Canvas'], proficiency: 70 },
    { name: 'Marketing', level: 'intermediate', description: 'Marketing strategies and campaigns', tags: ['marketing', 'growth', 'customer'], tools: ['Google Analytics', 'HubSpot'], proficiency: 65 },
    { name: 'Sales', level: 'advanced', description: 'Sales techniques and closing', tags: ['sales', 'revenue', 'customer'], tools: ['CRM', 'Salesforce'], proficiency: 80 },
    { name: 'Finance', level: 'intermediate', description: 'Financial management and planning', tags: ['finance', 'budgeting', 'planning'], tools: ['Excel', 'QuickBooks'], proficiency: 65 },
    { name: 'Product Management', level: 'advanced', description: 'Product development and lifecycle', tags: ['product', 'development', 'lifecycle'], tools: ['Jira', 'Confluence'], proficiency: 85 },
    { name: 'Project Management', level: 'advanced', description: 'Project planning and execution', tags: ['project', 'planning', 'execution'], tools: ['Asana', 'Trello', 'MS Project'], proficiency: 80 },
    { name: 'Operations', level: 'intermediate', description: 'Business operations and efficiency', tags: ['operations', 'efficiency', 'process'], tools: ['Process Street', 'Zapier'], proficiency: 60 },
    { name: 'Human Resources', level: 'beginner', description: 'HR management and people operations', tags: ['hr', 'people', 'operations'], tools: ['Workday', 'BambooHR'], proficiency: 45 },
    { name: 'Data Analysis', level: 'intermediate', description: 'Data analysis and insights', tags: ['data', 'analytics', 'insights'], tools: ['Excel', 'Tableau', 'Power BI'], proficiency: 70 },
    { name: 'Business Development', level: 'intermediate', description: 'Partnership and growth opportunities', tags: ['business', 'growth', 'partnerships'], tools: ['LinkedIn Sales Navigator', 'CRM'], proficiency: 65 },
    { name: 'Customer Success', level: 'intermediate', description: 'Customer retention and satisfaction', tags: ['customer', 'retention', 'success'], tools: ['Gainsight', 'Zendesk'], proficiency: 60 },
    { name: 'Account Management', level: 'advanced', description: 'Client relationship management', tags: ['account', 'relationships', 'revenue'], tools: ['Salesforce', 'HubSpot'], proficiency: 75 },
    { name: 'Negotiation', level: 'intermediate', description: 'Business negotiation and deal-making', tags: ['negotiation', 'deals', 'contracts'], tools: ['Contract templates', 'LegalZoom'], proficiency: 65 },
    { name: 'Presentation Skills', level: 'advanced', description: 'Public speaking and presentations', tags: ['presentation', 'communication', 'public-speaking'], tools: ['PowerPoint', 'Keynote', 'Google Slides'], proficiency: 85 },
    { name: 'Networking', level: 'advanced', description: 'Professional networking and relationships', tags: ['networking', 'relationships', 'professional'], tools: ['LinkedIn', 'Meetup'], proficiency: 80 },
    { name: 'Leadership', level: 'intermediate', description: 'Team leadership and management', tags: ['leadership', 'management', 'team'], tools: ['15Five', 'CultureAmp'], proficiency: 70 },
    { name: 'Strategic Thinking', level: 'advanced', description: 'Strategic analysis and planning', tags: ['strategy', 'analysis', 'planning'], tools: ['SWOT', 'PESTEL'], proficiency: 85 },
    { name: 'Problem Solving', level: 'advanced', description: 'Analytical problem-solving skills', tags: ['problem-solving', 'analysis', 'critical-thinking'], tools: ['Mind mapping', 'Root cause analysis'], proficiency: 80 }
  ];

  const designSkills = [
    { name: 'UI/UX Design', level: 'advanced', description: 'User interface and experience design', tags: ['design', 'ui', 'ux'], tools: ['Figma', 'Sketch', 'Adobe XD'], proficiency: 85 },
    { name: 'Graphic Design', level: 'intermediate', description: 'Visual design and branding', tags: ['design', 'visual', 'branding'], tools: ['Adobe Creative Suite', 'Canva'], proficiency: 70 },
    { name: 'Web Design', level: 'advanced', description: 'Website design and development', tags: ['design', 'web', 'frontend'], tools: ['Figma', 'Adobe XD', 'Webflow'], proficiency: 80 },
    { name: 'Mobile Design', level: 'intermediate', description: 'Mobile app design', tags: ['design', 'mobile', 'app'], tools: ['Figma', 'Sketch', 'Adobe XD'], proficiency: 65 },
    { name: 'Product Design', level: 'advanced', description: 'Product design and user research', tags: ['design', 'product', 'research'], tools: ['Figma', 'Miro', 'UserTesting.com'], proficiency: 85 },
    { name: 'User Research', level: 'intermediate', description: 'User research and testing', tags: ['research', 'ux', 'testing'], tools: ['UserTesting.com', 'Hotjar'], proficiency: 65 },
    { name: 'Prototyping', level: 'advanced', description: 'Rapid prototyping and wireframing', tags: ['prototyping', 'wireframing', 'design'], tools: ['Figma', 'Sketch', 'Adobe XD'], proficiency: 80 },
    { name: 'Design Systems', level: 'intermediate', description: 'Design system creation and maintenance', tags: ['design', 'systems', 'components'], tools: ['Figma', 'Storybook', 'ZeroHeight'], proficiency: 70 },
    { name: 'Typography', level: 'intermediate', description: 'Typography and font design', tags: ['design', 'typography', 'fonts'], tools: ['Adobe Fonts', 'Google Fonts'], proficiency: 65 },
    { name: 'Color Theory', level: 'intermediate', description: 'Color theory and application', tags: ['design', 'color', 'theory'], tools: ['Adobe Color', 'Coolors'], proficiency: 60 },
    { name: 'Layout Design', level: 'advanced', description: 'Layout and composition', tags: ['design', 'layout', 'composition'], tools: ['Figma', 'InDesign'], proficiency: 80 },
    { name: 'Icon Design', level: 'beginner', description: 'Icon creation and design', tags: ['design', 'icons', 'illustration'], tools: ['Figma', 'Illustrator', 'Sketch'], proficiency: 40 },
    { name: 'Brand Design', level: 'intermediate', description: 'Brand identity and design', tags: ['design', 'branding', 'identity'], tools: ['Adobe Creative Suite', 'Canva'], proficiency: 65 },
    { name: 'Motion Design', level: 'beginner', description: 'Animation and motion graphics', tags: ['design', 'animation', 'video'], tools: ['After Effects', 'Lottie', 'Framer'], proficiency: 35 },
    { name: '3D Design', level: 'beginner', description: '3D modeling and design', tags: ['design', '3d', 'modeling'], tools: ['Blender', 'SketchUp', 'Fusion 360'], proficiency: 30 }
  ];

  const marketingSkills = [
    { name: 'Digital Marketing', level: 'advanced', description: 'Online marketing strategies', tags: ['marketing', 'digital', 'online'], tools: ['Google Analytics', 'HubSpot', 'SEMrush'], proficiency: 80 },
    { name: 'Content Marketing', level: 'intermediate', description: 'Content creation and strategy', tags: ['marketing', 'content', 'writing'], tools: ['WordPress', 'Medium', 'Buffer'], proficiency: 70 },
    { name: 'SEO', level: 'intermediate', description: 'Search engine optimization', tags: ['marketing', 'seo', 'search'], tools: ['Google Search Console', 'Ahrefs', 'SEMrush'], proficiency: 65 },
    { name: 'SEM', level: 'intermediate', description: 'Search engine marketing', tags: ['marketing', 'sem', 'advertising'], tools: ['Google Ads', 'Facebook Ads', 'LinkedIn Ads'], proficiency: 60 },
    { name: 'Social Media Marketing', level: 'advanced', description: 'Social media strategies', tags: ['marketing', 'social', 'media'], tools: ['Hootsuite', 'Buffer', 'Sprout Social'], proficiency: 75 },
    { name: 'Email Marketing', level: 'intermediate', description: 'Email campaigns and automation', tags: ['marketing', 'email', 'automation'], tools: ['Mailchimp', 'ConvertKit', 'SendGrid'], proficiency: 65 },
    { name: 'Affiliate Marketing', level: 'beginner', description: 'Affiliate program management', tags: ['marketing', 'affiliate', 'partnerships'], tools: ['ShareASale', 'CJ Affiliate', 'Impact'], proficiency: 40 },
    { name: 'Influencer Marketing', level: 'beginner', description: 'Influencer partnerships', tags: ['marketing', 'influencer', 'partnerships'], tools: ['Instagram', 'TikTok', 'YouTube'], proficiency: 35 },
    { name: 'Growth Hacking', level: 'intermediate', description: 'Growth strategies and tactics', tags: ['marketing', 'growth', 'analytics'], tools: ['Hotjar', 'Mixpanel', 'Google Analytics'], proficiency: 65 },
    { name: 'Marketing Analytics', level: 'intermediate', description: 'Marketing data analysis', tags: ['marketing', 'analytics', 'data'], tools: ['Google Analytics', 'Mixpanel', 'HubSpot'], proficiency: 60 },
    { name: 'Copywriting', level: 'advanced', description: 'Persuasive writing and content', tags: ['marketing', 'writing', 'content'], tools: ['Grammarly', 'Hemingway', 'CoSchedule'], proficiency: 80 },
    { name: 'Video Marketing', level: 'beginner', description: 'Video content creation', tags: ['marketing', 'video', 'content'], tools: ['Adobe Premiere', 'Final Cut Pro', 'iMovie'], proficiency: 45 },
    { name: 'Podcast Marketing', level: 'beginner', description: 'Podcast creation and promotion', tags: ['marketing', 'podcast', 'audio'], tools: ['Audacity', 'Anchor', 'Spotify'], proficiency: 30 },
    { name: 'Community Management', level: 'intermediate', description: 'Online community building', tags: ['marketing', 'community', 'engagement'], tools: ['Discord', 'Slack', 'Circle'], proficiency: 60 }
  ];

  const salesSkills = [
    { name: 'Sales Strategy', level: 'advanced', description: 'Sales planning and execution', tags: ['sales', 'strategy', 'planning'], tools: ['CRM', 'Salesforce', 'HubSpot'], proficiency: 85 },
    { name: 'Lead Generation', level: 'intermediate', description: 'Lead generation and qualification', tags: ['sales', 'leads', 'generation'], tools: ['LinkedIn', 'HubSpot', 'Pardot'], proficiency: 70 },
    { name: 'Closing', level: 'advanced', description: 'Sales closing techniques', tags: ['sales', 'closing', 'negotiation'], tools: ['CRM', 'Salesforce', 'Chorus.ai'], proficiency: 80 },
    { name: 'Cold Calling', level: 'intermediate', description: 'Cold calling techniques', tags: ['sales', 'calling', 'outreach'], tools: ['RingCentral', 'Aircall', 'Dialpad'], proficiency: 60 },
    { name: 'Relationship Selling', level: 'advanced', description: 'Relationship-based sales', tags: ['sales', 'relationships', 'customer'], tools: ['CRM', 'LinkedIn', 'Salesforce'], proficiency: 85 },
    { name: 'Solution Selling', level: 'intermediate', description: 'Solution-based selling', tags: ['sales', 'solutions', 'consultative'], tools: ['CRM', 'Salesforce', 'HubSpot'], proficiency: 65 },
    { name: 'Sales Analytics', level: 'intermediate', description: 'Sales data analysis', tags: ['sales', 'analytics', 'data'], tools: ['CRM', 'Salesforce', 'Tableau'], proficiency: 60 },
    { name: 'Sales Training', level: 'beginner', description: 'Sales training and coaching', tags: ['sales', 'training', 'coaching'], tools: ['LinkedIn Learning', 'Coursera', 'Udemy'], proficiency: 45 },
    { name: 'Negotiation', level: 'advanced', description: 'Sales negotiation', tags: ['sales', 'negotiation', 'deals'], tools: ['Contract templates', 'LegalZoom'], proficiency: 75 },
    { name: 'Account Management', level: 'advanced', description: 'Key account management', tags: ['sales', 'accounts', 'relationships'], tools: ['CRM', 'Salesforce', 'Gainsight'], proficiency: 80 },
    { name: 'Sales Automation', level: 'intermediate', description: 'Sales process automation', tags: ['sales', 'automation', 'efficiency'], tools: ['HubSpot', 'Pardot', 'Outreach'], proficiency: 65 },
    { name: 'Social Selling', level: 'intermediate', description: 'Social media sales', tags: ['sales', 'social', 'linkedin'], tools: ['LinkedIn Sales Navigator', 'Hootsuite'], proficiency: 70 },
    { name: 'Product Knowledge', level: 'advanced', description: 'Product expertise', tags: ['sales', 'product', 'knowledge'], tools: ['Product documentation', 'Training materials'], proficiency: 85 }
  ];

  const operationsSkills = [
    { name: 'Process Improvement', level: 'intermediate', description: 'Business process optimization', tags: ['operations', 'process', 'efficiency'], tools: ['Process Street', 'Zapier', 'Airtable'], proficiency: 65 },
    { name: 'Supply Chain', level: 'beginner', description: 'Supply chain management', tags: ['operations', 'supply-chain', 'logistics'], tools: ['SAP', 'Oracle', 'ShipBob'], proficiency: 40 },
    { name: 'Logistics', level: 'intermediate', description: 'Logistics and distribution', tags: ['operations', 'logistics', 'distribution'], tools: ['FedEx', 'UPS', 'DHL'], proficiency: 55 },
    { name: 'Quality Management', level: 'intermediate', description: 'Quality control and assurance', tags: ['operations', 'quality', 'assurance'], tools: ['ISO standards', 'Six Sigma'], proficiency: 60 },
    { name: 'Risk Management', level: 'beginner', description: 'Risk assessment and mitigation', tags: ['operations', 'risk', 'compliance'], tools: ['Risk assessment tools', 'Compliance software'], proficiency: 45 },
    { name: 'Compliance', level: 'intermediate', description: 'Regulatory compliance', tags: ['operations', 'compliance', 'legal'], tools: ['Compliance software', 'Legal templates'], proficiency: 55 },
    { name: 'Vendor Management', level: 'intermediate', description: 'Vendor relationships and procurement', tags: ['operations', 'vendors', 'procurement'], tools: ['Procurement software', 'ERP systems'], proficiency: 60 },
    { name: 'Facilities Management', level: 'beginner', description: 'Facilities and workspace management', tags: ['operations', 'facilities', 'workspace'], tools: ['Facilities software', 'Space planning tools'], proficiency: 35 },
    { name: 'IT Operations', level: 'intermediate', description: 'IT infrastructure and support', tags: ['operations', 'it', 'infrastructure'], tools: ['ITIL', 'ServiceNow', 'Jira Service Management'], proficiency: 60 },
    { name: 'Customer Support', level: 'intermediate', description: 'Customer support operations', tags: ['operations', 'support', 'customer'], tools: ['Zendesk', 'Freshdesk', 'Intercom'], proficiency: 65 },
    { name: 'Business Intelligence', level: 'beginner', description: 'Business intelligence and reporting', tags: ['operations', 'bi', 'reporting'], tools: ['Power BI', 'Tableau', 'Looker'], proficiency: 40 },
    { name: 'Change Management', level: 'intermediate', description: 'Organizational change management', tags: ['operations', 'change', 'transformation'], tools: ['Change management software', 'Communication tools'], proficiency: 55 }
  ];

  const leadershipSkills = [
    { name: 'Team Leadership', level: 'advanced', description: 'Team management and motivation', tags: ['leadership', 'team', 'management'], tools: ['15Five', 'CultureAmp', 'Lattice'], proficiency: 80 },
    { name: 'Strategic Leadership', level: 'advanced', description: 'Strategic vision and planning', tags: ['leadership', 'strategy', 'vision'], tools: ['Strategic planning tools', 'Executive dashboards'], proficiency: 85 },
    { name: 'Executive Leadership', level: 'intermediate', description: 'Executive management', tags: ['leadership', 'executive', 'management'], tools: ['Executive software', 'Board management tools'], proficiency: 70 },
    { name: 'Coaching', level: 'intermediate', description: 'Team coaching and development', tags: ['leadership', 'coaching', 'development'], tools: ['Coaching software', 'Performance management'], proficiency: 65 },
    { name: 'Mentoring', level: 'advanced', description: 'Mentorship and guidance', tags: ['leadership', 'mentoring', 'guidance'], tools: ['Mentoring software', 'Knowledge sharing'], proficiency: 80 },
    { name: 'Delegation', level: 'intermediate', description: 'Effective delegation', tags: ['leadership', 'delegation', 'empowerment'], tools: ['Project management tools', 'Task tracking'], proficiency: 70 },
    { name: 'Communication', level: 'advanced', description: 'Leadership communication', tags: ['leadership', 'communication', 'stakeholder'], tools: ['Communication tools', 'Presentation software'], proficiency: 85 },
    { name: 'Decision Making', level: 'advanced', description: 'Strategic decision making', tags: ['leadership', 'decision-making', 'strategy'], tools: ['Decision frameworks', 'Analytics tools'], proficiency: 80 },
    { name: 'Conflict Resolution', level: 'intermediate', description: 'Conflict management and resolution', tags: ['leadership', 'conflict', 'resolution'], tools: ['Conflict resolution tools', 'Mediation software'], proficiency: 65 },
    { name: 'Talent Management', level: 'intermediate', description: 'Talent acquisition and retention', tags: ['leadership', 'talent', 'hr'], tools: ['ATS software', 'Performance management'], proficiency: 60 },
    { name: 'Change Leadership', level: 'intermediate', description: 'Organizational change leadership', tags: ['leadership', 'change', 'transformation'], tools: ['Change management tools', 'Communication platforms'], proficiency: 70 },
    { name: 'Innovation Leadership', level: 'intermediate', description: 'Fostering innovation and creativity', tags: ['leadership', 'innovation', 'creativity'], tools: ['Innovation software', 'Idea management'], proficiency: 65 },
    { name: 'Servant Leadership', level: 'intermediate', description: 'Servant leadership approach', tags: ['leadership', 'servant', 'service'], tools: ['Leadership assessments', 'Feedback tools'], proficiency: 70 }
  ];

  const otherSkills = [
    { name: 'Languages', level: 'intermediate', description: 'Multiple languages', tags: ['languages', 'communication', 'global'], tools: ['Duolingo', 'Babbel', 'Rosetta Stone'], proficiency: 60 },
    { name: 'Public Speaking', level: 'advanced', description: 'Public speaking and presentations', tags: ['communication', 'speaking', 'presentations'], tools: ['PowerPoint', 'Keynote', 'Google Slides'], proficiency: 80 },
    { name: 'Writing', level: 'advanced', description: 'Professional writing skills', tags: ['communication', 'writing', 'content'], tools: ['Grammarly', 'Hemingway', 'CoSchedule'], proficiency: 85 },
    { name: 'Research', level: 'intermediate', description: 'Research and analysis', tags: ['research', 'analysis', 'investigation'], tools: ['Google Scholar', 'Academic databases'], proficiency: 70 },
    { name: 'Teaching', level: 'intermediate', description: 'Teaching and training', tags: ['teaching', 'training', 'education'], tools: ['Teaching platforms', 'LMS software'], proficiency: 65 },
    { name: 'Photography', level: 'beginner', description: 'Photography skills', tags: ['photography', 'visual', 'creative'], tools: ['Adobe Lightroom', 'Photoshop', 'Camera equipment'], proficiency: 40 },
    { name: 'Video Production', level: 'beginner', description: 'Video creation and editing', tags: ['video', 'production', 'creative'], tools: ['Adobe Premiere', 'Final Cut Pro', 'iMovie'], proficiency: 45 },
    { name: 'Music', level: 'beginner', description: 'Music creation and performance', tags: ['music', 'creative', 'performance'], tools: ['DAW software', 'Instruments'], proficiency: 35 },
    { name: 'Art', level: 'beginner', description: 'Artistic skills', tags: ['art', 'creative', 'visual'], tools: ['Digital art software', 'Traditional art tools'], proficiency: 30 },
    { name: 'Gaming', level: 'beginner', description: 'Game development and design', tags: ['gaming', 'development', 'creative'], tools: ['Unity', 'Unreal Engine', 'GameMaker'], proficiency: 25 }
  ];

  useEffect(() => {
    if (initialData) {
      setProfile(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const validateStep = (stepId: string): boolean => {
    const errors: Record<string, string> = {};

    switch (stepId) {
      case 'skills-assessment':
        if (!profile.personal.name.trim()) errors.name = 'Name is required';
        if (!profile.personal.email.trim()) errors.email = 'Email is required';
        if (!profile.personal.bio.trim()) errors.bio = 'Bio is required';
        break;
      case 'skill-categories':
        const totalSkills = Object.values(profile.skills).reduce((sum, category) => sum + category.length, 0);
        if (totalSkills === 0) errors.skills = 'Select at least one skill';
        break;
      case 'proficiency-levels':
        const incompleteSkills = Object.values(profile.skills).some(category => 
          category.some(skill => skill.proficiency === 0)
        );
        if (incompleteSkills) errors.proficiency = 'Set proficiency levels for all skills';
        break;
      case 'skill-gaps':
        if (profile.skillGap.desiredSkills.length === 0) {
          errors.desiredSkills = 'Select at least one skill to learn';
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
        title: "Skills profile completed",
        description: "Your skills profile has been saved successfully."
      });
    }, 1000);
  };

  const handleSkillToggle = (category: keyof typeof profile.skills, skillName: string) => {
    const skillTemplates = {
      technical: technicalSkills,
      business: businessSkills,
      design: designSkills,
      marketing: marketingSkills,
      sales: salesSkills,
      operations: operationsSkills,
      leadership: leadershipSkills,
      other: otherSkills
    };

    const skillTemplate = skillTemplates[category]?.find(s => s.name === skillName);
    if (!skillTemplate) return;

    setProfile(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].some(s => s.name === skillName)
          ? prev.skills[category].filter(s => s.name !== skillName)
          : [...prev.skills[category], {
              id: skillName.toLowerCase().replace(/\s+/g, '-'),
              name: skillName,
              category,
              level: skillTemplate.level,
              description: skillTemplate.description,
              tags: skillTemplate.tags,
              experience: '',
              tools: skillTemplate.tools,
              proficiency: 50,
              yearsOfExperience: 0
            }]
      }
    }));
  };

  const handleSkillUpdate = (category: keyof typeof profile.skills, skillId: string, updates: Partial<Skill>) => {
    setProfile(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].map(skill => 
          skill.id === skillId ? { ...skill, ...updates } : skill
        )
      }
    }));
  };

  const handleDesiredSkillToggle = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      skillGap: {
        ...prev.skillGap,
        desiredSkills: prev.skillGap.desiredSkills.includes(skill)
          ? prev.skillGap.desiredSkills.filter(s => s !== skill)
          : [...prev.skillGap.desiredSkills, skill]
      }
    }));
  };

  const filteredSkills = (category: keyof typeof profile.skills) => {
    return profile.skills[category].filter(skill => {
      const matchesSearch = searchQuery === '' || 
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesLevel = selectedLevel === 'all' || skill.level === selectedLevel;
      
      return matchesSearch && matchesLevel;
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <Code className="w-5 h-5" />;
      case 'business': return <Briefcase className="w-5 h-5" />;
      case 'design': return <Palette className="w-5 h-5" />;
      case 'marketing': return <Megaphone className="w-5 h-5" />;
      case 'sales': return <BarChart3 className="w-5 h-5" />;
      case 'operations': return <Settings className="w-5 h-5" />;
      case 'leadership': return <Crown className="w-5 h-5" />;
      case 'other': return <Sparkles className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'expert': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProficiencyColor = (proficiency: number) => {
    if (proficiency >= 80) return 'bg-green-500';
    if (proficiency >= 60) return 'bg-blue-500';
    if (proficiency >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const renderStepContent = () => {
    const currentStepData = onboardingSteps[currentStep];

    switch (currentStepData.id) {
      case 'skills-assessment':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Skills Assessment</h2>
              <p className="text-muted-foreground">Tell us about your skills and expertise</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Name *</label>
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
                  <label className="text-sm font-medium mb-1 block">Bio *</label>
                  <Textarea
                    value={profile.personal.bio}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      personal: { ...prev.personal, bio: e.target.value }
                    }))}
                    placeholder="Tell us about your skills and experience..."
                    rows={4}
                    className={validationErrors.bio ? 'border-red-500' : ''}
                  />
                  {validationErrors.bio && (
                    <p className="text-sm text-red-500">{validationErrors.bio}</p>
                  )}
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

              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Skills Overview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Object.values(profile.skills).reduce((sum, category) => sum + category.length, 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Skills</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Object.values(profile.skills).reduce((sum, category) => 
                          sum + category.reduce((avg, skill) => avg + skill.proficiency, 0) / (category.length || 1), 0) / 8
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Avg Proficiency</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(profile.skills).map(([category, skills]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(category)}
                          <span className="text-sm font-medium capitalize">{category}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{skills.length} skills</span>
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${(skills.reduce((avg, skill) => avg + skill.proficiency, 0) / (skills.length || 1))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'skill-categories':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Skill Categories</h2>
              <p className="text-muted-foreground">Select your skills across different areas</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="leadership">Leadership</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search skills..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>

                <Button variant="outline" onClick={() => setShowAddSkill(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Custom Skill
                </Button>
              </div>

              <ScrollArea className="max-h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(selectedCategory === 'all' ? 
                    Object.entries(profile.skills).map(([category, skills]) => (
                      <div key={category} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(category)}
                            <h3 className="font-semibold capitalize">{category}</h3>
                          </div>
                          <Badge variant="outline">
                            {skills.length} skills
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {filteredSkills(category as keyof typeof profile.skills).map((skill) => (
                            <motion.div
                              key={skill.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.02 }}
                              className="cursor-pointer"
                              onClick={() => handleSkillToggle(category as keyof typeof profile.skills, skill.name)}
                            >
                              <Card className={`hover:shadow-md transition-shadow ${
                                profile.skills[category as keyof typeof profile.skills].some(s => s.id === skill.id) 
                                  ? 'border-primary bg-primary/5' 
                                  : ''
                              }`}>
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium">{skill.name}</h4>
                                    <Badge className={getLevelColor(skill.level)}>
                                      {skill.level}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                    {skill.description}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {skill.tags.slice(0, 3).map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Proficiency: {skill.proficiency}%</span>
                                    <div className="w-16 bg-muted rounded-full h-1">
                                      <div 
                                        className={`h-1 rounded-full ${getProficiencyColor(skill.proficiency)}`}
                                        style={{ width: `${skill.proficiency}%` }}
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )) : (
                      <div className="space-y-2">
                        {filteredSkills(selectedCategory as keyof typeof profile.skills).map((skill) => (
                          <motion.div
                            key={skill.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02 }}
                            className="cursor-pointer"
                            onClick={() => handleSkillToggle(selectedCategory as keyof typeof profile.skills, skill.name)}
                          >
                            <Card className={`hover:shadow-md transition-shadow ${
                              profile.skills[selectedCategory as keyof typeof profile.skills].some(s => s.id === skill.id) 
                                ? 'border-primary bg-primary/5' 
                                : ''
                            }`}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">{skill.name}</h4>
                                  <Badge className={getLevelColor(skill.level)}>
                                    {skill.level}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {skill.description}
                                </p>
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {skill.tags.slice(0, 3).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>Proficiency: {skill.proficiency}%</span>
                                  <div className="w-16 bg-muted rounded-full h-1">
                                    <div 
                                      className={`h-1 rounded-full ${getProficiencyColor(skill.proficiency)}`}
                                      style={{ width: `${skill.proficiency}%` }}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </ScrollArea>

              {validationErrors.skills && (
                <p className="text-sm text-red-500">{validationErrors.skills}</p>
              )}
            </div>
          </div>
        );

      case 'proficiency-levels':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Proficiency Levels</h2>
              <p className="text-muted-foreground">Rate your skill levels and experience</p>
            </div>

            <div className="space-y-8">
              {Object.entries(profile.skills).map(([category, skills]) => (
                <div key={category} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(category)}
                      <h3 className="text-lg font-semibold capitalize">{category}</h3>
                    </div>
                    <Badge variant="outline">
                      {skills.length} skills
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {skills.map((skill) => (
                      <Card key={skill.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-medium">{skill.name}</h4>
                              <Badge className={getLevelColor(skill.level)}>
                                {skill.level}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSkillToggle(category as keyof typeof profile.skills, skill.name)}
                              >
                                {profile.skills[category as keyof typeof profile.skills].some(s => s.id === skill.id) ? 'Remove' : 'Add'}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-1 block">Proficiency Level</label>
                              <Select
                                value={skill.level}
                                onValueChange={(value) => handleSkillUpdate(category as keyof typeof profile.skills, skill.id, { level: value as any })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="beginner">Beginner</SelectItem>
                                  <SelectItem value="intermediate">Intermediate</SelectItem>
                                  <SelectItem value="advanced">Advanced</SelectItem>
                                  <SelectItem value="expert">Expert</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-1 block">Proficiency ({skill.proficiency}%)</label>
                              <div className="flex items-center space-x-4">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={skill.proficiency}
                                  onChange={(e) => handleSkillUpdate(category as keyof typeof profile.skills, skill.id, { proficiency: parseInt(e.target.value) || 0 })}
                                  className="flex-1"
                                />
                                <span className="text-sm font-medium w-12">
                                  {skill.proficiency}%
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-1 block">Years of Experience</label>
                              <div className="flex items-center space-x-4">
                                <input
                                  type="number"
                                  min="0"
                                  max="50"
                                  value={skill.yearsOfExperience}
                                  onChange={(e) => handleSkillUpdate(category as keyof typeof profile.skills, skill.id, { yearsOfExperience: parseInt(e.target.value) || 0 })}
                                  className="flex-1"
                                />
                                <span className="text-sm font-medium w-12">
                                  {skill.yearsOfExperience} years
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-1 block">Experience Description</label>
                              <Textarea
                                value={skill.experience}
                                onChange={(e) => handleSkillUpdate(category as keyof typeof profile.skills, skill.id, { experience: e.target.value })}
                                placeholder="Describe your experience with this skill..."
                                rows={2}
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-1 block">Tools & Technologies</label>
                              <div className="flex flex-wrap gap-2">
                                {skill.tools.map((tool, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tool}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-1 block">Tags</label>
                              <div className="flex flex-wrap gap-2">
                                {skill.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {validationErrors.proficiency && (
              <p className="text-sm text-red-500">{validationErrors.proficiency}</p>
            )}
          </div>
        );

      case 'skill-gaps':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Learning Goals</h2>
              <p className="text-muted-foreground">What skills do you want to develop?</p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Desired Skills *</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Machine Learning', 'Artificial Intelligence', 'Blockchain', 'Cybersecurity', 'Cloud Architecture',
                    'Data Science', 'DevOps', 'Mobile Development', 'Web Development',
                    'Product Management', 'UX Research', 'Business Analysis', 'Financial Modeling',
                    'Public Speaking', 'Negotiation', 'Team Leadership', 'Project Management',
                    'Agile Methodologies', 'Scrum', 'Kanban', 'Lean Manufacturing', 'Six Sigma'
                  ].map(skill => (
                    <Badge
                      key={skill}
                      variant={profile.skillGap.desiredSkills.includes(skill) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleDesiredSkillToggle(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
                {validationErrors.desiredSkills && (
                  <p className="text-sm text-red-500">{validationErrors.desiredSkills}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Learning Plan</label>
                  <Textarea
                    value={profile.skillGap.learningPlan.join('\n')}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      skillGap: { 
                        ...prev.skillGap, 
                        learningPlan: e.target.value.split('\n').filter(s => s.trim())
                      }
                    }))}
                    placeholder="Outline your learning plan..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Timeline</label>
                  <Input
                    value={profile.skillGap.timeline}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      skillGap: { ...prev.skillGap, timeline: e.target.value }
                    }))}
                    placeholder="e.g., 6 months, 1 year"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Learning Resources</label>
                <Textarea
                  value={profile.skillGap.resources.join('\n')}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    skillGap: { 
                      ...prev.skillGap, 
                      resources: e.target.value.split('\n').filter(s => s.trim())
                    }
                  }))}
                  placeholder="List learning resources (courses, books, platforms, mentors)..."
                  rows={3}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Learning Progress</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Skills to Learn</span>
                    <span className="text-sm font-medium">{profile.skillGap.desiredSkills.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-currentSkills">Current Skills</span>
                    <span className="text-sm font-medium">
                      {Object.values(profile.skills).reduce((sum, category) => sum + category.length, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Learning Plan</span>
                    <span className="text-sm font-medium">
                      {profile.skillGap.learningPlan.length > 0 ? 'Created' : 'Not created'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Timeline</span>
                    <span className="text-sm font-medium">
                      {profile.skillGap.timeline || 'Not set'}
                    </span>
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
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Skills Selection</h1>
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
                  description: "Your skills profile has been saved."
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

      {/* Add Skill Modal */}
      <AnimatePresence>
        {showAddSkill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddSkill(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-background rounded-xl shadow-xl max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Add Custom Skill</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddSkill(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Skill Name *</label>
                  <Input
                    value={newSkill.name}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter skill name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Category *</label>
                  <Select
                    value={newSkill.category}
                    onValueChange={(value) => setNewSkill(prev => ({ ...prev, category: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="leadership">Leadership</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Level *</label>
                  <Select
                    value={newSkill.level}
                    onValueChange={(value) => setNewSkill(prev => ({ ...prev, level: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea
                    value={newSkill.description}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this skill..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Tags</label>
                  <Input
                    value={newSkill.tags.join(', ')}
                    onChange={(e) => setNewSkill(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    }))}
                    placeholder="Enter tags separated by commas"
                  />
                </div>

                <div>
                  <Button 
                    onClick={() => {
                      if (newSkill.name.trim()) {
                        const skillId = newSkill.name.toLowerCase().replace(/\s+/g, '-');
                        const updatedSkill = {
                          id: skillId,
                          name: newSkill.name,
                          category: newSkill.category,
                          level: newSkill.level,
                          description: newSkill.description,
                          tags: newSkill.tags,
                          experience: '',
                          tools: [],
                          proficiency: 50,
                          yearsOfExperience: 0
                        };
                        
                        setProfile(prev => ({
                          ...prev,
                          skills: {
                            ...prev.skills,
                            [newSkill.category]: [...prev.skills[newSkill.category], updatedSkill]
                          }
                        }));
                        
                        setNewSkill({
                          name: '',
                          category: 'other',
                          level: 'beginner',
                          description: '',
                          tags: [],
                          experience: '',
                          tools: [],
                          proficiency: 50,
                          yearsOfExperience: 0
                        });
                        
                        setShowAddSkill(false);
                        toast({
                          title: "Skill added",
                          description: `${newSkill.name} has been added to your skills.`
                        });
                      }
                    }}
                    className="w-full"
                  >
                    Add Skill
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
